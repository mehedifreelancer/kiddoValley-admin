"use client";

import { Edit, Eye, ImageOff, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Editor } from "primereact/editor";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import { formulaSchema } from "./formula.schema";
import {
  createFormula,
  deleteFormula,
  getFormulas,
  updateFormula,
} from "./formula.service";
import { Formula } from "./formula.types";

export const FormulaManagement = () => {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalFor, setModalFor] = useState<
    "create" | "edit" | "delete" | "view" | null
  >(null);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

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
    fetchFormulas();
  }, [page, rows, debouncedSearch]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const res = await getFormulas(page, rows, debouncedSearch);
      if (res.success) {
        setFormulas(res.data);
        setTotalRecords(res.pagination.total);
      } else {
        toast.error("Failed to fetch formulas");
      }
    } catch (error) {
      toast.error("Failed to fetch formulas");
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
    setFormTitle("");
    setFormContent("");
    setImageUrls([]);
    setNewImageUrl("");
    setFormError("");
    setSelectedFormula(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalFor("create");
  };

  const openEditModal = (formula: Formula) => {
    resetForm();
    setSelectedFormula(formula);
    setFormTitle(formula.title);
    setFormContent(formula.content);
    setImageUrls(formula.images || []);
    setModalFor("edit");
  };

  const openViewModal = (formula: Formula) => {
    setSelectedFormula(formula);
    setModalFor("view");
  };

  const openDeleteModal = (formula: Formula) => {
    setSelectedFormula(formula);
    setModalFor("delete");
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedFormula(null);
    resetForm();
  };

  // --- Image management helpers ---
  const addImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) {
      toast.error("Please enter a URL");
      return;
    }
    if (!/^https?:\/\/.+/.test(trimmed)) {
      toast.error(
        "Please enter a valid URL (starting with http:// or https://)",
      );
      return;
    }
    if (imageUrls.includes(trimmed)) {
      toast.warning("Image already added");
      return;
    }
    setImageUrls([...imageUrls, trimmed]);
    setNewImageUrl("");
  };

  const removeImage = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const validateForm = (): boolean => {
    const result = formulaSchema.safeParse({
      title: formTitle,
      content: formContent,
      images: imageUrls,
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
      await createFormula({
        title: formTitle.trim(),
        content: formContent,
        images: imageUrls,
      });
      toast.success("Formula created");
      closeModal();
      fetchFormulas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedFormula) return;
    setSubmitting(true);
    try {
      await updateFormula(selectedFormula.id, {
        title: formTitle.trim(),
        content: formContent,
        images: imageUrls,
      });
      toast.success("Formula updated");
      closeModal();
      fetchFormulas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFormula) return;
    setSubmitting(true);
    try {
      await deleteFormula(selectedFormula.id);
      toast.success("Formula deleted");
      closeModal();
      fetchFormulas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Table Columns ───
  const contentPreview = (row: Formula) => {
    const plain = row.content.replace(/<[^>]+>/g, "").slice(0, 60);
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {plain}...
      </span>
    );
  };

  const actionsBody = (row: Formula) => (
    <div className="flex gap-2">
      <button
        onClick={() => openViewModal(row)}
        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => openEditModal(row)}
        className="p-1 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // ─── Image Gallery for View Modal ───
  const renderImageGallery = (images: string[]) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, idx) => (
          <div
            key={idx}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity aspect-square"
            onClick={() => window.open(url, "_blank")}
          >
            <img
              src={url}
              alt={`Image ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="sans-serif" font-size="12" text-anchor="middle" dy=".3em" fill="%239ca3af"%3Eimage%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // ─── Thumbnail with fallback ───
  const ImageThumbnail = ({
    url,
    onRemove,
  }: {
    url: string;
    onRemove: () => void;
  }) => {
    const [error, setError] = useState(false);
    return (
      <div className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0">
        {error ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400">
            <ImageOff className="w-6 h-6" />
          </div>
        ) : (
          <img
            src={url}
            alt="thumbnail"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
            onClick={() => window.open(url, "_blank")}
          />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading && formulas.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar title="Formulas">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search formulas..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFormulas}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Add Formula
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={formulas}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No formulas found"
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
            field="title"
            header="Title"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={contentPreview}
            header="Preview"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            body={actionsBody}
            header="Actions"
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "140px" }}
          />
        </DataTable>
      </div>

      {/* ===== Create Modal ===== */}
      {modalFor === "create" && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Add New Formula"
          size="xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <InputField
              label="Title"
              name="title"
              type="text"
              placeholder="Enter formula title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              error={formError}
              required
              autoFocus
              disabled={submitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <Editor
                value={formContent}
                onTextChange={(e) => setFormContent(e.htmlValue as string)}
                style={{ height: "250px" }}
                className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
              />
            </div>

            {/* ===== Image Management ===== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Images
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g., Google Photos link, Imgur, etc.)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  disabled={submitting}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={addImage}
                  disabled={!newImageUrl.trim() || submitting}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Any valid URL is accepted. If the image doesn't load, a fallback
                will be shown. Click on thumbnails to open in a new tab.
              </p>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imageUrls.map((url) => (
                    <ImageThumbnail
                      key={url}
                      url={url}
                      onRemove={() => removeImage(url)}
                    />
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Create Formula
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Edit Modal ===== */}
      {modalFor === "edit" && selectedFormula && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Edit Formula"
          size="xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <InputField
              label="Title"
              name="title"
              type="text"
              placeholder="Enter formula title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              error={formError}
              required
              disabled={submitting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <Editor
                value={formContent}
                onTextChange={(e) => setFormContent(e.htmlValue as string)}
                style={{ height: "250px" }}
                className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Images
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g., Google Photos link, Imgur, etc.)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={addImage}
                  disabled={!newImageUrl.trim() || submitting}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Any valid URL is accepted. If the image doesn't load, a fallback
                will be shown. Click on thumbnails to open in a new tab.
              </p>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imageUrls.map((url) => (
                    <ImageThumbnail
                      key={url}
                      url={url}
                      onRemove={() => removeImage(url)}
                    />
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Update Formula
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== View Modal ===== */}
      {modalFor === "view" && selectedFormula && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={`Formula: ${selectedFormula.title}`}
          size="xl"
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pb-2   ">
            <div className="prose dark:prose-invert max-w-none mt-3">
              <div
                dangerouslySetInnerHTML={{ __html: selectedFormula.content }}
              />
            </div>

            {selectedFormula.images && selectedFormula.images.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Embedded Images{" "}
                  <span className="text-xs text-gray-400 ml-2">
                    ({selectedFormula.images.length} images)
                  </span>
                </h4>
                {renderImageGallery(selectedFormula.images)}
                <p className="text-xs text-gray-400 mt-2">
                  Click on any image to open it in a new tab.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ===== Delete Modal ===== */}
      {modalFor === "delete" && selectedFormula && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Delete Formula"
          size="sm"
        >
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              "{selectedFormula.title}"
            </span>
            ?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              Delete Formula
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FormulaManagement;
