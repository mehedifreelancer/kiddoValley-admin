"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../../components/ui/Button";
import DataTableSearch from "../../../components/ui/DataTableSearch";
import InputField from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import { transactionCategorySchema } from "./transaction-category.schema";
import {
  createTransactionCategory,
  deleteTransactionCategory,
  getTransactionCategories,
  updateTransactionCategory,
} from "./transaction-category.service";
import { TransactionCategory } from "./transaction-category.types"; // ✅ টাইপ ইমপোর্ট

export const TransactionCategoryList = () => {
  // ✅ কম্পোনেন্টের নাম পরিবর্তন
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] =
    useState<TransactionCategory | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state for create/edit
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"in" | "out">("in");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFirst(0);
      fetchCategories();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [page, rows]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getTransactionCategories(page, rows, searchTerm);
      setCategories(res.data);
      setTotalRecords(res.pagination.total);
    } catch (error) {
      toast.error("Failed to load categories");
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
    setFormType("in");
    setFormDescription("");
    setFormError("");
    setSelectedCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalFor("create");
  };

  const openEditModal = (category: TransactionCategory) => {
    resetForm();
    setSelectedCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormDescription(category.description || "");
    setModalFor("edit");
  };

  const openDeleteModal = (category: TransactionCategory) => {
    setSelectedCategory(category);
    setModalFor("delete");
  };

  const closeModal = () => {
    setModalFor(null);
    resetForm();
  };

  const validateForm = (): boolean => {
    const result = transactionCategorySchema.safeParse({
      name: formName,
      type: formType,
      description: formDescription,
    });
    if (!result.success) {
      setFormError(result.error.issues[0]?.message || "Invalid input");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createTransactionCategory({
        name: formName.trim(),
        type: formType,
        description: formDescription.trim() || undefined,
      });
      toast.success("Category created successfully");
      closeModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedCategory) return;

    setSubmitting(true);
    try {
      await updateTransactionCategory(selectedCategory.id, {
        name: formName.trim(),
        type: formType,
        description: formDescription.trim() || undefined,
      });
      toast.success("Category updated successfully");
      closeModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await deleteTransactionCategory(selectedCategory.id);
      toast.success("Category deleted successfully");
      closeModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Table Columns ───

  const typeBody = (row: TransactionCategory) => (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        row.type === "in"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {row.type === "in" ? "Income" : "Expense"}
    </span>
  );

  const descriptionBody = (row: TransactionCategory) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {row.description || "—"}
    </span>
  );

  const actionsBody = (row: TransactionCategory) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(row)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Transaction Categories">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search categories..."
            className="w-[220px]"
          />
          <Button
            onClick={openCreateModal}
            className="flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={categories}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No transaction categories found"
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
            header="Category Name"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="type"
            header="Type"
            body={typeBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "120px" }}
          />
          <Column
            field="description"
            header="Description"
            body={descriptionBody}
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

      {/* ─── Create Modal ─── */}
      {modalFor === "create" && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Create Transaction Category"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <InputField
              label="Category Name"
              name="name"
              type="text"
              placeholder="e.g. Rent, Salary, Sales"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={formError}
              required
              autoFocus
              disabled={submitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    value="in"
                    checked={formType === "in"}
                    onChange={() => setFormType("in")}
                    className="accent-blue-600"
                  />
                  Income
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    value="out"
                    checked={formType === "out"}
                    onChange={() => setFormType("out")}
                    className="accent-red-600"
                  />
                  Expense
                </label>
              </div>
            </div>

            <InputField
              label="Description (optional)"
              name="description"
              type="text"
              placeholder="Brief description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={submitting}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={closeModal}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Create Category
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Edit Modal ─── */}
      {modalFor === "edit" && selectedCategory && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Edit Transaction Category"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <InputField
              label="Category Name"
              name="name"
              type="text"
              placeholder="e.g. Rent, Salary, Sales"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={formError}
              required
              autoFocus
              disabled={submitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    value="in"
                    checked={formType === "in"}
                    onChange={() => setFormType("in")}
                    className="accent-blue-600"
                  />
                  Income
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="type"
                    value="out"
                    checked={formType === "out"}
                    onChange={() => setFormType("out")}
                    className="accent-red-600"
                  />
                  Expense
                </label>
              </div>
            </div>

            <InputField
              label="Description (optional)"
              name="description"
              type="text"
              placeholder="Brief description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={submitting}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={closeModal}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Update Category
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Modal ─── */}
      {modalFor === "delete" && selectedCategory && (
        <Modal isOpen={true} onClose={closeModal} title="Delete Category">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the category{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{selectedCategory.name}"
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. Categories with existing
              transactions cannot be deleted.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionCategoryList; // ✅ ডিফল্ট এক্সপোর্টও নাম পরিবর্তন
