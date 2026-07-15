import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { supplierSchema } from "./supplier.schema";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "./supplier.service";
import { Supplier } from "./supplier.types";

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers(globalFilter);
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [globalFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
    setErrors({});
  };

  const handleCreate = async () => {
    const result = supplierSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      if (result.error && result.error.errors) {
        result.error.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
      } else {
        toast.error("Validation failed. Please check your input.");
        console.error("Zod error object missing:", result);
        return;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await createSupplier(formData);
      toast.success("Supplier created");
      setShowCreateModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSupplier) return;
    const result = supplierSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      if (result.error && result.error.errors) {
        result.error.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
      } else {
        toast.error("Validation failed. Please check your input.");
        console.error("Zod error object missing:", result);
        return;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await updateSupplier(selectedSupplier.id, formData);
      toast.success("Supplier updated");
      setShowEditModal(false);
      resetForm();
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSupplier(deletingId);
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setShowEditModal(true);
  };

  // Column templates
  const nameBody = (row: Supplier) => (
    <span className="font-medium">{row.name}</span>
  );
  const contactBody = (row: Supplier) => (
    <div>
      {row.contactPerson && <div>{row.contactPerson}</div>}
      {row.phone && <div className="text-sm text-gray-500">{row.phone}</div>}
      {row.email && <div className="text-sm text-gray-500">{row.email}</div>}
    </div>
  );
  const addressBody = (row: Supplier) => (
    <span className="text-sm">{row.address || "—"}</span>
  );
  const totalBoughtBody = (row: Supplier) => (
    <span className="font-semibold text-blue-600">
      {row.totalBought?.toFixed(2) || "0.00"} TK
    </span>
  );
  const actionsBody = (row: Supplier) => (
    <div className="flex gap-2">
      <Button size="xs" variant="outline" onClick={() => openEditModal(row)}>
        Edit
      </Button>
      <Button size="xs" variant="danger" onClick={() => handleDelete(row.id)}>
        Delete
      </Button>
    </div>
  );

  return (
    <div>
      <Toolbar title="Suppliers">
        <div className="flex gap-2">
          <DataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search suppliers..."
            className="w-[280px]"
          />
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            + Add Supplier
          </Button>
        </div>
      </Toolbar>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="table-container">
          <DataTable
            value={suppliers}
            lazy
            paginator
            rows={10}
            totalRecords={suppliers.length}
            loading={loading}
            emptyMessage="No suppliers found"
            rowClassName={() => "table-row"}
          >
            <Column
              field="name"
              header="Name"
              body={nameBody}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Contact"
              body={contactBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="address"
              header="Address"
              body={addressBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="totalBought"
              header="Total Bought"
              body={totalBoughtBody}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Actions"
              body={actionsBody}
              style={{ width: "120px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Supplier"
        size="md"
      >
        <div className="p-1 space-y-3">
          <InputField
            label="Supplier Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <InputField
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
          />
          <InputField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <InputField
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />
          <InputField
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={submitting}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Supplier"
        size="md"
      >
        <div className="p-1 space-y-3">
          <InputField
            label="Supplier Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <InputField
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
          />
          <InputField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <InputField
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />
          <InputField
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              loading={submitting}
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        title="Delete Supplier"
        size="sm"
      >
        <div className="p-1">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this supplier? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierList;
