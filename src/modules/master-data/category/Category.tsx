import React, { useState, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { generateSlug } from "./category.schema";
import { Plus, Edit, Trash2 } from "lucide-react";
import Toolbar from "../../../components/ui/Toolbar";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import InputField from "../../../components/ui/InputField";
import DataTableSearch from "../../../components/ui/DataTableSearch";
import type { CategoryItem } from "./category.types";

// Mock data for UI design
const mockCategories: CategoryItem[] = [
  {
    id: 1,
    name: "Baby Products",
    slug: "baby-products",
    productCount: 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Dairy",
    slug: "dairy",
    productCount: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Beverages",
    slug: "beverages",
    productCount: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Snacks",
    slug: "snacks",
    productCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Household",
    slug: "household",
    productCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const Category = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(mockCategories);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete">("create");
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<{ name: string }>({ name: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!globalFilter) return categories;

    const searchTerm = globalFilter.toLowerCase();

    return categories.filter((item) => {
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.slug.toLowerCase().includes(searchTerm) ||
        item.id.toString().includes(searchTerm) ||
        item.productCount.toString().includes(searchTerm)
      );
    });
  }, [categories, globalFilter]);

  // Reset form
  const resetForm = () => {
    setFormData({ name: "" });
    setFormErrors({});
  };

  // Open modal for create
  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setSelectedCategory(null);
    setModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (category: CategoryItem) => {
    setFormData({ name: category.name });
    setFormErrors({});
    setModalMode("edit");
    setSelectedCategory(category);
    setModalOpen(true);
  };

  // Open modal for delete
  const openDeleteModal = (category: CategoryItem) => {
    setModalMode("delete");
    setSelectedCategory(category);
    setModalOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    if (!formData.name.trim()) {
      setFormErrors({ name: "Category name is required" });
      return;
    }

    const newCategory: CategoryItem = {
      id: Math.max(...categories.map(c => c.id), 0) + 1,
      name: formData.name,
      slug: generateSlug(formData.name),
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCategories([...categories, newCategory]);
    setModalOpen(false);
    resetForm();
  };

  // Handle update
  const handleUpdate = () => {
    if (!formData.name.trim() || !selectedCategory) {
      setFormErrors({ name: "Category name is required" });
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? {
          ...cat,
          name: formData.name,
          slug: generateSlug(formData.name),
          updatedAt: new Date().toISOString(),
        }
        : cat
    );

    setCategories(updatedCategories);
    setModalOpen(false);
    resetForm();
    setSelectedCategory(null);
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedCategory) return;

    const filteredCategories = categories.filter(cat => cat.id !== selectedCategory.id);
    setCategories(filteredCategories);
    setModalOpen(false);
    setSelectedCategory(null);
  };

  // Validate form on change
  const validateForm = (value: string) => {
    if (!value.trim()) {
      setFormErrors({ name: "Category name is required" });
      return false;
    }
    if (value.length < 2) {
      setFormErrors({ name: "Category name must be at least 2 characters" });
      return false;
    }
    if (value.length > 50) {
      setFormErrors({ name: "Category name must be less than 50 characters" });
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handleNameChange = (value: string) => {
    setFormData({ name: value });
    validateForm(value);
  };

  // Column Templates
  const productCountBody = (rowData: CategoryItem) => {
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        {rowData.productCount} items
      </span>
    );
  };

  const createdAtBody = (rowData: CategoryItem) => {
    return (
      <span className="text-sm text-gray-500">
        {new Date(rowData.createdAt).toLocaleDateString()}
      </span>
    );
  };

  const actionsBody = (rowData: CategoryItem) => {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => openEditModal(rowData)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => openDeleteModal(rowData)}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };



  return (
    <div>
      <Toolbar title="Categories" >
        <div className="flex gap-2">
          <DataTableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search categories..."
          className="w-[220px]"
        />
        <Button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-xs">
          <Plus className="w-4 h-4" />
          Add Row
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
          rowClassName={() => 'table-row'}
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
            filter={false}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="slug"
            header="Slug"
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCategory(null);
          resetForm();
        }}
        title={
          modalMode === "create"
            ? "Create New Category"
            : modalMode === "edit"
              ? "Edit Category"
              : "Delete Category"
        }
        size="md"
      >
        {modalMode === "delete" ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete the category{" "}
              <span className="font-semibold text-red-600">
                "{selectedCategory?.name}"
              </span>
              ?
            </p>
            {selectedCategory && selectedCategory.productCount > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                ⚠️ Warning: This category has {selectedCategory.productCount} products.
                Deleting it will affect these products.
              </p>
            )}
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedCategory(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
              >
                Delete Category
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <InputField
              label="Category Name"
              name="name"
              type="text"
              placeholder="Enter category name (e.g., Baby Products)"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              required
              autoFocus
            />

            {/* Preview Slug */}
            {formData.name && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Slug (auto-generated)
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono">
                  {generateSlug(formData.name)}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={modalMode === "create" ? handleCreate : handleUpdate}
                variant="primary"
              >
                {modalMode === "create" ? "Create Category" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Category;