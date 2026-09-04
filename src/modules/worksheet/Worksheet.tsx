// src/modules/worksheet/Worksheet.tsx
import { Edit, Eye, FileText, Plus, Trash2, X } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import {
  createWorksheet,
  deleteWorksheet,
  getWorksheets,
  updateWorksheet,
} from "./worksheet.service";
import type { WorksheetItem } from "./worksheet.types";

export const Worksheet = () => {
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedWorksheet, setSelectedWorksheet] =
    useState<WorksheetItem | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ Edit modal-এ existing PDF রাখবো নাকি সরিয়ে নতুন upload input দেখাবো তা track করার জন্য
  const [existingFileRemoved, setExistingFileRemoved] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data
  useEffect(() => {
    fetchWorksheets();
  }, [page, rows, debouncedSearch]);

  const fetchWorksheets = async () => {
    try {
      setLoading(true);
      const response = await getWorksheets(page, rows, debouncedSearch);
      setWorksheets(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch worksheets");
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
    setFormError("");
    setSelectedFile(null);
    setSelectedWorksheet(null);
    setExistingFileRemoved(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalFor("create");
  };

  const openEditModal = (worksheet: WorksheetItem) => {
    resetForm();
    setSelectedWorksheet(worksheet);
    setModalFor("edit");
  };

  const openDeleteModal = (worksheet: WorksheetItem) => {
    setSelectedWorksheet(worksheet);
    setModalFor("delete");
  };

  // ✅ প্রিভিউ – filePath এ backend থেকেই পুরো URL আসে (protocol + host সহ)
  const openPreview = (filePath: string) => {
    window.open(filePath, "_blank");
  };

  const closeModal = () => {
    setModalFor(null);
    resetForm();
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!selectedFile) {
      setFormError("Please select a PDF file");
      return;
    }

    const payload = new FormData();
    payload.append("title", title.trim());
    payload.append("file", selectedFile);

    try {
      setSubmitting(true);
      await createWorksheet(payload);
      toast.success("Worksheet created");
      closeModal();
      fetchWorksheets();
    } catch (error: any) {
      toast.error(error.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorksheet) return;
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    // ✅ existing file remove করা হয়েছে কিন্তু নতুন file select করা হয়নি
    if (existingFileRemoved && !selectedFile) {
      setFormError("Please upload a new PDF file");
      return;
    }

    const payload = new FormData();
    payload.append("title", title.trim());
    if (selectedFile) {
      payload.append("file", selectedFile);
    }

    try {
      setSubmitting(true);
      await updateWorksheet(selectedWorksheet.id, payload);
      toast.success("Worksheet updated");
      closeModal();
      fetchWorksheets();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorksheet) return;
    try {
      setSubmitting(true);
      await deleteWorksheet(selectedWorksheet.id);
      toast.success("Deleted");
      closeModal();
      fetchWorksheets();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  // DataTable column templates
  const filePathBody = (rowData: WorksheetItem) => {
    const fileName = rowData.filePath.split("/").pop() || "file.pdf";
    return (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <span className="text-sm truncate max-w-[150px]">{fileName}</span>
        <button
          onClick={() => openPreview(rowData.filePath)}
          className="p-1 text-gray-500 hover:text-blue-600 transition"
          title="Preview (opens in new tab)"
        >
          <Eye className="w-4 h-4 cursor-pointer" />
        </button>
      </div>
    );
  };

  const actionsBody = (rowData: WorksheetItem) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(rowData)}
        className="p-1 cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(rowData)}
        className="p-1 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const createdAtBody = (rowData: WorksheetItem) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(rowData.createdAt).toLocaleDateString()}
    </span>
  );

  if (loading && worksheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ✅ Edit modal-এ existing PDF-এর filename বের করার জন্য
  const existingFileName = selectedWorksheet?.filePath
    ? selectedWorksheet.filePath.split("/").pop()
    : "";

  return (
    <div>
      <Toolbar title="Worksheets">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search worksheets..."
            className="w-[220px]"
          />
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Worksheet
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={worksheets}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No worksheets found"
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
            header="PDF"
            body={filePathBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "200px" }}
          />
          <Column
            header="Created"
            body={createdAtBody}
            sortable
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
        <Modal isOpen={true} onClose={closeModal} title="Add New Worksheet">
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-5">
              <InputField
                label="Title"
                name="title"
                type="text"
                placeholder="Enter worksheet title"
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={submitting}
                  required
                />
                {formError && !selectedFile && (
                  <p className="text-xs text-red-500 mt-1">{formError}</p>
                )}
              </div>
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
                  Upload
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modalFor === "edit" && selectedWorksheet && (
        <Modal isOpen={true} onClose={closeModal} title="Edit Worksheet">
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-5">
              <InputField
                label="Title"
                name="title"
                type="text"
                placeholder="Enter worksheet title"
                defaultValue={selectedWorksheet.title}
                error={formError}
                required
                autoFocus
                disabled={submitting}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PDF File
                </label>

                {/* ✅ Case 1: এখনো existing file আছে এবং remove করা হয়নি এবং নতুন file select করা হয়নি */}
                {!existingFileRemoved && !selectedFile && (
                  <div className="flex items-center justify-between gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm truncate text-gray-700 dark:text-gray-300">
                        {existingFileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openPreview(selectedWorksheet.filePath)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExistingFileRemoved(true)}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                        title="Remove and upload a new PDF"
                        disabled={submitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ✅ Case 2: existing file remove করা হয়েছে কিন্তু নতুন file এখনো select করা হয়নি → file input দেখাও */}
                {existingFileRemoved && !selectedFile && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      A new PDF is required to replace the removed one
                    </p>
                    {formError && !selectedFile && (
                      <p className="text-xs text-red-500 mt-1">{formError}</p>
                    )}
                  </div>
                )}

                {/* ✅ Case 3: নতুন file select করা হয়েছে → নতুন file দেখাও, চাইলে বাতিল করে আগেরটায় ফিরে যাওয়া যাবে */}
                {selectedFile && (
                  <div className="flex items-center justify-between gap-2 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm truncate text-gray-700 dark:text-gray-300">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                        (new)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        // যদি existing remove করার আগেই user নতুন file বেছে বাতিল করে,
                        // তাহলে existing file আবার দেখানো উচিত (remove flag false থাকলে)
                      }}
                      className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition flex-shrink-0"
                      title="Cancel this selection"
                      disabled={submitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

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
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selectedWorksheet && (
        <Modal isOpen={true} onClose={closeModal} title="Delete Worksheet">
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the worksheet{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{selectedWorksheet.title}"
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will also remove the PDF file from the server.
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
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Worksheet;
