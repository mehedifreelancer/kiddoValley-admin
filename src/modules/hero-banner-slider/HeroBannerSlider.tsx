import { GripVertical, Save, Trash2, Upload } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Panel from "../../components/ui/Panel";
import Toolbar from "../../components/ui/Toolbar";
import {
  addSlider,
  deleteSlider,
  getSliders,
  reorderSliders,
} from "./hero-banner-slider.service";
import { SliderImage } from "./hero-banner-slider.types";

const ItemType = "SLIDER_IMAGE";

// ---------- Draggable Image ----------
interface DraggableImageProps {
  image:
    | SliderImage
    | { id: string; imageUrl: string; isPending: boolean; file?: File };
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (id: string | number) => void;
}

const DraggableImage: React.FC<DraggableImageProps> = ({
  image,
  index,
  moveImage,
  removeImage,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const isPending = "isPending" in image && image.isPending;
  const src =
    isPending && image.file ? URL.createObjectURL(image.file) : image.imageUrl;

  return (
    <div
      ref={ref}
      className={`relative group cursor-move ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all">
        <img src={src} alt="Slider" className="w-full h-full object-cover" />
        {isPending && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">
              Pending
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <GripVertical className="w-5 h-5 text-white cursor-grab" />
        </div>
        <button
          type="button"
          onClick={() => removeImage(image.id)}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="text-center mt-1 text-xs text-gray-500 dark:text-gray-400 truncate w-32">
        #{index + 1}
      </div>
    </div>
  );
};

// ---------- Device Panel ----------
interface DevicePanelProps {
  deviceType: "desktop" | "mobile";
  images: (
    | SliderImage
    | { id: string; imageUrl: string; isPending: boolean; file: File }
  )[];
  onImagesChange: (newImages: any[]) => void;
  onUploadSelect: (deviceType: string, file: File) => void;
  onDelete: (id: number) => void;
  saving: boolean;
}

// ---------- Device Panel (updated) ----------
const DevicePanel: React.FC<DevicePanelProps> = ({
  deviceType,
  images,
  onImagesChange,
  onUploadSelect,
  onDelete,
  saving,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadSelect(deviceType, file);
    toast.info(`"${file.name}" selected, click Save to upload`);
    e.target.value = "";
  };

  const confirmDelete = (id: number) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const moveImage = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newImages = [...images];
      const dragged = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, dragged);
      onImagesChange(newImages);
    },
    [images, onImagesChange],
  );

  const removePending = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const hasPending = images.some((img) => "isPending" in img && img.isPending);
  const totalImages = images.filter(
    (img) => !("isPending" in img && img.isPending),
  ).length;

  return (
    <div className="space-y-4">
      {/* Full-width upload box */}
      <div className="relative w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden cursor-pointer">
        <div
          className="flex flex-col items-center justify-center w-full h-full"
          onClick={() =>
            document.getElementById(`upload-${deviceType}`)?.click()
          }
        >
          <Upload className="w-10 h-10 text-gray-500 mb-2" />
          <span className="text-sm text-gray-500">Upload Image</span>
          <span className="text-xs text-gray-400 mt-1">
            {totalImages} image{totalImages !== 1 ? "s" : ""}
            {hasPending && " (1 pending)"}
          </span>
        </div>
        <input
          id={`upload-${deviceType}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={saving}
        />
      </div>

      {/* Image list with drag-drop */}
      <div className="flex flex-wrap gap-3 p-2 min-h-[100px] border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
        {images.length === 0 ? (
          <p className="text-gray-400 text-sm w-full text-center py-4">
            No images added
          </p>
        ) : (
          images.map((img, idx) => {
            const isPending = "isPending" in img && img.isPending;
            return (
              <DraggableImage
                key={img.id}
                image={img}
                index={idx}
                moveImage={moveImage}
                removeImage={isPending ? removePending : confirmDelete}
              />
            );
          })
        )}
      </div>

      {/* Delete Modal (unchanged) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Slider Image"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to remove this slider image?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ---------- Main Component ----------
export const Slider: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [desktopImages, setDesktopImages] = useState<any[]>([]);
  const [mobileImages, setMobileImages] = useState<any[]>([]);

  const [pendingDesktop, setPendingDesktop] = useState<File | null>(null);
  const [pendingMobile, setPendingMobile] = useState<File | null>(null);

  useEffect(() => {
    const fetchSliders = async () => {
      setLoading(true);
      try {
        const data = await getSliders();
        setDesktopImages(data.desktop);
        setMobileImages(data.mobile);
      } catch (error) {
        toast.error("Failed to load sliders");
      } finally {
        setLoading(false);
      }
    };
    fetchSliders();
  }, []);

  const handleUploadSelect = (deviceType: string, file: File) => {
    const id = `pending-${Date.now()}-${Math.random()}`;
    const pendingItem = {
      id,
      file,
      imageUrl: URL.createObjectURL(file),
      isPending: true,
    };
    if (deviceType === "desktop") {
      setPendingDesktop(file);
      setDesktopImages((prev) => [...prev, pendingItem]);
    } else {
      setPendingMobile(file);
      setMobileImages((prev) => [...prev, pendingItem]);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSlider(id);
      setDesktopImages((prev) => prev.filter((img) => img.id !== id));
      setMobileImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Image deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      let newDesktop = [...desktopImages];
      let newMobile = [...mobileImages];

      // Upload pending desktop
      if (pendingDesktop) {
        const formData = new FormData();
        formData.append("image", pendingDesktop);
        formData.append("deviceType", "desktop");
        const newImage = await addSlider(formData);
        newDesktop = newDesktop.filter(
          (img) => !("isPending" in img && img.isPending),
        );
        newDesktop.push(newImage);
        setPendingDesktop(null);
      }

      // Upload pending mobile
      if (pendingMobile) {
        const formData = new FormData();
        formData.append("image", pendingMobile);
        formData.append("deviceType", "mobile");
        const newImage = await addSlider(formData);
        newMobile = newMobile.filter(
          (img) => !("isPending" in img && img.isPending),
        );
        newMobile.push(newImage);
        setPendingMobile(null);
      }

      // Reorder only if there are images
      if (newDesktop.length > 0) {
        const desktopIds = newDesktop.map((img) => img.id);
        await reorderSliders("desktop", desktopIds);
      }
      if (newMobile.length > 0) {
        const mobileIds = newMobile.map((img) => img.id);
        await reorderSliders("mobile", mobileIds);
      }

      setDesktopImages(newDesktop);
      setMobileImages(newMobile);
      toast.success("All changes saved successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading sliders...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mx-auto">
        <Toolbar className="py-3" title="Slider Management">
          <Button
            variant="success"
            onClick={handleSaveAll}
            loading={saving}
            disabled={
              !pendingDesktop &&
              !pendingMobile &&
              desktopImages.length === 0 &&
              mobileImages.length === 0
            }
          >
            <Save className="w-4 h-4 mr-1" /> Save All Changes
          </Button>
        </Toolbar>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel
            title="Desktop Slider"
            className="border-l-4 border-blue-500"
            titleClassName="text-blue-700 dark:text-blue-300 font-semibold"
          >
            <DevicePanel
              deviceType="desktop"
              images={desktopImages}
              onImagesChange={setDesktopImages}
              onUploadSelect={handleUploadSelect}
              onDelete={handleDelete}
              saving={saving}
            />
          </Panel>

          <Panel
            title="Mobile Slider"
            className="border-l-4 border-green-500"
            titleClassName="text-green-700 dark:text-green-300 font-semibold"
          >
            <DevicePanel
              deviceType="mobile"
              images={mobileImages}
              onImagesChange={setMobileImages}
              onUploadSelect={handleUploadSelect}
              onDelete={handleDelete}
              saving={saving}
            />
          </Panel>
        </div>
      </div>
    </DndProvider>
  );
};

export default Slider;
