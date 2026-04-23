// modules/master-data/category/Category.tsx
import React, { useState, useMemo, FormEvent, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Toolbar from "../../../components/ui/Toolbar";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import InputField from "../../../components/ui/InputField";
import DataTableSearch from "../../../components/ui/DataTableSearch";
import type { CategoryItem } from "./category.types";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.service";

export const Category = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Single modal state
  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(
    null,
  );

  // Form errors state
  const [formError, setFormError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try { 
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!globalFilter) return categories;

    const searchTerm = globalFilter.toLowerCase();

    return categories.filter((item) => {
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.id.toString().includes(searchTerm) ||
        item.productCount.toString().includes(searchTerm)
      );
    });
  }, [categories, globalFilter]);

  // Reset form error
  const resetFormError = () => {
    setFormError("");
  };

  // Open create modal
  const openCreateModal = () => {
    resetFormError();
    setSelectedCategory(null);
    setModalFor("create");
  };

  // Open edit modal
  const openEditModal = (category: CategoryItem) => {
    resetFormError();
    setSelectedCategory(category);
    setModalFor("edit");
  };

  // Open delete modal
  const openDeleteModal = (category: CategoryItem) => {
    setSelectedCategory(category);
    setModalFor("delete");
  };

  // Validate name
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setFormError("Category name is required");
      return false;
    }
    if (name.length < 2) {
      setFormError("Category name must be at least 2 characters");
      return false;
    }
    if (name.length > 50) {
      setFormError("Category name must be less than 50 characters");
      return false;
    }
    setFormError("");
    return true;
  };

  // Handle create submit
  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    if (!validateName(name)) return;

    try {
      setSubmitting(true);
      const newCategory = await createCategory({ name: name.trim() });
      setCategories([...categories, newCategory]);
      toast.success("Category created successfully");
      setModalFor(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    if (!validateName(name) || !selectedCategory) return;

    try {
      setSubmitting(true);
      const updatedCategory = await updateCategory(selectedCategory.id, {
        name: name.trim(),
      });
      const updatedCategories = categories.map((cat) =>
        cat.id === selectedCategory.id ? updatedCategory : cat,
      );
      setCategories(updatedCategories);
      toast.success("Category updated successfully");
      setModalFor(null);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setSubmitting(true);
      await deleteCategory(selectedCategory.id);
      const filteredCategories = categories.filter(
        (cat) => cat.id !== selectedCategory.id,
      );
      setCategories(filteredCategories);
      toast.success("Category deleted successfully");
      setModalFor(null);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalFor(null);
    setSelectedCategory(null);
    resetFormError();
  };

  // Column Templates
  const productCountBody = (rowData: CategoryItem) => {
    return (
      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
        {rowData.productCount} items
      </span>
    );
  };

  const createdAtBody = (rowData: CategoryItem) => {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {new Date(rowData.createdAt).toLocaleDateString()}
      </span>
    );
  };

  const actionsBody = (rowData: CategoryItem) => {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => openEditModal(rowData)}
          className="p-1 cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
          title="Edit"
          role="button"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => openDeleteModal(rowData)}
          className="p-1 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Delete"
          role="button"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Categories">
        <div className="flex gap-2">
          <DataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search categories..."
            className="w-[220px]"
          />
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </Toolbar>

      {/* DataTable */}
      <div className="table-container">
        <DataTable
          value={filteredData}
          paginator
          rows={10}
          emptyMessage="No categories found"
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
            field="productCount"
            header="Products"
            sortable
            body={productCountBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "100px" }}
          />
          <Column
            field="createdAt"
            header="Created"
            sortable
            body={createdAtBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "150px" }}
          />
          <Column
            header="Actions"
            body={actionsBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {/* Create Modal */}
      {modalFor === "create" && (
        <Modal isOpen={true} onClose={closeModal} title="Create New Category">
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-5">
              <InputField
                label="Category Name"
                labelClassName="text-md"
                inputClassName="text-sm"
                name="name"
                type="text"
                placeholder="Enter category name (e.g., Baby Products)"
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />

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
                  Create Category
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modalFor === "edit" && selectedCategory && (
        <Modal isOpen={true} onClose={closeModal} title="Edit Category">
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-5">
              <InputField
                label="Category Name"
                name="name"
                type="text"
                placeholder="Enter category name"
                defaultValue={selectedCategory.name}
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />

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
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && (
        <Modal isOpen={true} onClose={closeModal} title="Delete Category">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the category{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{selectedCategory?.name}"
              </span>
              ?
            </p>
            {selectedCategory && selectedCategory.productCount > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                ⚠️ Warning: This category has {selectedCategory.productCount}{" "}
                products. Deleting it will affect these products.
              </p>
            )}
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
                Delete Category
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Category;
