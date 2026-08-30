"use client";

import { Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { createUser, deleteUser, getUsers, updateUser } from "./user.service";
import { User } from "./user.types";

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "data_accountant",
    isActive: true,
  });

  // ✅ Debounce: update debouncedSearchTerm 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // reset to first page on new search
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ Fetch whenever page, rows, OR debouncedSearchTerm changes
  useEffect(() => {
    fetchUsers();
  }, [page, rows, debouncedSearchTerm]); // ✅ Now includes debouncedSearchTerm

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers(page, rows, debouncedSearchTerm);
      setUsers(res.data);
      setTotalRecords(res.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch users");
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
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "data_accountant",
      isActive: true,
    });
    setFormError("");
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedUser(null);
    setModalFor("create");
  };

  const openEditModal = (user: User) => {
    resetForm();
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setModalFor("edit");
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setModalFor("delete");
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedUser(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email) {
      setFormError("Name, username and email are required");
      return;
    }
    if (modalFor === "create" && !formData.password) {
      setFormError("Password is required for new user");
      return;
    }
    setSubmitting(true);
    try {
      if (modalFor === "create") {
        await createUser({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        toast.success("User created");
      } else if (modalFor === "edit" && selectedUser) {
        const payload: any = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await updateUser(selectedUser.id, payload);
        toast.success("User updated");
      }
      closeModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await deleteUser(selectedUser.id);
      toast.success("User deleted");
      closeModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  // Table Columns
  const roleBody = (row: User) => {
    const colors: Record<string, string> = {
      super_admin:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      data_accountant:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      moderator:
        "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.role] || ""}`}
      >
        {row.role}
      </span>
    );
  };

  const statusBody = (row: User) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300"
      }`}
    >
      {row.isActive ? "Active" : "Inactive"}
    </span>
  );

  const actionsBody = (row: User) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(row)}
        className="p-1 cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="User Management">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={users}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No users found"
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
            field="username"
            header="Username"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="email"
            header="Email"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={roleBody}
            header="Role"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={statusBody}
            header="Status"
            sortable
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

      {/* Create/Edit Modal */}
      {(modalFor === "create" || modalFor === "edit") && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={modalFor === "create" ? "Add User" : "Edit User"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Name"
              name="name"
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={submitting}
            />
            <InputField
              label="Username"
              name="username"
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              disabled={submitting}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={submitting}
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder={
                modalFor === "create"
                  ? "Enter password (min 6 chars)"
                  : "Leave blank to keep unchanged"
              }
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={submitting}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                disabled={submitting}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="data_accountant">Data Accountant</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            {modalFor === "edit" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={submitting}
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Active
                </label>
              </div>
            )}
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div className="flex justify-end gap-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {modalFor === "create" ? "Create User" : "Update User"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selectedUser && (
        <Modal isOpen={true} onClose={closeModal} title="Delete User" size="sm">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{selectedUser.name}</strong>
            ?
          </p>
          <div className="flex justify-end gap-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
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

export default UserManagement;
