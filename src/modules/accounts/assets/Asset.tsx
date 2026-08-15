"use client";

import {
  DollarSign,
  Edit,
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../../components/ui/Button";
import DataTableSearch from "../../../components/ui/DataTableSearch";
import InputField from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import {
  createAsset,
  deleteAsset,
  getAssets,
  sellAsset,
  updateAsset,
} from "./asset.service";
import { Asset } from "./asset.types";

export const AssetManagement = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState<number>(0);
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [deductFromCash, setDeductFromCash] = useState(false);

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellDate, setSellDate] = useState("");

  // ✅ টোটাল অ্যাসেট ভ্যালু (assets অ্যারে থেকে)
  const totalAssetValue = assets.reduce((sum, a) => sum + a.value, 0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAssets();
  }, [page, rows, debouncedSearch]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await getAssets(page, rows, debouncedSearch);
      if (res.success) {
        setAssets(res.data);
        setTotalRecords(res.pagination.total);
      } else {
        toast.error("Failed to fetch assets");
      }
    } catch (error) {
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.first / event.rows + 1);
  };

  const resetFormError = () => setFormError("");

  const resetForm = () => {
    setFormName("");
    setFormValue(0);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setDeductFromCash(false);
  };

  const openCreateModal = () => {
    resetFormError();
    resetForm();
    setSelectedAsset(null);
    setModalFor("create");
  };

  const openEditModal = (asset: Asset) => {
    resetFormError();
    setSelectedAsset(asset);
    setFormName(asset.name);
    setFormValue(asset.value);
    setFormDate(new Date(asset.purchaseDate).toISOString().split("T")[0]);
    setFormDescription(asset.description || "");
    setDeductFromCash(false); // ✅ Edit-এ ডিফল্ট false
    setModalFor("edit");
  };

  const openDeleteModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalFor("delete");
  };

  const openSellModal = (asset: Asset) => {
    setSellingAsset(asset);
    setSellPrice(asset.value);
    setSellDate(new Date().toISOString().split("T")[0]);
    setShowSellModal(true);
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedAsset(null);
    resetFormError();
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formName.trim()) {
      setFormError("Asset name is required");
      return false;
    }
    if (formValue <= 0) {
      setFormError("Value must be greater than 0");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        value: formValue,
        purchaseDate: formDate || undefined,
        description: formDescription.trim() || undefined,
        deductFromCash: deductFromCash,
      };
      await createAsset(payload);
      toast.success(
        "Asset created" + (deductFromCash ? " and cash deducted" : ""),
      );
      closeModal();
      fetchAssets();
    } catch (error: any) {
      if (error.response?.data?.message?.includes("Insufficient cash")) {
        toast.error("⚠️ Insufficient cash balance. Please add cash first.");
      } else {
        toast.error(error.message || "Failed to create asset");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !selectedAsset) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        value: formValue,
        purchaseDate: formDate || undefined,
        description: formDescription.trim() || undefined,
        deductFromCash: deductFromCash, // ✅ Edit-এও পাঠানো হচ্ছে
      };
      await updateAsset(selectedAsset.id, payload);
      toast.success(
        "Asset updated" + (deductFromCash ? " and cash adjusted" : ""),
      );
      closeModal();
      fetchAssets();
    } catch (error: any) {
      if (error.response?.data?.message?.includes("Insufficient cash")) {
        toast.error("⚠️ Insufficient cash balance. Please add cash first.");
      } else {
        toast.error(error.message || "Failed to update asset");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setSubmitting(true);
    try {
      await deleteAsset(selectedAsset.id);
      toast.success("Asset deleted");
      closeModal();
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellSubmit = async () => {
    if (!sellingAsset) return;
    if (sellPrice < 0) {
      toast.error("Sell price cannot be negative");
      return;
    }
    setSubmitting(true);
    try {
      const res = await sellAsset(sellingAsset.id, sellPrice, sellDate);
      toast.success(res.message || "Asset sold successfully");
      setShowSellModal(false);
      setSellingAsset(null);
      fetchAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to sell asset");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Table Columns ----------
  const dateBody = (row: Asset) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(row.purchaseDate).toLocaleDateString()}
    </span>
  );

  const valueBody = (row: Asset) => (
    <span className="font-semibold text-green-600 dark:text-green-400">
      ৳{row.value.toFixed(2)}
    </span>
  );

  const descriptionBody = (row: Asset) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {row.description || "—"}
    </span>
  );

  const actionsBody = (row: Asset) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(row)}
        className="p-1 cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openSellModal(row)}
        className="p-1 cursor-pointer text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded transition-colors"
        title="Sell"
      >
        <DollarSign className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Assets">
        <div className="flex gap-2 items-center">
          {/* Total Asset Value Badge */}
          <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 text-nowrap">
              Total Value: ৳{totalAssetValue.toFixed(2)}
            </span>
          </div>
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search assets..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssets}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={assets}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No assets found"
          stripedRows
          rowClassName={() => "table-row"}
        >
          <Column
            field="id"
            header="ID"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "80px" }}
          />
          <Column
            field="name"
            header="Asset Name"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="value"
            header="Value"
            sortable
            body={valueBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ textAlign: "right" }}
          />
          <Column
            field="purchaseDate"
            header="Purchase Date"
            sortable
            body={dateBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "150px" }}
          />
          <Column
            field="description"
            header="Description"
            body={descriptionBody}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Actions"
            body={actionsBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "140px" }}
          />
        </DataTable>
      </div>

      {/* Create Modal */}
      {modalFor === "create" && (
        <Modal isOpen={true} onClose={closeModal} title="Add New Asset">
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-5">
              <InputField
                label="Asset Name"
                name="name"
                type="text"
                placeholder="Enter asset name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />
              <InputField
                label="Value (৳)"
                name="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formValue}
                onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                required
                disabled={submitting}
              />
              <InputField
                label="Purchase Date"
                name="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={submitting}
              />
              <InputField
                label="Description (optional)"
                name="description"
                type="text"
                placeholder="Brief description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={submitting}
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="deductFromCash"
                  checked={deductFromCash}
                  onChange={(e) => setDeductFromCash(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="deductFromCash"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Deduct this amount from cash balance
                </label>
              </div>
              {deductFromCash && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Cash balance will be reduced by ৳{formValue || 0}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="outline"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Create Asset
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal - with checkbox */}
      {modalFor === "edit" && selectedAsset && (
        <Modal isOpen={true} onClose={closeModal} title="Edit Asset">
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-5">
              <InputField
                label="Asset Name"
                name="name"
                type="text"
                placeholder="Enter asset name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />
              <InputField
                label="Value (৳)"
                name="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formValue}
                onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                required
                disabled={submitting}
              />
              <InputField
                label="Purchase Date"
                name="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={submitting}
              />
              <InputField
                label="Description (optional)"
                name="description"
                type="text"
                placeholder="Brief description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={submitting}
              />

              {/* ✅ Edit-তেও চেকবক্স */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editDeductFromCash"
                  checked={deductFromCash}
                  onChange={(e) => setDeductFromCash(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="editDeductFromCash"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Adjust cash balance for value difference
                </label>
              </div>
              {deductFromCash && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Cash will be adjusted by difference (৳
                  {(formValue - (selectedAsset?.value || 0)).toFixed(2)})
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="outline"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Update Asset
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selectedAsset && (
        <Modal isOpen={true} onClose={closeModal} title="Delete Asset">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the asset{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{selectedAsset.name}"
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={closeModal}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                loading={submitting}
              >
                Delete Asset
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sell Modal */}
      {showSellModal && sellingAsset && (
        <Modal
          isOpen={true}
          onClose={() => setShowSellModal(false)}
          title={`Sell Asset: ${sellingAsset.name}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Book Value:{" "}
                <span className="font-semibold text-gray-800 dark:text-white">
                  ৳{sellingAsset.value.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sell price will be added to your cash balance.
              </p>
            </div>

            <InputField
              label="Sell Price (৳)"
              type="number"
              step="0.01"
              placeholder="Enter selling price"
              value={sellPrice}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
              required
            />

            <InputField
              label="Date"
              type="date"
              value={sellDate}
              onChange={(e) => setSellDate(e.target.value)}
            />

            {sellPrice > 0 && (
              <div
                className={`text-sm p-2 rounded ${sellPrice >= sellingAsset.value ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
              >
                {sellPrice >= sellingAsset.value ? "✅ Gain" : "⚠️ Loss"}:{" "}
                {Math.abs(sellPrice - sellingAsset.value).toFixed(2)} TK
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowSellModal(false)}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSellSubmit}
                loading={submitting}
              >
                Confirm Sell
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetManagement;
