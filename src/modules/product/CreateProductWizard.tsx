import {
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
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
import Barcode from "react-barcode";
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

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-between my-8">
    {/* Step 1 */}
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          current === 1
            ? "bg-blue-500 text-white border-2 border-blue-500"
            : "bg-green-500 text-white border-2 border-green-500"
        }`}
      >
        {current === 1 ? 1 : <CheckCircle className="w-5 h-5" />}
      </div>
      <div className="text-sm mt-1">Basic Info</div>
    </div>

    {/* Connector 1 → 2 - solid line */}
    <div
      className={`flex-1 border-t-2 ${
        current > 1 ? "border-green-500" : "border-gray-300 dark:border-gray-600"
      }`}
    />

    {/* Step 2 */}
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          current === 2
            ? "bg-blue-500 text-white border-blue-500"
            : current > 2
            ? "bg-green-500 text-white border-green-500"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
        }`}
      >
        {current === 2 ? 2 : current > 2 ? <CheckCircle className="w-5 h-5" /> : 2}
      </div>
      <div className="text-sm mt-1">Variants</div>
    </div>

    {/* Connector 2 → 3 - solid line */}
    <div
      className={`flex-1 border-t-2 ${
        current > 2 ? "border-green-500" : "border-gray-300 dark:border-gray-600"
      }`}
    />

    {/* Step 3 */}
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          current === 3
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
        }`}
      >
        3
      </div>
      <div className="text-sm mt-1">Stock & Pricing</div>
    </div>
  </div>
);

export const CreateProductWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [forceOrderPriority, setForceOrderPriority] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [existingThumbnailId, setExistingThumbnailId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [originalProduct, setOriginalProduct] = useState<any>(null);

  // Step 2: variants and inline form
  const [variants, setVariants] = useState<any[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [currentAttributes, setCurrentAttributes] = useState<Record<string, string>>({});
  const [selectedAttrName, setSelectedAttrName] = useState("");
  const [selectedAttrValue, setSelectedAttrValue] = useState("");
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [attributeTab, setAttributeTab] = useState<"addValue" | "newAttr">("addValue");
  const [existingAttrName, setExistingAttrName] = useState("");
  const [newValueInput, setNewValueInput] = useState("");
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValues, setNewAttributeValues] = useState("");
  const [variantIsImported, setVariantIsImported] = useState(false);
  const [variantCountry, setVariantCountry] = useState("");
  const [variantBarcode, setVariantBarcode] = useState("");
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Step 3: pending price sets (temporary, not yet saved)
  const [pendingStocks, setPendingStocks] = useState<{
    [variantId: number]: Array<{
      id: string;
      buyingPrice: number;
      sellingPrice: number;
      discount: number;
      isEditing?: boolean;
    }>;
  }>({});
  const [newPriceSet, setNewPriceSet] = useState<{
    [variantId: number]: {
      buyingPrice: number;
      sellingPrice: number;
      discount: number;
    };
  }>({});

  // Helper to add a temporary price set row
  const addTempStock = (variantId: number) => {
    const formData = newPriceSet[variantId];
    if (!formData || formData.buyingPrice <= 0 || formData.sellingPrice <= 0) {
      toast.error("Please fill buying price and MRP");
      return;
    }
    const newId = `temp-${Date.now()}-${Math.random()}`;
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: [
        ...(prev[variantId] || []),
        {
          id: newId,
          buyingPrice: formData.buyingPrice,
          sellingPrice: formData.sellingPrice,
          discount: formData.discount,
          isEditing: false,
        },
      ],
    }));
    setNewPriceSet((prev) => ({
      ...prev,
      [variantId]: { buyingPrice: 0, sellingPrice: 0, discount: 0 },
    }));
  };

  const removeTempStock = (variantId: number, tempId: string) => {
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).filter((p) => p.id !== tempId),
    }));
  };

  const editTempStock = (variantId: number, tempId: string) => {
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).map((p) =>
        p.id === tempId ? { ...p, isEditing: true } : p
      ),
    }));
  };

  const saveTempStock = (variantId: number, tempId: string) => {
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).map((p) =>
        p.id === tempId ? { ...p, isEditing: false } : p
      ),
    }));
  };

  const updateTempStock = (
    variantId: number,
    tempId: string,
    field: "buyingPrice" | "sellingPrice" | "discount",
    value: number
  ) => {
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).map((p) =>
        p.id === tempId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const saveAllPendingStocks = async () => {
    for (const variant of variants) {
      const existingCount = variant.stocks?.length || 0;
      const pendingCount = pendingStocks[variant.id]?.length || 0;
      if (existingCount + pendingCount === 0) {
        throw new Error(`Variant "${productName}" must have at least one price set.`);
      }
    }
    if (Object.keys(pendingStocks).length === 0) return;
    try {
      setSubmitting(true);
      for (const variantIdStr of Object.keys(pendingStocks)) {
        const variantId = parseInt(variantIdStr);
        const stocks = pendingStocks[variantId] || [];
        for (const stock of stocks) {
          if (stock.buyingPrice > 0 && stock.sellingPrice > 0) {
            await api.post("/stock/add", {
              variantId,
              batchNo: "",
              buyingOrMakingPrice: stock.buyingPrice,
              sellingPrice: stock.sellingPrice,
              discountPercent: stock.discount,
              quantity: 0,
            });
          }
        }
      }
      setPendingStocks({});
      await fetchVariants();
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

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

  useEffect(() => {
    if (productId && step === 1) {
      const loadProductData = async () => {
        try {
          const product = await getProductById(productId);
          setOriginalProduct(product);
          setProductName(product.name);
          setForceOrderPriority(product.forceOrderPriority);
          setVideoUrl(product.videoUrl || "");
          setProductDetails(product.description || "");
          setSelectedCategory(
            categories.find((c) => c.id === product.categoryId) || null,
          );
          const existingImg = product.images?.[0] || null;
          setThumbnailImage(existingImg);
          setExistingThumbnailId(existingImg?.id || null);
          setThumbnailFile(null);
        } catch (err) {
          console.error(err);
        }
      };
      loadProductData();
    }
  }, [productId, step, categories]);

  const createDefaultVariant = async (prodId: number) => {
    const formData = new FormData();
    formData.append("productId", String(prodId));
    formData.append("attributes", JSON.stringify({}));
    formData.append("isImported", "false");
    await api.post("/variant/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const fetchVariants = async () => {
    if (!productId) return;
    try {
      let res = await api.get(`/variant/product/${productId}`);
      let dbVariants = (res.data.data || []).map((v: any) => ({
        ...v,
        images: v.images || [],
      }));
      if (dbVariants.length === 0) {
        await createDefaultVariant(productId);
        res = await api.get(`/variant/product/${productId}`);
        dbVariants = (res.data.data || []).map((v: any) => ({
          ...v,
          images: v.images || [],
        }));
      }
      setVariants(dbVariants);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load variants");
    }
  };

  const handleStep1Next = async () => {
    if (submitting) return;

    const errors: any = {};
    if (!productName.trim()) errors.name = "Product name required";
    if (!selectedCategory) errors.category = "Category required";
    if (!thumbnailImage && !thumbnailFile) errors.images = "Thumbnail image is required";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    let hasChanges = false;
    if (productId && originalProduct) {
      if (productName !== originalProduct.name) hasChanges = true;
      if (forceOrderPriority !== originalProduct.forceOrderPriority) hasChanges = true;
      if (videoUrl !== (originalProduct.videoUrl || "")) hasChanges = true;
      if (productDetails !== (originalProduct.description || "")) hasChanges = true;
      if (selectedCategory?.id !== originalProduct.categoryId) hasChanges = true;
      if (thumbnailFile) hasChanges = true;
      const currentThumbUrl = thumbnailImage?.imgUrl;
      const originalThumbUrl = originalProduct.images?.[0]?.imgUrl;
      if (currentThumbUrl !== originalThumbUrl) hasChanges = true;
    }

    if (!productId) {
      try {
        setSubmitting(true);
        const formData = new FormData();
        formData.append("name", productName);
        formData.append("categoryId", selectedCategory.id);
        formData.append("forceOrderPriority", String(forceOrderPriority));
        if (videoUrl) formData.append("videoUrl", videoUrl);
        if (productDetails) formData.append("description", productDetails);
        if (thumbnailFile) formData.append("images", thumbnailFile);
        const newProduct = await createProduct(formData);
        setProductId(newProduct.id);
        setOriginalProduct(newProduct);
        toast.success("Product saved");
        await createDefaultVariant(newProduct.id);
        await fetchVariants();
        setStep(2);
      } catch (err: any) {
        toast.error(err.message || "Failed to save product");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (hasChanges) {
        try {
          setSubmitting(true);
          const formData = new FormData();
          formData.append("name", productName);
          formData.append("categoryId", selectedCategory.id);
          formData.append("forceOrderPriority", String(forceOrderPriority));
          if (videoUrl) formData.append("videoUrl", videoUrl);
          if (productDetails) formData.append("description", productDetails);
          const existingImages = thumbnailImage ? [thumbnailImage] : [];
          formData.append("existingImages", JSON.stringify(existingImages));
          if (thumbnailFile) formData.append("images", thumbnailFile);
          await updateProduct(productId, formData);
          toast.success("Product updated");
          const updatedProduct = await getProductById(productId);
          setOriginalProduct(updatedProduct);
          const updatedImg = updatedProduct.images?.[0] || null;
          setThumbnailImage(updatedImg);
          setExistingThumbnailId(updatedImg?.id || null);
          setThumbnailFile(null);
        } catch (err: any) {
          toast.error(err.message || "Failed to update product");
        } finally {
          setSubmitting(false);
        }
      }
      setStep(2);
      await fetchVariants();
    }
  };

  const deleteDefaultVariantIfExists = async () => {
    const defaultVariant = variants.find(
      (v) => Object.keys(v.attributes || {}).length === 0,
    );
    if (defaultVariant && defaultVariant.id) {
      try {
        await api.delete(`/variant/${defaultVariant.id}`);
        console.log("Default variant deleted");
      } catch (err) {
        console.warn("Could not delete default variant", err);
      }
    }
  };

  const openAddVariantForm = () => {
    setEditingVariantId(null);
    setCurrentAttributes({});
    setVariantIsImported(false);
    setVariantCountry("");
    setVariantBarcode("");
    setIsEditingMode(false);
    setShowVariantForm(true);
  };

  const openEditVariantForm = (variant: any) => {
    setEditingVariantId(variant.id);
    setCurrentAttributes(variant.attributes || {});
    setVariantIsImported(variant.isImported || false);
    setVariantCountry(variant.countryOfOrigin || "");
    setVariantBarcode(variant.barcode || "");
    setIsEditingMode(true);
    setShowVariantForm(true);
  };

  const closeVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariantId(null);
    setIsEditingMode(false);
  };

  const saveVariant = async () => {
    if (!productId) return;
    if (submitting) return;

    if (!isEditingMode && Object.keys(currentAttributes).length === 0) {
      toast.error("Please add at least one attribute-value pair for new variant");
      return;
    }

    const formData = new FormData();
    formData.append("attributes", JSON.stringify(currentAttributes));
    formData.append("isImported", String(variantIsImported));
    if (variantCountry) formData.append("countryOfOrigin", variantCountry);
    if (variantBarcode) formData.append("barcode", variantBarcode);

    try {
      setSubmitting(true);
      if (isEditingMode && editingVariantId) {
        await api.put(`/variant/${editingVariantId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Variant updated");
      } else {
        formData.append("productId", String(productId));
        await api.post("/variant/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Variant added");
        await deleteDefaultVariantIfExists();
      }
      await fetchVariants();
      closeVariantForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save variant");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVariant = async (id: number) => {
    if (variants.length === 1) {
      toast.error("Product must have at least one variant. Cannot delete the last variant.");
      return;
    }
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      await api.delete(`/variant/${id}`);
      toast.success("Variant deleted");
      await fetchVariants();
      if (editingVariantId === id) {
        closeVariantForm();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete variant");
    }
  };

  const handleVariantImageUpload = async (variantId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    const variant = variants.find((v) => v.id === variantId);
    const existingImages = variant?.images || [];
    formData.append("existingImages", JSON.stringify(existingImages));
    Array.from(files).forEach((file) => formData.append("images", file));
    try {
      setSubmitting(true);
      await api.put(`/variant/${variantId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Images added");
      await fetchVariants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload images");
    } finally {
      setSubmitting(false);
    }
  };

  const removeVariantImage = async (variantId: number, imageUrl: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const remainingImages = (variant.images || []).filter((img: any) => img.imgUrl !== imageUrl);
    const formData = new FormData();
    formData.append("existingImages", JSON.stringify(remainingImages));
    try {
      setSubmitting(true);
      await api.put(`/variant/${variantId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Image removed");
      await fetchVariants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove image");
    } finally {
      setSubmitting(false);
    }
  };

  const variantImagesBody = (rowData: any) => {
    const images = rowData.images || [];
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {images.slice(0, 3).map((img: any, idx: number) => (
            <div key={idx} className="relative group">
              <img
                src={img.imgUrl}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(img.imgUrl, '_blank')}
                title="Click to view full image"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariantImage(rowData.id, img.imgUrl);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length > 3 && (
            <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
              +{images.length - 3}
            </span>
          )}
        </div>
        <label className="cursor-pointer p-1 hover:bg-gray-100 rounded">
          <Camera className="w-4 h-4 text-gray-500" />
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleVariantImageUpload(rowData.id, e.target.files)}
          />
        </label>
      </div>
    );
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const mockUrl = URL.createObjectURL(file);
      setThumbnailImage({ imgUrl: mockUrl, isNew: true });
      setThumbnailFile(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailImage(null);
    setThumbnailFile(null);
    if (existingThumbnailId) {
      // Will be removed via existingImages array in update
    }
  };

  const formatVariantName = (variant: any) => productName;

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
    const newValues = newValueInput.split(",").map((v) => v.trim()).filter(Boolean);
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

  useEffect(() => {
    if (step === 2 && productId) {
      fetchVariants();
    }
  }, [step, productId]);

  const isDefaultVariant = isEditingMode && editingVariantId && Object.keys(currentAttributes).length === 0;

  const hasMissingPriceSet = () => {
    for (const variant of variants) {
      const existingCount = variant.stocks?.length || 0;
      const pendingCount = pendingStocks[variant.id]?.length || 0;
      if (existingCount + pendingCount === 0) {
        return true;
      }
    }
    return false;
  };

  const handleSaveDraft = async () => {
    if (!productId) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await saveAllPendingStocks();
      toast.success("Product saved to draft successfully!");
      navigate("/products/product-list");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!productId) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await saveAllPendingStocks();
      await api.patch(`/products/publish/${productId}`);
      toast.success("Product registered successfully!");
      navigate("/products/product-list");
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || "Failed to publish product");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriceSetCount = (variant: any) => {
    const existing = variant.stocks?.length || 0;
    const pending = pendingStocks[variant.id]?.length || 0;
    return existing + pending;
  };

  return (
    <div className="max-w-6xl mx-auto rounded-md">
      <StepIndicator current={step} />

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
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Dropdown
                value={selectedCategory?.id}
                options={categories}
                onChange={(e) => setSelectedCategory(categories.find((c) => c.id === e.value))}
                optionLabel="name"
                optionValue="id"
                placeholder="Select category"
                className="w-full"
              />
              {formErrors.category && <p className="text-red-500 text-xs">{formErrors.category}</p>}
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
            <label className="block text-sm font-medium mb-2">Description</label>
            <Editor
              value={productDetails}
              onTextChange={(e) => setProductDetails(e.htmlValue as any)}
              style={{ height: "200px" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail Image *</label>
            <div className="relative w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
              {thumbnailImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={thumbnailImage.imgUrl}
                    alt="Thumbnail"
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    onClick={() => window.open(thumbnailImage.imgUrl, '_blank')}
                    title="Click to view full image"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                >
                  <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Only one image (thumbnail)</p>
                </div>
              )}
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>
            {formErrors.images && <p className="text-red-500 text-xs mt-1">{formErrors.images}</p>}
          </div>
          <div className="modal-sticky-footer">
            <Button onClick={handleStep1Next} loading={submitting}>Save & Next →</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="z-1 sticky top-[-1px] flex justify-between items-center bg-gray-200 dark:bg-gray-800  p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              💡 Do you have variants such as color, size, etc? Add variant from here.
            </span>
            <div className="flex gap-2">
              {showVariantForm && (
                <Button variant="outline" onClick={closeVariantForm}>Cancel</Button>
              )}
              {showVariantForm ? (
                <Button variant="primary" onClick={saveVariant} loading={submitting}>
                  {isEditingMode ? "Update Variant" : "Save Variant"}
                </Button>
              ) : (
                <Button variant="primary" onClick={openAddVariantForm}>
                  <Plus className="w-4 h-4 mr-2" /> Add Variant
                </Button>
              )}
            </div>
          </div>

          {showVariantForm && (
            <div className="border rounded-md p-5 border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">
                {isEditingMode ? (isDefaultVariant ? "Edit" : "Edit Variant") : "Add New Variant"}
              </h3>
              {(!isDefaultVariant || !isEditingMode) && (
                <>
                  <div className="p-4 rounded-md">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1">
                        <div className="flex gap-1">
                          <label className="block text-xs font-medium">Attribute Name</label>
                          <button
                            onClick={() => setShowAddAttribute(true)}
                            className="flex gap-1 btn-primary text-[8px]! px-1 py-0.5 rounded items-center cursor-pointer"
                          >
                            <Plus className="w-2 h-2" /> <span className="mt-[.5px]">New</span>
                          </button>
                        </div>
                        <Dropdown
                          value={selectedAttrName}
                          options={availableAttributes.map((a) => ({ label: a.name, value: a.name }))}
                          onChange={(e) => { setSelectedAttrName(e.value); setSelectedAttrValue(""); }}
                          placeholder="Select attribute"
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium">Attribute Value</label>
                        <Dropdown
                          value={selectedAttrValue}
                          options={availableAttributes.find((a) => a.name === selectedAttrName)?.values.map((v: string) => ({ label: v, value: v })) || []}
                          onChange={(e) => handleValueSelect(e.value)}
                          placeholder="Select value"
                          disabled={!selectedAttrName}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Current Attributes</label>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                      {Object.entries(currentAttributes).length === 0 ? (
                        <span className="text-gray-400 text-sm">No attributes selected</span>
                      ) : (
                        Object.entries(currentAttributes).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-200 dark:bg-blue-800 rounded-full text-sm">
                            {k}: {v}
                            <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-600" onClick={() => removeCurrentAttribute(k)} />
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Barcode (optional)</label>
                <div className="flex gap-2">
                  <InputField
                    value={variantBarcode}
                    onChange={(e) => setVariantBarcode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setVariantBarcode(generateEAN13())}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                {(variantBarcode || (isEditingMode && editingVariantId)) && (
                  <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Barcode Number:</span>
                        <span className="text-gray-800 dark:text-gray-200 font-mono">{variantBarcode || "—"}</span>
                      </div>
                      {variantBarcode && (
                        <div className="flex justify-center pt-2">
                          <div className="bg-white p-2 rounded shadow-sm">
                            <Barcode value={variantBarcode} format="CODE128" width={1.5} height={40} fontSize={10} margin={0} displayValue={true} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium">Is Imported?</span>
                <label>
                  <input type="radio" name="variantImported" checked={!variantIsImported} onChange={() => { setVariantIsImported(false); setVariantCountry(""); }} /> No
                </label>
                <label>
                  <input type="radio" name="variantImported" checked={variantIsImported} onChange={() => setVariantIsImported(true)} /> Yes
                </label>
              </div>
              {variantIsImported && (
                <InputField label="Country of Origin" value={variantCountry} onChange={(e) => setVariantCountry(e.target.value)} />
              )}
            </div>
          )}

          <DataTable value={variants} stripedRows emptyMessage="No variants found" rowClassName={() => "table-row"}>
            <Column header="Name" body={() => productName} sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column field="sku" header="SKU" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column field="barcode" header="Barcode" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column
              header="Attributes"
              body={(row) => Object.entries(row.attributes || {}).map(([k, v]) => `${k}:${v}`).join(", ") || "—"}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column header="Imported" body={(row) => (row.isImported ? "Yes" : "No")} sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Images" body={variantImagesBody} style={{ width: "200px" }} headerClassName="column-header" bodyClassName="column-body" />
            <Column
              header="Actions"
              body={(row) => (
                <div className="flex gap-2">
                  <button onClick={() => openEditVariantForm(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteVariant(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              style={{ width: "120px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>

          <div className="modal-sticky-footer gap-4">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4" /> Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Pricing <ChevronRight className="w-4 h-4 mt-1" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          {variants.map((variant) => {
            const existingStocks = variant.stocks || [];
            const tempStocks = pendingStocks[variant.id] || [];
            const allRows = [
              ...existingStocks.map((s) => ({ ...s, _isTemp: false, id: s.id })),
              ...tempStocks.map((t) => ({ ...t, _isTemp: true })),
            ];
            const formValues = newPriceSet[variant.id] || { buyingPrice: 0, sellingPrice: 0, discount: 0 };
            const hasPriceSets = getPriceSetCount(variant) > 0;

            return (
              <div key={variant.id} className="border rounded-md p-5 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="mb-3">
                  <h4 className="font-medium text-base">{productName}</h4>
                  <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                  {variant.barcode && <p className="text-xs text-gray-500">Barcode: {variant.barcode}</p>}
                </div>

                {hasPriceSets ? (
                  <DataTable
                    value={allRows}
                    stripedRows
                    emptyMessage="No price sets added yet"
                    rowClassName={() => "table-row"}
                    className="mb-4"
                  >
                    <Column
                      header="Buying Price"
                      body={(row) =>
                        row._isTemp && row.isEditing ? (
                          <input
                            type="number"
                            value={row.buyingPrice}
                            onChange={(e) => updateTempStock(variant.id, row.id, "buyingPrice", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-xs">{row.buyingOrMakingPrice || row.buyingPrice}</span>
                        )
                      }
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                    <Column
                      header="MRP"
                      body={(row) =>
                        row._isTemp && row.isEditing ? (
                          <input
                            type="number"
                            value={row.sellingPrice}
                            onChange={(e) => updateTempStock(variant.id, row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-xs">{row.sellingPrice}</span>
                        )
                      }
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                    <Column
                      header="Discount %"
                      body={(row) =>
                        row._isTemp && row.isEditing ? (
                          <input
                            type="number"
                            value={row.discount}
                            onChange={(e) => updateTempStock(variant.id, row.id, "discount", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-xs">{row.discountPercent || row.discount}</span>
                        )
                      }
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                    <Column
                      header="Actions"
                      body={(row) => {
                        if (row._isTemp) {
                          return (
                            <div className="flex gap-2">
                              {row.isEditing ? (
                                <button
                                  onClick={() => saveTempStock(variant.id, row.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Save"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => editTempStock(variant.id, row.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => removeTempStock(variant.id, row.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }
                        return null;
                      }}
                      style={{ width: "100px" }}
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                  </DataTable>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-md mb-4">
                    No price sets added yet. Use the form below to add your first price set.
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Buying Price</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formValues.buyingPrice === 0 ? "" : formValues.buyingPrice}
                        onFocus={(e) => { if (e.target.value === "0") e.target.value = ""; }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: { ...prev[variant.id], buyingPrice: 0 },
                            }));
                          }
                        }}
                        onChange={(e) =>
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: { ...prev[variant.id], buyingPrice: parseFloat(e.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">MRP</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formValues.sellingPrice === 0 ? "" : formValues.sellingPrice}
                        onFocus={(e) => { if (e.target.value === "0") e.target.value = ""; }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: { ...prev[variant.id], sellingPrice: 0 },
                            }));
                          }
                        }}
                        onChange={(e) =>
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: { ...prev[variant.id], sellingPrice: parseFloat(e.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formValues.discount === 0 ? "" : formValues.discount}
                        onFocus={(e) => { if (e.target.value === "0") e.target.value = ""; }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: { ...prev[variant.id], discount: 0 },
                            }));
                          }
                        }}
                        onChange={(e) =>
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: { ...prev[variant.id], discount: parseFloat(e.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <div className="relative inline-block group">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addTempStock(variant.id)}
                        className="flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-info"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                        Add Price Set
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-20 w-56 p-2 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-normal">
                        Add multiple price sets for different purchase costs or MRPs. Unsaved rows can be removed. All changes are saved when you click Save Draft or Publish.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 modal-sticky-footer">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4" /> Back</Button>

              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                loading={submitting}
                disabled={hasMissingPriceSet()}
                title={hasMissingPriceSet() ? "All variants must have at least one price set" : ""}
              >
                Save Draft
              </Button>
              <Button
                variant="success"
                onClick={handlePublish}
                loading={submitting}
                disabled={hasMissingPriceSet()}
                title={hasMissingPriceSet() ? "All variants must have at least one price set" : ""}
              >
                Save & Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddAttribute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex mb-6">
              <button
                className={`cursor-pointer flex-1 pb-2 text-center ${attributeTab === "addValue" ? "border-b-2 border-blue-500 text-blue-600" : "border-b-2 text-gray-500"} text-sm`}
                onClick={() => setAttributeTab("addValue")}
              >
                Add Value to Existing
              </button>
              <button
                className={`cursor-pointer flex-1 pb-2 text-center ${attributeTab === "newAttr" ? "border-b-2 border-blue-500 text-blue-600" : "border-b-2 text-gray-500"} text-sm`}
                onClick={() => setAttributeTab("newAttr")}
              >
                Add New Attribute
              </button>
            </div>
            {attributeTab === "addValue" && (
              <div className="flex flex-col gap-4">
                <Dropdown
                  value={existingAttrName}
                  options={availableAttributes.map((a) => ({ label: a.name, value: a.name }))}
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
                  <Button variant="outline" onClick={() => setShowAddAttribute(false)}>Cancel</Button>
                  <Button onClick={handleAddValueToExisting}>Add Value</Button>
                </div>
              </div>
            )}
            {attributeTab === "newAttr" && (
              <div className="flex flex-col gap-4">
                <InputField label="Attribute Name" value={newAttributeName} onChange={(e) => setNewAttributeName(e.target.value)} />
                <InputField label="Values (comma separated)" value={newAttributeValues} onChange={(e) => setNewAttributeValues(e.target.value)} />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setShowAddAttribute(false)}>Cancel</Button>
                  <Button onClick={handleAddNewAttribute}>Add Attribute</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProductWizard;