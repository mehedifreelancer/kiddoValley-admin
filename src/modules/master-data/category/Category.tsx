// modules/master-data/category/Category.tsx
import { Edit, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { FormEvent, useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-hot-toast";
import api from "../../../apiConfig";
import Button from "../../../components/ui/Button";
import DataTableSearch from "../../../components/ui/DataTableSearch";
import InputField from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "./category.service";
import type { CategoryItem } from "./category.types";

// ---------- DND কম্পোনেন্ট: অ্যাট্রিবিউট প্রায়োরিটি সিলেক্টর ----------
const ItemType = "ATTRIBUTE";

interface DraggableAttrProps {
  name: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (index: number) => void;
}

const DraggableAttr: React.FC<DraggableAttrProps> = ({
  name,
  index,
  moveItem,
  removeItem,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
        {name}
      </span>
      <button
        type="button"
        onClick={() => removeItem(index)}
        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface AttributePrioritySelectorProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  availableAttributes: string[];
  disabled?: boolean;
}

const AttributePrioritySelector: React.FC<AttributePrioritySelectorProps> = ({
  value,
  onChange,
  availableAttributes,
  disabled = false,
}) => {
  const [items, setItems] = useState<string[]>(value.length > 0 ? value : []);

  useEffect(() => {
    setItems(value.length > 0 ? value : []);
  }, [value]);

  const remainingAttributes = availableAttributes.filter(
    (attr) => !items.includes(attr),
  );

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const dragged = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragged);
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  const addAttribute = (attrName: string) => {
    if (items.includes(attrName)) return;
    const newItems = [...items, attrName];
    setItems(newItems);
    onChange(newItems);
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Attribute Priority (Order)
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {items.length === 0 ? (
            <span className="text-sm text-gray-400">
              No attributes selected
            </span>
          ) : (
            items.map((name) => (
              <span
                key={name}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {name}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Attribute Priority (Drag to reorder)
          </label>
          <span className="text-xs text-gray-400">{items.length} selected</span>
        </div>

        <div className="space-y-2 min-h-[60px] p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-12 text-sm text-gray-400">
              Drag attributes here or add from below
            </div>
          ) : (
            items.map((name, idx) => (
              <DraggableAttr
                key={name}
                name={name}
                index={idx}
                moveItem={moveItem}
                removeItem={removeItem}
              />
            ))
          )}
        </div>

        {remainingAttributes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Add more attributes
            </label>
            <div className="flex flex-wrap gap-2">
              {remainingAttributes.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addAttribute(name)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Tip: The first attribute will be shown as primary filter on product
          cards.
        </p>
      </div>
    </DndProvider>
  );
};

// ---------- মূল Category কম্পোনেন্ট ----------
export const Category = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [allAttributes, setAllAttributes] = useState<string[]>([]);
  const [attributePriority, setAttributePriority] = useState<string[]>([]);

  useEffect(() => {
    fetchAllAttributes();
  }, []);

  const fetchAllAttributes = async () => {
    try {
      const res = await api.get("/attributes");
      const names = res.data.data.map((a: any) => a.name);
      setAllAttributes(names);
    } catch (error) {
      console.error("Failed to load attributes", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [page, rows, debouncedSearch]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories(page, rows, debouncedSearch);
      if (response.success) {
        setCategories(response.data);
        setTotalRecords(response.pagination.total);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
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

  const openCreateModal = () => {
    resetFormError();
    setSelectedCategory(null);
    setAttributePriority([]);
    setModalFor("create");
  };

  const openEditModal = (category: CategoryItem) => {
    resetFormError();
    setSelectedCategory(category);
    setAttributePriority(category.attributePriority || []);
    setModalFor("edit");
  };

  const openDeleteModal = (category: CategoryItem) => {
    setSelectedCategory(category);
    setModalFor("delete");
  };

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

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    if (!validateName(name)) return;

    try {
      setSubmitting(true);
      const payload: any = { name: name.trim() };
      if (attributePriority.length > 0) {
        payload.attributePriority = attributePriority;
      }
      await createCategory(payload);
      toast.success("Category created successfully");
      setModalFor(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    if (!validateName(name) || !selectedCategory) return;

    try {
      setSubmitting(true);
      const payload: any = { name: name.trim() };
      if (attributePriority.length > 0) {
        payload.attributePriority = attributePriority;
      } else {
        payload.attributePriority = [];
      }
      await updateCategory(selectedCategory.id, payload);
      toast.success("Category updated successfully");
      setModalFor(null);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      setSubmitting(true);
      await deleteCategory(selectedCategory.id);
      toast.success("Category deleted successfully");
      setModalFor(null);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedCategory(null);
    resetFormError();
    setAttributePriority([]);
  };

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
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => openDeleteModal(rowData)}
          className="p-1 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading && categories.length === 0) {
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
            value={searchTerm}
            onChange={setSearchTerm}
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
                name="name"
                type="text"
                placeholder="Enter category name"
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />

              <AttributePrioritySelector
                value={attributePriority}
                onChange={setAttributePriority}
                availableAttributes={allAttributes}
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

              <AttributePrioritySelector
                value={attributePriority}
                onChange={setAttributePriority}
                availableAttributes={allAttributes}
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
