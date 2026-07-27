import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import HeroSliderForm from "./HeroSliderForm";
import {
  createHeroSlider,
  deleteHeroSlider,
  getHeroSliders,
  reorderHeroSliders,
  updateHeroSlider,
} from "./heroSlider.service";
import { HeroSlider } from "./heroSlider.types";

// Helper: render small thumbnails (like Product list)
const ImageThumbnail = ({ src, alt = "" }: { src?: string; alt?: string }) => {
  if (!src) return <span className="text-gray-400">—</span>;
  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => window.open(src, "_blank")}
      title="Click to view full image"
    />
  );
};

export const HeroSliderManagement: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlider | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlider | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch on page/rows/search change
  useEffect(() => {
    fetchSlides();
  }, [page, rows, debouncedSearch]);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const response = await getHeroSliders(page, rows, debouncedSearch);
      setSlides(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      toast.error("Failed to load slides");
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    const newPage = event.first / event.rows + 1;
    setPage(newPage);
  };

  // PrimeReact row reorder
  const handleRowReorder = (e: any) => {
    setSlides(e.value);
  };

  const handleSaveOrder = async () => {
    if (slides.length === 0) return;
    const ids = slides.map((s) => s.id);
    try {
      setSubmitting(true);
      await reorderHeroSliders(ids);
      toast.success("Order saved");
      fetchSlides();
    } catch (error) {
      toast.error("Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const openDeleteModal = (slide: HeroSlider) => {
    setDeleteTarget(slide);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHeroSlider(deleteTarget.id);
      toast.success("Deleted successfully");
      closeDeleteModal();
      fetchSlides();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Edit/Create
  const handleEdit = (slide: HeroSlider) => {
    setEditingSlide(slide);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSlide(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlide(null);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingSlide) {
        await updateHeroSlider(editingSlide.id, data);
        toast.success("Updated");
      } else {
        await createHeroSlider(data);
        toast.success("Created");
      }
      closeModal();
      fetchSlides();
    } catch (error) {
      toast.error("Save failed");
    }
  };

  // ----- Column Templates -----
  const orderBody = (row: HeroSlider, options: { rowIndex: number }) => (
    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
      {options.rowIndex + 1}
    </span>
  );

  const statusBody = (row: HeroSlider) => (
    <span
      className={`px-2 py-1 rounded-full text-xs ${
        row.isActive
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {row.isActive ? "Active" : "Inactive"}
    </span>
  );

  const createdAtBody = (row: HeroSlider) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(row.createdAt).toLocaleDateString()}
    </span>
  );

  const actionsBody = (row: HeroSlider) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleEdit(row)}
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

  // 🆕 Bg Image thumbnail
  const bgImageBody = (row: HeroSlider) => {
    if (!row.bgImage) return <span className="text-gray-400">—</span>;
    return <ImageThumbnail src={row.bgImage} alt="BG" />;
  };

  // 🆕 Inner Images thumbnails (three images side by side)
  const innerImagesBody = (row: HeroSlider) => {
    const images = [
      row.innerBigImage,
      row.innerTopImage,
      row.innerBottomImage,
    ].filter(Boolean);
    if (images.length === 0) return <span className="text-gray-400">—</span>;

    return (
      <div className="flex -space-x-2">
        {images.map((url, idx) => (
          <ImageThumbnail key={idx} src={url} alt={`Inner ${idx + 1}`} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <Toolbar title="Hero Slider">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search slides..."
            className="w-[220px]"
          />
          <Button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </Button>
          <Button
            onClick={handleSaveOrder}
            variant="outline"
            disabled={slides.length === 0 || submitting}
            className="flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            Save Order
          </Button>
        </div>
      </Toolbar>

      <div className="table-container">
        <DataTable
          value={slides}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No slides found"
          stripedRows
          rowClassName={() => "table-row"}
          reorderableRows
          onRowReorder={handleRowReorder}
        >
          {/* Row reorder handle */}
          <Column
            rowReorder
            style={{ width: "3rem" }}
            headerClassName="column-header"
            bodyClassName="column-body"
          />

          {/* Order number */}
          <Column
            header="#"
            body={orderBody}
            style={{ width: "50px" }}
            headerClassName="column-header"
            bodyClassName="column-body text-center"
          />

          <Column
            field="firstTitle"
            header="First Title"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />

          <Column
            field="secondTitle"
            header="Second Title"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />

          <Column
            field="badgeText"
            header="Badge"
            sortable
            headerClassName="column-header"
            bodyClassName="column-body"
          />

          <Column
            field="isActive"
            header="Status"
            sortable
            body={statusBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "100px" }}
          />

          {/* 🆕 Bg Image column */}
          <Column
            header="Bg Image"
            body={bgImageBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "80px" }}
          />

          {/* 🆕 Inner Images column */}
          <Column
            header="Inner Images"
            body={innerImagesBody}
            headerClassName="column-header"
            bodyClassName="column-body"
            style={{ width: "160px" }}
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

      {/* Edit/Create Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={editingSlide ? "Edit Slide" : "Create New Slide"}
          size="xl"
        >
          <HeroSliderForm
            slide={editingSlide}
            onSave={handleSave}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <Modal
          isOpen={true}
          onClose={closeDeleteModal}
          title="Delete Slide"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the slide{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                "{deleteTarget?.firstTitle}"
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <Button
                onClick={closeDeleteModal}
                variant="outline"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="danger"
                loading={deleting}
              >
                Delete Slide
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HeroSliderManagement;
