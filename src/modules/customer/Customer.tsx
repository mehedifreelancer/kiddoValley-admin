"use client";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { customerSchema } from "./customer.schema";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "./customer.service";
import { Customer } from "./customer.types";

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPhone, setDeletingPhone] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    address: "",
    secondaryPhone: "",
    gender: "",
    hasBaby: false,
    preferredToy: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers(globalFilter);
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [globalFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const resetForm = () => {
    setFormData({
      phone: "",
      name: "",
      address: "",
      secondaryPhone: "",
      gender: "",
      hasBaby: false,
      preferredToy: "",
    });
    setErrors({});
  };

  const handleCreate = async () => {
    const result = customerSchema.safeParse(formData);
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
      await createCustomer(formData);
      toast.success("Customer created");
      setShowCreateModal(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    const result = customerSchema.safeParse(formData);
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
      await updateCustomer(selectedCustomer.phone, formData);
      toast.success("Customer updated");
      setShowEditModal(false);
      resetForm();
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (phone: string) => {
    setDeletingPhone(phone);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingPhone) return;
    try {
      await deleteCustomer(deletingPhone);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    } finally {
      setShowDeleteModal(false);
      setDeletingPhone(null);
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      phone: customer.phone,
      name: customer.name,
      address: customer.address,
      secondaryPhone: customer.secondaryPhone || "",
      gender: customer.gender || "",
      hasBaby: customer.hasBaby || false,
      preferredToy: customer.preferredToy || "",
    });
    setShowEditModal(true);
  };

  // Column templates
  const phoneBody = (row: Customer) => (
    <span className="font-mono text-sm font-medium">{row.phone}</span>
  );
  const nameBody = (row: Customer) => (
    <span className="font-medium">{row.name}</span>
  );
  const addressBody = (row: Customer) => (
    <span className="text-sm">{row.address}</span>
  );
  const ordersBody = (row: Customer) => (
    <span className="text-sm font-medium text-blue-600">
      {row.orders?.length || 0}
    </span>
  );
  const actionsBody = (row: Customer) => (
    <div className="flex gap-2">
      <Button size="xs" variant="outline" onClick={() => openEditModal(row)}>
        Edit
      </Button>
      <Button
        size="xs"
        variant="danger"
        onClick={() => handleDelete(row.phone)}
      >
        Delete
      </Button>
    </div>
  );

  return (
    <div>
      <Toolbar title="Customers">
        <div className="flex gap-2">
          <DataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search by name, phone, address..."
            className="w-[280px]"
          />
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            + Add Customer
          </Button>
        </div>
      </Toolbar>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="table-container">
          <DataTable
            value={customers}
            lazy
            paginator
            rows={10}
            totalRecords={customers.length}
            loading={loading}
            emptyMessage="No customers found"
            rowClassName={() => "table-row"}
          >
            <Column
              field="phone"
              header="Phone"
              body={phoneBody}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="name"
              header="Name"
              body={nameBody}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="address"
              header="Address"
              body={addressBody}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Orders"
              body={ordersBody}
              headerClassName="column-header"
              bodyClassName="column-body"
              style={{ width: "80px" }}
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
        title="Add Customer"
        size="md"
      >
        <div className="p-1 space-y-3">
          <InputField
            label="Phone *"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            error={errors.phone}
            required
          />
          <InputField
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <InputField
            label="Address *"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={errors.address}
            required
          />
          <InputField
            label="Secondary Phone"
            value={formData.secondaryPhone}
            onChange={(e) =>
              setFormData({ ...formData, secondaryPhone: e.target.value })
            }
            error={errors.secondaryPhone}
          />
          <InputField
            label="Gender"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasBaby"
              checked={formData.hasBaby}
              onChange={(e) =>
                setFormData({ ...formData, hasBaby: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="hasBaby"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Has Baby
            </label>
          </div>
          <InputField
            label="Preferred Toy"
            value={formData.preferredToy}
            onChange={(e) =>
              setFormData({ ...formData, preferredToy: e.target.value })
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
        title="Edit Customer"
        size="md"
      >
        <div className="p-1 space-y-3">
          <InputField
            label="Phone *"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            error={errors.phone}
            required
            disabled
          />
          <InputField
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <InputField
            label="Address *"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={errors.address}
            required
          />
          <InputField
            label="Secondary Phone"
            value={formData.secondaryPhone}
            onChange={(e) =>
              setFormData({ ...formData, secondaryPhone: e.target.value })
            }
            error={errors.secondaryPhone}
          />
          <InputField
            label="Gender"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editHasBaby"
              checked={formData.hasBaby}
              onChange={(e) =>
                setFormData({ ...formData, hasBaby: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="editHasBaby"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Has Baby
            </label>
          </div>
          <InputField
            label="Preferred Toy"
            value={formData.preferredToy}
            onChange={(e) =>
              setFormData({ ...formData, preferredToy: e.target.value })
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
          setDeletingPhone(null);
        }}
        title="Delete Customer"
        size="sm"
      >
        <div className="p-1">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this customer? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingPhone(null);
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

export default CustomerList;
