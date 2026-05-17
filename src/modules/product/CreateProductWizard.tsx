import {
  CheckCircle,
  Edit,
  GripVertical,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { Editor } from "primereact/editor";
import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import api from "../../apiConfig";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { getCategories } from "../master-data/category/category.service";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "./product.service";

// ---------- EAN‑13 generator ----------
function generateEAN13(): string {
  const prefix = "890";
  const random = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  const withoutCheck = prefix + random;
  let sum = 0;
  for (let i = 0; i < withoutCheck.length; i++) {
    const digit = parseInt(withoutCheck[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return withoutCheck + check;
}

// ---------- Drag & Drop Image Component ----------
const ItemType = "IMAGE";
interface DraggableImageProps {
  image: any;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (index: number) => void;
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
  return (
    <div
      ref={ref}
      className={`relative group cursor-move ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all">
        <img
          src={image.imgUrl}
          alt="preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <GripVertical className="w-5 h-5 text-white cursor-grab" />
        </div>
        <button
          type="button"
          onClick={() => removeImage(index)}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="text-center mt-1 text-xs text-gray-500 dark:text-gray-400 truncate w-24">
        {index + 1}
      </div>
    </div>
  );
};

// ---------- Step Indicator ----------
const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          current === 1 ? "bg-blue-500 text-white" : "bg-green-500 text-white"
        }`}
      >
        {current === 1 ? 1 : <CheckCircle className="w-5 h-5" />}
      </div>
      <div className="text-sm mt-1">Basic Info</div>
    </div>
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          current === 2 ? "bg-blue-500 text-white" : "bg-green-500 text-white"
        }`}
      >
        {current === 2 ? 2 : <CheckCircle className="w-5 h-5" />}
      </div>
      <div className="text-sm mt-1">Variants</div>
    </div>
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          current === 3
            ? "bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
        }`}
      >
        3
      </div>
      <div className="text-sm mt-1">Stock & Pricing</div>
    </div>
  </div>
);

// ---------- Helper ----------
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------- Main Component ----------
export const CreateProductWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Step 1 state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [forceOrderPriority, setForceOrderPriority] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [imageList, setImageList] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImagesToKeep, setExistingImagesToKeep] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<any>({});
  const [originalProduct, setOriginalProduct] = useState<any>(null);

  // Step 2: variant decision & inline builder
  const [wantVariants, setWantVariants] = useState<boolean | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  // Variant form fields
  const [currentAttributes, setCurrentAttributes] = useState<
    Record<string, string>
  >({});
  const [selectedAttrName, setSelectedAttrName] = useState("");
  const [selectedAttrValue, setSelectedAttrValue] = useState("");
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [attributeTab, setAttributeTab] = useState<"addValue" | "newAttr">(
    "addValue",
  );
  const [existingAttrName, setExistingAttrName] = useState("");
  const [newValueInput, setNewValueInput] = useState("");
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValues, setNewAttributeValues] = useState("");
  const [variantImages, setVariantImages] = useState<any[]>([]);
  const [variantImageFiles, setVariantImageFiles] = useState<File[]>([]);
  const [variantIsImported, setVariantIsImported] = useState(false);
  const [variantCountry, setVariantCountry] = useState("");

  // Step 3: batch addition per variant (batchNo auto)
  const [batchFormData, setBatchFormData] = useState<{
    [variantId: number]: {
      buyingPrice: number;
      sellingPrice: number;
      discount: number;
      quantity: number;
    };
  }>({});

  // Load categories & attributes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories(1, 1000);
        if (res.success) setCategories(res.data);
        else toast.error("Failed to load categories");
      } catch {
        toast.error("Error loading categories");
      }
    };
    loadCategories();
    const fetchAttributes = async () => {
      try {
        const res = await api.get("/attributes");
        setAvailableAttributes(res.data.data);
      } catch {
        toast.error("Failed to load attributes");
      }
    };
    fetchAttributes();
  }, []);

  // Load product data when editing
  useEffect(() => {
    if (productId && step === 1) {
      const loadProductData = async () => {
        try {
          const product = await getProductById(productId);
          setOriginalProduct(product);
          setProductName(product.name);
          setBarcode(product.barcode || "");
          setForceOrderPriority(product.forceOrderPriority);
          setVideoUrl(product.videoUrl || "");
          setProductDetails(product.description || "");
          setSelectedCategory(
            categories.find((c) => c.id === product.categoryId) || null,
          );
          const existingImgs = product.images || [];
          setExistingImagesToKeep(existingImgs);
          setImageList(existingImgs);
          setImageFiles([]);
        } catch (err) {
          console.error(err);
        }
      };
      loadProductData();
    }
  }, [productId, step, categories]);

  // Fetch variants after product is created
  const fetchVariants = async () => {
    if (!productId) return;
    try {
      const res = await api.get(`/variant/product/${productId}`);
      setVariants(res.data.data || []);
      if (res.data.data.length > 0) {
        setWantVariants(true);
        setIsEditing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ========== Step 1: Create or Update product ==========
  const handleStep1Next = async () => {
    if (submitting) return;

    const errors: any = {};
    if (!productName.trim()) errors.name = "Product name required";
    if (!selectedCategory) errors.category = "Category required";
    if (imageList.length === 0) errors.images = "At least one image required";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    let hasChanges = false;
    if (productId && originalProduct) {
      if (productName !== originalProduct.name) hasChanges = true;
      if (barcode !== (originalProduct.barcode || "")) hasChanges = true;
      if (forceOrderPriority !== originalProduct.forceOrderPriority)
        hasChanges = true;
      if (videoUrl !== (originalProduct.videoUrl || "")) hasChanges = true;
      if (productDetails !== (originalProduct.description || ""))
        hasChanges = true;
      if (selectedCategory?.id !== originalProduct.categoryId)
        hasChanges = true;
      if (imageFiles.length > 0) hasChanges = true;
      const currentUrls = imageList.map((img) => img.imgUrl).sort();
      const originalUrls = (originalProduct.images || [])
        .map((img: any) => img.imgUrl)
        .sort();
      if (JSON.stringify(currentUrls) !== JSON.stringify(originalUrls))
        hasChanges = true;
    }

    if (!productId) {
      // New product
      try {
        setSubmitting(true);
        const formData = new FormData();
        formData.append("name", productName);
        formData.append("categoryId", selectedCategory.id);
        formData.append("forceOrderPriority", String(forceOrderPriority));
        if (videoUrl) formData.append("videoUrl", videoUrl);
        if (productDetails) formData.append("description", productDetails);
        if (barcode) formData.append("barcode", barcode);
        imageFiles.forEach((file) => formData.append("images", file));
        const newProduct = await createProduct(formData);
        setProductId(newProduct.id);
        setOriginalProduct(newProduct);
        toast.success("Product saved");
        setStep(2);
      } catch (err: any) {
        toast.error(err.message || "Failed to save product");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Existing product – update only if changed
      if (hasChanges) {
        try {
          setSubmitting(true);
          const formData = new FormData();
          formData.append("name", productName);
          formData.append("categoryId", selectedCategory.id);
          formData.append("forceOrderPriority", String(forceOrderPriority));
          if (videoUrl) formData.append("videoUrl", videoUrl);
          if (productDetails) formData.append("description", productDetails);
          if (barcode) formData.append("barcode", barcode);
          if (existingImagesToKeep.length) {
            formData.append(
              "existingImages",
              JSON.stringify(existingImagesToKeep),
            );
          }
          imageFiles.forEach((file) => formData.append("images", file));
          await updateProduct(productId, formData);
          toast.success("Product updated");
          const updatedProduct = await getProductById(productId);
          setOriginalProduct(updatedProduct);
          setExistingImagesToKeep(updatedProduct.images || []);
          setImageList(updatedProduct.images || []);
          setImageFiles([]);
        } catch (err: any) {
          toast.error(err.message || "Failed to update product");
        } finally {
          setSubmitting(false);
        }
      }
      setStep(2);
    }
  };

  // ========== Step 2: Variant CRUD ==========
  const resetVariantForm = () => {
    setCurrentAttributes({});
    setVariantImages([]);
    setVariantImageFiles([]);
    setVariantIsImported(false);
    setVariantCountry("");
    setEditingVariantId(null);
  };

  const editVariant = (variant: any) => {
    setEditingVariantId(variant.id);
    setCurrentAttributes(variant.attributes || {});
    // Load existing images (they are already full URLs)
    setVariantImages(variant.images || []);
    setVariantImageFiles([]); // no new files
    setVariantIsImported(variant.isImported || false);
    setVariantCountry(variant.countryOfOrigin || "");
  };

  const deleteVariant = async (id: number) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      await api.delete(`/variant/${id}`);
      toast.success("Variant deleted");
      await fetchVariants();
      if (editingVariantId === id) resetVariantForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete variant");
    }
  };

  const saveVariant = async () => {
    if (!productId) return;
    if (submitting) return;
    if (Object.keys(currentAttributes).length === 0) {
      toast.error("Please add at least one attribute-value pair");
      return;
    }

    if (editingVariantId) {
      // Update existing variant – send FormData with existing images and new files
      const formData = new FormData();
      formData.append("attributes", JSON.stringify(currentAttributes));
      formData.append("isImported", String(variantIsImported));
      if (variantCountry) formData.append("countryOfOrigin", variantCountry);
      // Extract existing image URLs (those that are not blob:)
      const existingImgUrls = variantImages
        .filter((img) => !img.imgUrl.startsWith("blob:"))
        .map((img) => ({ imgUrl: img.imgUrl }));
      formData.append("existingImages", JSON.stringify(existingImgUrls));
      // Append new image files
      variantImageFiles.forEach((file) => formData.append("images", file));

      try {
        setSubmitting(true);
        await api.put(`/variant/${editingVariantId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Variant updated");
        await fetchVariants();
        resetVariantForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to update variant");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Create new variant
      const formData = new FormData();
      formData.append("productId", String(productId));
      formData.append("attributes", JSON.stringify(currentAttributes));
      formData.append("isImported", String(variantIsImported));
      if (variantCountry) formData.append("countryOfOrigin", variantCountry);
      variantImageFiles.forEach((file) => formData.append("images", file));

      try {
        setSubmitting(true);
        await api.post("/variant/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Variant added");
        await fetchVariants();
        resetVariantForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to add variant");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const createDefaultVariant = async () => {
    if (!productId) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await api.post("/variant/create-default", {
        productId,
        isImported: false,
      });
      toast.success("Default variant created");
      await fetchVariants();
      setWantVariants(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create default variant",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========== Step 3: Add stock batch ==========
  const addStock = async (variantId: number) => {
    const data = batchFormData[variantId];
    if (
      !data ||
      data.buyingPrice <= 0 ||
      data.sellingPrice <= 0 ||
      data.quantity <= 0
    ) {
      toast.error("Fill all stock fields correctly");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/stock/add", {
        variantId,
        batchNo: "", // backend will assign next number
        buyingOrMakingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
        discountPercent: data.discount,
        quantity: data.quantity,
      });
      toast.success("Stock added");
      await fetchVariants();
      setBatchFormData((prev) => ({
        ...prev,
        [variantId]: {
          buyingPrice: 0,
          sellingPrice: 0,
          discount: 0,
          quantity: 0,
        },
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== Publish ==========
  const handlePublish = async () => {
    if (!productId) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await updateProduct(productId, { isPublished: true });
      toast.success("Product published successfully!");
      navigate("/admin/product");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish product");
    } finally {
      setSubmitting(false);
    }
  };

  // Product image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const mockUrl = URL.createObjectURL(file);
      setImageList((prev) => [...prev, { imgUrl: mockUrl }]);
      setImageFiles((prev) => [...prev, file]);
    }
  };
  const removeProductImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    const removed = imageList[index];
    if (removed && removed.id) {
      setExistingImagesToKeep((prev) =>
        prev.filter((img) => img.id !== removed.id),
      );
    }
  };

  // Variant image handlers
  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const mockUrl = URL.createObjectURL(file);
      setVariantImages((prev) => [...prev, { imgUrl: mockUrl }]);
      setVariantImageFiles((prev) => [...prev, file]);
    }
  };
  const removeVariantImage = (idx: number) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== idx));
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Attribute handlers
  const handleValueSelect = (value: string) => {
    if (!selectedAttrName || !value) return;
    setCurrentAttributes((prev) => ({ ...prev, [selectedAttrName]: value }));
    setSelectedAttrName("");
    setSelectedAttrValue("");
  };
  const removeCurrentAttribute = (key: string) => {
    const newAttrs = { ...currentAttributes };
    delete newAttrs[key];
    setCurrentAttributes(newAttrs);
  };
  const handleAddValueToExisting = async () => {
    if (!existingAttrName || !newValueInput.trim())
      return toast.error("Select attribute and enter value(s)");
    const newValues = newValueInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const attr = availableAttributes.find((a) => a.name === existingAttrName);
    if (!attr) return;
    const merged = [...new Set([...attr.values, ...newValues])];
    try {
      await api.put(`/attributes/${attr.id}`, { values: merged });
      const res = await api.get("/attributes");
      setAvailableAttributes(res.data.data);
      toast.success("Value added");
      setShowAddAttribute(false);
    } catch {
      toast.error("Failed");
    }
  };
  const handleAddNewAttribute = async () => {
    if (!newAttributeName || !newAttributeValues)
      return toast.error("Provide name and values");
    const values = newAttributeValues.split(",").map((v) => v.trim());
    try {
      await api.post("/attributes", { name: newAttributeName, values });
      const res = await api.get("/attributes");
      setAvailableAttributes(res.data.data);
      toast.success("Attribute created");
      setShowAddAttribute(false);
    } catch {
      toast.error("Failed");
    }
  };

  // Helper to format variant display name for step 3
  const formatVariantName = (variant: any) => {
    const attrEntries = Object.entries(variant.attributes || {});
    if (attrEntries.length === 0) return productName;
    const attrStr = attrEntries.map(([k, v]) => `${k}: ${v}`).join(", ");
    return `${productName} (${attrStr})`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
        <StepIndicator current={step} />

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Product Name *"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                error={formErrors.name}
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <Dropdown
                  value={selectedCategory?.id}
                  options={categories}
                  onChange={(e) =>
                    setSelectedCategory(
                      categories.find((c) => c.id === e.value),
                    )
                  }
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select category"
                  className="w-full"
                />
                {formErrors.category && (
                  <p className="text-red-500 text-xs">{formErrors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Barcode (optional)
                </label>
                <div className="flex gap-2">
                  <InputField
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setBarcode(generateEAN13())}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <InputField
                label="Force Order Priority (0 = disabled)"
                type="number"
                value={forceOrderPriority}
                onChange={(e) => setForceOrderPriority(Number(e.target.value))}
              />
              <InputField
                label="Video URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Editor
                value={productDetails}
                onTextChange={(e) => setProductDetails(e.htmlValue)}
                style={{ height: "200px" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Images *
              </label>
              <div className="mb-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">Upload Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {imageList.map((img, idx) => (
                  <DraggableImage
                    key={idx}
                    image={img}
                    index={idx}
                    moveImage={(drag, hover) => {
                      const newList = [...imageList];
                      const dragged = newList[drag];
                      newList.splice(drag, 1);
                      newList.splice(hover, 0, dragged);
                      setImageList(newList);
                    }}
                    removeImage={removeProductImage}
                  />
                ))}
              </div>
              {formErrors.images && (
                <p className="text-red-500 text-xs">{formErrors.images}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStep1Next} loading={submitting}>
                Save & Next →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            {!isEditing && wantVariants === null && (
              <div className="border rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">
                  Do you want to add variants?
                </h3>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="primary"
                    onClick={() => setWantVariants(true)}
                  >
                    Yes, add variants
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setWantVariants(false);
                      createDefaultVariant();
                    }}
                  >
                    No, single product
                  </Button>
                </div>
              </div>
            )}

            {(wantVariants === true || isEditing) && (
              <>
                <div className="border rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingVariantId ? "Edit Variant" : "Add New Variant"}
                  </h3>
                  {/* Attribute builder */}
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border mb-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium">
                          Attribute Name
                        </label>
                        <Dropdown
                          value={selectedAttrName}
                          options={availableAttributes.map((a) => ({
                            label: a.name,
                            value: a.name,
                          }))}
                          onChange={(e) => {
                            setSelectedAttrName(e.value);
                            setSelectedAttrValue("");
                          }}
                          placeholder="Select attribute"
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium">
                          Attribute Value
                        </label>
                        <Dropdown
                          value={selectedAttrValue}
                          options={
                            availableAttributes
                              .find((a) => a.name === selectedAttrName)
                              ?.values.map((v: string) => ({
                                label: v,
                                value: v,
                              })) || []
                          }
                          onChange={(e) => handleValueSelect(e.value)}
                          placeholder="Select value"
                          disabled={!selectedAttrName}
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddAttribute(true)}
                        className="text-blue-600 text-sm flex items-center gap-1 mt-2"
                      >
                        <Plus className="w-4 h-4" /> New Attribute
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Current Attributes
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-white rounded-lg border border-dashed">
                      {Object.entries(currentAttributes).length === 0 ? (
                        <span className="text-gray-400 text-sm">
                          No attributes selected
                        </span>
                      ) : (
                        Object.entries(currentAttributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-full text-sm"
                          >
                            {k}: {v}
                            <X
                              className="w-3.5 h-3.5 cursor-pointer hover:text-red-600"
                              onClick={() => removeCurrentAttribute(k)}
                            />
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Variant Images (max 3)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {variantImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded overflow-hidden border"
                        >
                          <img
                            src={img.imgUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeVariantImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {variantImages.length < 3 && (
                        <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                          <Upload className="w-6 h-6 text-gray-400" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleVariantImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-medium">Is Imported?</span>
                    <label>
                      <input
                        type="radio"
                        name="variantImported"
                        checked={!variantIsImported}
                        onChange={() => {
                          setVariantIsImported(false);
                          setVariantCountry("");
                        }}
                      />{" "}
                      No
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="variantImported"
                        checked={variantIsImported}
                        onChange={() => setVariantIsImported(true)}
                      />{" "}
                      Yes
                    </label>
                  </div>
                  {variantIsImported && (
                    <InputField
                      label="Country of Origin"
                      value={variantCountry}
                      onChange={(e) => setVariantCountry(e.target.value)}
                    />
                  )}
                  <div className="flex justify-end gap-3">
                    {editingVariantId && (
                      <Button variant="outline" onClick={resetVariantForm}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      onClick={saveVariant}
                      disabled={Object.keys(currentAttributes).length === 0}
                      loading={submitting}
                    >
                      {editingVariantId ? "Update Variant" : "Add Variant"}
                    </Button>
                  </div>
                </div>

                {variants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Variants List
                    </h3>
                    <DataTable value={variants} stripedRows>
                      <Column field="sku" header="SKU" />
                      <Column
                        header="Attributes"
                        body={(row) =>
                          Object.entries(row.attributes || {})
                            .map(([k, v]) => `${k}:${v}`)
                            .join(", ") || "—"
                        }
                      />
                      <Column
                        header="Imported"
                        body={(row) => (row.isImported ? "Yes" : "No")}
                      />
                      <Column
                        header="Actions"
                        body={(row) => (
                          <div className="flex gap-2">
                            <button
                              onClick={() => editVariant(row)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVariant(row.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      />
                    </DataTable>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep(3)}
                    disabled={variants.length === 0}
                  >
                    Next: Stock & Pricing →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Stock & Pricing</h3>
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="border rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-lg">
                      {formatVariantName(variant)}
                    </h4>
                    <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                  </div>
                </div>

                {variant.stocks && variant.stocks.length > 0 && (
                  <DataTable
                    value={variant.stocks}
                    className="mb-4"
                    size="small"
                  >
                    <Column field="batchNo" header="Batch" />
                    <Column field="buyingOrMakingPrice" header="Buying Price" />
                    <Column field="sellingPrice" header="Selling Price" />
                    <Column field="discountPercent" header="Discount %" />
                    <Column field="currentQty" header="Quantity" />
                  </DataTable>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium mb-2">
                    Add new stock batch (batch number auto)
                  </h5>
                  <div className="grid grid-cols-4 gap-3 items-end">
                    <InputField
                      label="Buying Price"
                      type="number"
                      value={batchFormData[variant.id]?.buyingPrice || 0}
                      onChange={(e) =>
                        setBatchFormData((prev) => ({
                          ...prev,
                          [variant.id]: {
                            ...prev[variant.id],
                            buyingPrice: Number(e.target.value),
                          },
                        }))
                      }
                    />
                    <InputField
                      label="Selling Price"
                      type="number"
                      value={batchFormData[variant.id]?.sellingPrice || 0}
                      onChange={(e) =>
                        setBatchFormData((prev) => ({
                          ...prev,
                          [variant.id]: {
                            ...prev[variant.id],
                            sellingPrice: Number(e.target.value),
                          },
                        }))
                      }
                    />
                    <InputField
                      label="Discount %"
                      type="number"
                      value={batchFormData[variant.id]?.discount || 0}
                      onChange={(e) =>
                        setBatchFormData((prev) => ({
                          ...prev,
                          [variant.id]: {
                            ...prev[variant.id],
                            discount: Number(e.target.value),
                          },
                        }))
                      }
                    />
                    <InputField
                      label="Quantity"
                      type="number"
                      value={batchFormData[variant.id]?.quantity || 0}
                      onChange={(e) =>
                        setBatchFormData((prev) => ({
                          ...prev,
                          [variant.id]: {
                            ...prev[variant.id],
                            quantity: Number(e.target.value),
                          },
                        }))
                      }
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addStock(variant.id)}
                      disabled={submitting}
                      className="col-span-4 mt-2"
                    >
                      Add Stock Batch
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Save Draft
                </Button>
                <Button
                  variant="success"
                  onClick={handlePublish}
                  loading={submitting}
                >
                  Save & Publish
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Attribute Modal */}
        {showAddAttribute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex border-b mb-4">
                <button
                  className={`flex-1 pb-2 text-center ${attributeTab === "addValue" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                  onClick={() => setAttributeTab("addValue")}
                >
                  Add Value to Existing
                </button>
                <button
                  className={`flex-1 pb-2 text-center ${attributeTab === "newAttr" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                  onClick={() => setAttributeTab("newAttr")}
                >
                  Add New Attribute
                </button>
              </div>
              {attributeTab === "addValue" && (
                <div>
                  <Dropdown
                    value={existingAttrName}
                    options={availableAttributes.map((a) => ({
                      label: a.name,
                      value: a.name,
                    }))}
                    onChange={(e) => setExistingAttrName(e.value)}
                    placeholder="Select attribute"
                    className="w-full mb-3"
                  />
                  <InputField
                    label="New Value(s) (comma separated)"
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddAttribute(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddValueToExisting}>
                      Add Value
                    </Button>
                  </div>
                </div>
              )}
              {attributeTab === "newAttr" && (
                <div>
                  <InputField
                    label="Attribute Name"
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                  />
                  <InputField
                    label="Values (comma separated)"
                    value={newAttributeValues}
                    onChange={(e) => setNewAttributeValues(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddAttribute(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddNewAttribute}>
                      Add Attribute
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CreateProductWizard;
