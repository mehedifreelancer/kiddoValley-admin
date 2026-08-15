"use client";

import { Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
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
  createEmployeeBill,
  deleteEmployeeBill,
  getEmployeeBills,
  updateEmployeeBill,
} from "./employee-bill.service";
import { EmployeeBill } from "./employee-bill.types";

export const EmployeeBillManagement = () => {
  const [items, setItems] = useState<EmployeeBill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selected, setSelected] = useState<EmployeeBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [page, rows, debouncedSearch]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeBills(page, rows, debouncedSearch);
      if (res.success) {
        setItems(res.data);
        setTotalRecords(res.pagination.total);
      } else {
        toast.error("Failed to fetch");
      }
    } catch (error) {
      toast.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.first / event.rows + 1);
  };

  const resetForm = () => {
    setFormName("");
    setFormAmount(0);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormError("");
  };

  const openCreateModal = () => {
    resetForm();
    setSelected(null);
    setModalFor("create");
  };

  const openEditModal = (item: EmployeeBill) => {
    resetForm();
    setSelected(item);
    setFormName(item.name);
    setFormAmount(item.amount);
    setFormDate(new Date(item.date).toISOString().split("T")[0]);
    setFormDescription(item.description || "");
    setModalFor("edit");
  };

  const openDeleteModal = (item: EmployeeBill) => {
    setSelected(item);
    setModalFor("delete");
  };

  const closeModal = () => {
    setModalFor(null);
    setSelected(null);
    resetForm();
  };

  const validateForm = () => {
    if (!formName.trim()) {
      setFormError("Name is required");
      return false;
    }
    if (formAmount <= 0) {
      setFormError("Amount must be positive");
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
      await createEmployeeBill({
        name: formName.trim(),
        amount: formAmount,
        date: formDate || undefined,
        description: formDescription.trim() || undefined,
      });
      toast.success("Created and cash deducted");
      closeModal();
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !selected) return;
    setSubmitting(true);
    try {
      await updateEmployeeBill(selected.id, {
        name: formName.trim(),
        amount: formAmount,
        date: formDate || undefined,
        description: formDescription.trim() || undefined,
      });
      toast.success("Updated");
      closeModal();
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteEmployeeBill(selected.id);
      toast.success("Deleted and cash refunded");
      closeModal();
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const dateBody = (row: EmployeeBill) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(row.date).toLocaleDateString()}
    </span>
  );
  const amountBody = (row: EmployeeBill) => (
    <span className="font-semibold text-red-600 dark:text-red-400">
      ৳{row.amount.toFixed(2)}
    </span>
  );
  const descriptionBody = (row: EmployeeBill) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {row.description || "—"}
    </span>
  );
  const actionsBody = (row: EmployeeBill) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(row)}
        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Employee Bills">
        <div className="flex gap-2 items-center">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Add Bill
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={items}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No bills found"
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
            header="Name"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={amountBody}
            header="Amount"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ textAlign: "right" }}
          />
          <Column
            body={dateBody}
            header="Date"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "150px" }}
          />
          <Column
            body={descriptionBody}
            header="Description"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={actionsBody}
            header="Actions"
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {/* Create Modal */}
      {modalFor === "create" && (
        <Modal isOpen={true} onClose={closeModal} title="Add Employee Bill">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <InputField
              label="Name"
              name="name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              autoFocus
              disabled={submitting}
            />
            <InputField
              label="Amount (৳)"
              name="amount"
              type="number"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
              required
              disabled={submitting}
            />
            <InputField
              label="Date"
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
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={submitting}
            />
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
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
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modalFor === "edit" && selected && (
        <Modal isOpen={true} onClose={closeModal} title="Edit Bill">
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <InputField
              label="Name"
              name="name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              autoFocus
              disabled={submitting}
            />
            <InputField
              label="Amount (৳)"
              name="amount"
              type="number"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
              required
              disabled={submitting}
            />
            <InputField
              label="Date"
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
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={submitting}
            />
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
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
                Update
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selected && (
        <Modal isOpen={true} onClose={closeModal} title="Delete Bill">
          <p>
            Are you sure you want to delete bill for{" "}
            <strong>{selected.name}</strong> (৳{selected.amount})? This will
            refund cash.
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
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeBillManagement;
