"use client";

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
import React, { useEffect, useMemo, useRef, useState } from "react";
import Barcode from "react-barcode";
import { toast } from "react-hot-toast";
import api from "../../apiConfig";
import AttributePrioritySelector from "../../components/AttributePrioritySelector";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import { getCategories } from "../master-data/category/category.service";
import {
  getProductById,
  updateProduct,
  updateStockDiscount,
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
  <div className="z-1 sticky top-[-5px] flex items-center justify-between bg-white dark:bg-gray-800 py-2 shadow-sm mb-5">
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
    <div
      className={`flex-1 border-t-2 ${
        current > 1
          ? "border-green-500"
          : "border-gray-300 dark:border-gray-600"
      }`}
    />
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
        {current === 2 ? (
          2
        ) : current > 2 ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          2
        )}
      </div>
      <div className="text-sm mt-1">Variants</div>
    </div>
    <div
      className={`flex-1 border-t-2 ${
        current > 2
          ? "border-green-500"
          : "border-gray-300 dark:border-gray-600"
      }`}
    />
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
      <div className="text-sm mt-1">Priority</div>
    </div>
    <div
      className={`flex-1 border-t-2 ${
        current > 3
          ? "border-green-500"
          : "border-gray-300 dark:border-gray-600"
      }`}
    />
    <div className="flex-1 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          current === 4
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600"
        }`}
      >
        4
      </div>
      <div className="text-sm mt-1">Pricing</div>
    </div>
  </div>
);

interface EditProductWizardProps {
  productId: number;
  onClose: () => void;
  onProductSaved: () => void;
}

export const EditProductWizard: React.FC<EditProductWizardProps> = ({
  productId,
  onClose,
  onProductSaved,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 1 state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [forceOrderPriority, setForceOrderPriority] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [productWeight, setProductWeight] = useState<number>(0);

  // Step 2: variants
  const [variants, setVariants] = useState<any[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
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
  const [variantIsImported, setVariantIsImported] = useState(false);
  const [variantCountry, setVariantCountry] = useState("");
  const [variantBarcode, setVariantBarcode] = useState("");
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [variantImages, setVariantImages] = useState<any[]>([]);
  const [variantImageFiles, setVariantImageFiles] = useState<File[]>([]);

  // Step 3: Attribute Priority
  const [productAttributePriority, setProductAttributePriority] = useState<
    string[]
  >([]);
  const usedAttributeNames = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === "object") {
        Object.keys(v.attributes).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [variants]);

  // Step 4: price sets
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

  // Edit state – Discount edit using uncontrolled input
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editVariantId, setEditVariantId] = useState<number | null>(null);
  const discountInputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on edit mode
  useEffect(() => {
    if (editingStockId !== null) {
      const t = setTimeout(() => {
        discountInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [editingStockId]);

  // ===== Stock helpers =====
  const isBuyingPriceUnique = (
    variantId: number,
    buyingPrice: number,
    excludeTempId?: string,
  ): boolean => {
    const variant = variants.find((v) => v.id === variantId);
    const existingPrices =
      variant?.stocks?.map((s: any) => s.buyingOrMakingPrice) || [];
    const pendingPrices = (pendingStocks[variantId] || [])
      .filter((p) => p.id !== excludeTempId)
      .map((p) => p.buyingPrice);
    const allPrices = [...existingPrices, ...pendingPrices];
    return !allPrices.includes(buyingPrice);
  };

  const addTempStock = (variantId: number) => {
    const formData = newPriceSet[variantId];
    if (!formData || formData.buyingPrice <= 0 || formData.sellingPrice <= 0) {
      toast.error("Please fill buying price and MRP (both must be > 0)");
      return;
    }
    if (!isBuyingPriceUnique(variantId, formData.buyingPrice)) {
      toast.error(
        "This buying price already exists for this variant. Please enter a different buying price.",
      );
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
        p.id === tempId ? { ...p, isEditing: true } : p,
      ),
    }));
  };

  const saveTempStock = (variantId: number, tempId: string) => {
    const tempRow = pendingStocks[variantId]?.find((p) => p.id === tempId);
    if (!tempRow) return;
    if (!isBuyingPriceUnique(variantId, tempRow.buyingPrice, tempId)) {
      toast.error(
        "This buying price already exists for this variant. Please enter a different buying price.",
      );
      return;
    }
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).map((p) =>
        p.id === tempId ? { ...p, isEditing: false } : p,
      ),
    }));
  };

  const updateTempStock = (
    variantId: number,
    tempId: string,
    field: "buyingPrice" | "sellingPrice" | "discount",
    value: number,
  ) => {
    setPendingStocks((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || []).map((p) =>
        p.id === tempId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const saveAllPendingStocks = async () => {
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

  // Load categories and attributes
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

  // Load product and variants
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        const product = await getProductById(productId);
        setProductName(product.name);
        setForceOrderPriority(product.forceOrderPriority);
        setVideoUrl(product.videoUrl || "");
        setProductDetails(product.description || "");
        setSelectedCategory(
          categories.find((c) => c.id === product.categoryId) || null,
        );
        setThumbnail(product.thumbnail || null);
        setThumbnailFile(null);
        setProductWeight(product.weight || 0);

        if (
          product.attributePriority &&
          Array.isArray(product.attributePriority)
        ) {
          setProductAttributePriority(product.attributePriority);
        }

        const res = await api.get(`/variant/product/${productId}`);
        const variantData = (res.data.data || []).map((v: any) => ({
          ...v,
          images: v.images || [],
        }));
        setVariants(variantData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product data");
      } finally {
        setLoading(false);
      }
    };
    if (categories.length > 0) {
      loadProductData();
    }
  }, [productId, categories]);

  const fetchVariants = async () => {
    if (!productId) return;
    try {
      const res = await api.get(`/variant/product/${productId}`);
      const variantData = (res.data.data || []).map((v: any) => ({
        ...v,
        images: v.images || [],
      }));
      setVariants(variantData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load variants");
    }
  };

  // Step 1: Update product
  const handleStep1Next = async () => {
    if (submitting) return;

    const errors: any = {};
    if (!productName.trim()) errors.name = "Product name required";
    if (!selectedCategory) errors.category = "Category required";
    if (!thumbnail && !thumbnailFile)
      errors.thumbnail = "Thumbnail image is required";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("categoryId", selectedCategory.id);
      formData.append("forceOrderPriority", String(forceOrderPriority));
      formData.append("weight", String(productWeight));
      formData.append("videoUrl", videoUrl);
      formData.append("description", productDetails);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (thumbnail) {
        formData.append("existingThumbnail", thumbnail);
      }
      await updateProduct(productId, formData);
      toast.success("Product basic info updated");
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation
  const goToStep3 = () => {
    if (variants.length === 0) {
      toast.error("Please add at least one variant before setting priority.");
      return;
    }
    setStep(3);
  };

  const goToStep4 = () => {
    setStep(4);
  };

  // Variant management
  const resetVariantForm = () => {
    setCurrentAttributes({});
    setVariantImages([]);
    setVariantImageFiles([]);
    setVariantIsImported(false);
    setVariantCountry("");
    setVariantBarcode("");
    setEditingVariantId(null);
    setIsEditingMode(false);
  };

  const openAddVariantForm = () => {
    setEditingVariantId(null);
    setCurrentAttributes({});
    setVariantIsImported(false);
    setVariantCountry("");
    setVariantBarcode("");
    setVariantImages([]);
    setVariantImageFiles([]);
    setIsEditingMode(false);
    setShowVariantForm(true);
  };

  const openEditVariantForm = (variant: any) => {
    setEditingVariantId(variant.id);
    setCurrentAttributes(variant.attributes || {});
    setVariantIsImported(variant.isImported || false);
    setVariantCountry(variant.countryOfOrigin || "");
    setVariantBarcode(variant.barcode || "");
    setVariantImages(variant.images || []);
    setVariantImageFiles([]);
    setIsEditingMode(true);
    setShowVariantForm(true);
  };

  const closeVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariantId(null);
    setIsEditingMode(false);
    setVariantImages([]);
    setVariantImageFiles([]);
  };

  // Delete default variant (empty attributes) if exists
  const deleteDefaultVariantIfExists = async () => {
    const defaultVariant = variants.find(
      (v) => Object.keys(v.attributes || {}).length === 0,
    );
    if (!defaultVariant) return;
    try {
      await api.delete(`/variant/${defaultVariant.id}`);
    } catch (err: any) {
      // ignore silently
    }
  };

  const saveVariant = async () => {
    if (submitting) return;
    if (!isEditingMode && Object.keys(currentAttributes).length === 0) {
      toast.error(
        "Please add at least one attribute-value pair for new variant",
      );
      return;
    }

    const formData = new FormData();
    formData.append("attributes", JSON.stringify(currentAttributes));
    formData.append("isImported", String(variantIsImported));
    if (variantCountry) formData.append("countryOfOrigin", variantCountry);
    if (variantBarcode) formData.append("barcode", variantBarcode);
    const existingImgUrls = variantImages
      .filter((img) => !img.imgUrl.startsWith("blob:"))
      .map((img) => ({ imgUrl: img.imgUrl }));
    formData.append("existingImages", JSON.stringify(existingImgUrls));
    variantImageFiles.forEach((file) => formData.append("images", file));

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
    const variant = variants.find((v) => v.id === id);
    const hasStockWithQuantity = variant?.stocks?.some(
      (stock: any) => stock.currentQty > 0,
    );
    if (hasStockWithQuantity) {
      toast.error(
        "Cannot delete variant because it has stock with positive quantity. Please reduce stock to zero first.",
      );
      return;
    }
    if (variants.length === 1) {
      toast.error(
        "Product must have at least one variant. Cannot delete the last variant.",
      );
      return;
    }
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      await api.delete(`/variant/${id}`);
      toast.success("Variant deleted");
      await fetchVariants();
      if (editingVariantId === id) closeVariantForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete variant");
    }
  };

  const handleVariantImageUploadList = async (
    variantId: number,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const cleanImages = (variant.images || []).filter(
      (img: any) => !img.imgUrl.startsWith("blob:"),
    );
    const formData = new FormData();
    formData.append("existingImages", JSON.stringify(cleanImages));
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

  const removeVariantImageList = async (
    variantId: number,
    imageUrl: string,
  ) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const remainingImages = (variant.images || []).filter(
      (img: any) => img.imgUrl !== imageUrl && !img.imgUrl.startsWith("blob:"),
    );
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
                onClick={() => window.open(img.imgUrl, "_blank")}
                title="Click to view full image"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariantImageList(rowData.id, img.imgUrl);
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
            onChange={(e) =>
              handleVariantImageUploadList(rowData.id, e.target.files)
            }
          />
        </label>
      </div>
    );
  };

  // Thumbnail handlers
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(URL.createObjectURL(file));
      setThumbnailFile(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailFile(null);
  };

  // Helpers
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

  const hasMissingPriceSet = () => {
    for (const variant of variants) {
      const existingCount = variant.stocks?.length || 0;
      const pendingCount = pendingStocks[variant.id]?.length || 0;
      if (existingCount + pendingCount === 0) return true;
    }
    return false;
  };

  // Edit functions – uncontrolled discount input
  const startEditStock = (row: any, variantId: number) => {
    setEditingStockId(row.id);
    setEditVariantId(variantId);
    // set initial value in ref after render
    setTimeout(() => {
      if (discountInputRef.current) {
        const initialVal = row.discountPercent ?? row.discount ?? 0;
        discountInputRef.current.value = String(initialVal);
        discountInputRef.current.focus();
        discountInputRef.current.select();
      }
    }, 0);
  };

  const cancelEditStock = () => {
    setEditingStockId(null);
    setEditVariantId(null);
  };

  const saveEditStock = async () => {
    if (editingStockId === null || editVariantId === null) return;
    const newDiscount = parseFloat(discountInputRef.current?.value || "0");
    if (isNaN(newDiscount) || newDiscount < 0) {
      toast.error("Please enter a valid discount (0 or greater)");
      return;
    }
    try {
      setSubmitting(true);
      // Use service function (or direct api call)
      await updateStockDiscount(editingStockId, newDiscount);
      toast.success("Discount updated successfully");
      await fetchVariants();
      cancelEditStock();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("name", productName);
      formData.append("categoryId", selectedCategory?.id || "");
      formData.append("forceOrderPriority", String(forceOrderPriority));
      formData.append("weight", String(productWeight));
      if (videoUrl) formData.append("videoUrl", videoUrl);
      if (productDetails) formData.append("description", productDetails);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else if (thumbnail && !thumbnail.startsWith("blob:")) {
        formData.append("existingThumbnail", thumbnail);
      }
      formData.append(
        "attributePriority",
        JSON.stringify(productAttributePriority),
      );
      await updateProduct(productId, formData);

      await saveAllPendingStocks();

      toast.success("Product updated successfully!");
      onProductSaved();
      onClose();
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriceSetCount = (variant: any) => {
    const existing = variant.stocks?.length || 0;
    const pending = pendingStocks[variant.id]?.length || 0;
    return existing + pending;
  };

  const isDefaultVariant =
    isEditingMode &&
    editingVariantId &&
    Object.keys(currentAttributes).length === 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">Loading product data...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto rounded-md relative">
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
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <Dropdown
                value={selectedCategory?.id}
                options={categories}
                onChange={(e) =>
                  setSelectedCategory(categories.find((c) => c.id === e.value))
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
            <InputField
              label="Force Order Priority (0 = disabled)"
              type="number"
              value={forceOrderPriority}
              onChange={(e) => setForceOrderPriority(Number(e.target.value))}
            />
            <InputField
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="0"
              value={productWeight !== undefined ? String(productWeight) : ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setProductWeight(isNaN(val) ? 0 : val);
              }}
            />
          </div>
          <InputField
            label="Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <Editor
              value={productDetails}
              onTextChange={(e) => setProductDetails(e.htmlValue as any)}
              style={{ height: "200px" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Thumbnail Image *
            </label>
            <div className="relative w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden">
              {thumbnail ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={thumbnail}
                    alt="Thumbnail"
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    onClick={() => window.open(thumbnail, "_blank")}
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
                  onClick={() =>
                    document.getElementById("thumbnail-upload-edit")?.click()
                  }
                >
                  <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Only one image (thumbnail)
                  </p>
                </div>
              )}
              <input
                id="thumbnail-upload-edit"
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>
            {formErrors.thumbnail && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.thumbnail}
              </p>
            )}
          </div>
          <div className="modal-sticky-footer">
            <Button onClick={handleStep1Next} loading={submitting}>
              Save & Next →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="z-1 sticky top-[-1px] flex justify-between items-center bg-gray-200 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              💡 Manage variants – add, edit, or delete.
            </span>
            <div className="flex gap-2">
              {showVariantForm && (
                <Button variant="outline" onClick={closeVariantForm}>
                  Cancel
                </Button>
              )}
              {showVariantForm ? (
                <Button
                  variant="primary"
                  onClick={saveVariant}
                  loading={submitting}
                >
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
                {isEditingMode
                  ? isDefaultVariant
                    ? "Edit"
                    : "Edit Variant"
                  : "Add New Variant"}
              </h3>
              {(!isDefaultVariant || !isEditingMode) && (
                <>
                  <div className="p-4 rounded-md">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1">
                        <div className="flex gap-1">
                          <label className="block text-xs font-medium">
                            Attribute Name
                          </label>
                          <button
                            onClick={() => setShowAddAttribute(true)}
                            className="flex gap-1 btn-primary text-[8px]! px-1 py-0.5 rounded items-center cursor-pointer"
                          >
                            <Plus className="w-2 h-2" />{" "}
                            <span className="mt-[.5px]">New</span>
                          </button>
                        </div>
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
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Current Attributes
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                      {Object.entries(currentAttributes).length === 0 ? (
                        <span className="text-gray-400 text-sm">
                          No attributes selected
                        </span>
                      ) : (
                        Object.entries(currentAttributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-200 dark:bg-blue-800 rounded-full text-sm"
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
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Barcode (optional)
                </label>
                <div className="flex gap-2">
                  <InputField
                    value={variantBarcode}
                    onChange={(e) => setVariantBarcode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onDoubleClick={() => setVariantBarcode(generateEAN13())}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-600 cursosr-pointer!"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                {(variantBarcode || (isEditingMode && editingVariantId)) && (
                  <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Barcode Number:
                        </span>
                        <span className="text-gray-800 dark:text-gray-200 font-mono">
                          {variantBarcode || "—"}
                        </span>
                      </div>
                      {variantBarcode && (
                        <div className="flex justify-center pt-2">
                          <div className="bg-white p-2 rounded shadow-sm">
                            <Barcode
                              value={variantBarcode}
                              format="CODE128"
                              width={1.5}
                              height={40}
                              fontSize={10}
                              margin={0}
                              displayValue={true}
                            />
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
            </div>
          )}

          <DataTable
            value={variants}
            dataKey="id"
            stripedRows
            emptyMessage="No variants found"
            rowClassName={() => "table-row"}
          >
            <Column
              header="Name"
              body={() => productName}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="sku"
              header="SKU"
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="barcode"
              header="Barcode"
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Attributes"
              body={(row) =>
                Object.entries(row.attributes || {})
                  .map(([k, v]) => `${k}:${v}`)
                  .join(", ") || "—"
              }
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Imported"
              body={(row) => (row.isImported ? "Yes" : "No")}
              sortable
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Images"
              body={variantImagesBody}
              style={{ width: "200px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Actions"
              body={(row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditVariantForm(row)}
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
              style={{ width: "120px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>

          <div className="modal-sticky-footer gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button variant="primary" onClick={goToStep3}>
              Priority <ChevronRight className="w-4 h-4 mt-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <h4 className="font-medium text-lg mb-2">
              Attribute Priority (Order of display)
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Drag to reorder the attributes. The first attribute will be the
              primary filter on product cards. If no priority is set, category
              default will be used.
            </p>
            <AttributePrioritySelector
              value={productAttributePriority}
              onChange={setProductAttributePriority}
              availableAttributes={usedAttributeNames}
              disabled={submitting}
            />
          </div>

          <div className="modal-sticky-footer gap-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button variant="primary" onClick={goToStep4}>
              Pricing <ChevronRight className="w-4 h-4 mt-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          {variants.map((variant) => {
            const existingStocks = variant.stocks || [];
            const tempStocks = pendingStocks[variant.id] || [];
            const allRows = [
              ...existingStocks.map((s) => ({
                ...s,
                _isTemp: false,
                id: s.id,
              })),
              ...tempStocks.map((t) => ({ ...t, _isTemp: true })),
            ];
            const formValues = newPriceSet[variant.id] || {
              buyingPrice: 0,
              sellingPrice: 0,
              discount: 0,
            };
            const hasPriceSets = getPriceSetCount(variant) > 0;

            return (
              <div
                key={variant.id}
                className="border rounded-md p-5 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="mb-3">
                  <h4 className="font-medium text-base">{productName}</h4>
                  <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                  {variant.barcode && (
                    <p className="text-xs text-gray-500">
                      Barcode: {variant.barcode}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Weight: {productWeight} kg
                  </p>
                </div>

                {hasPriceSets ? (
                  <DataTable
                    value={allRows}
                    dataKey="id"
                    key={editingStockId || "default"}
                    stripedRows
                    emptyMessage="No price sets added yet"
                    rowClassName={() => "table-row"}
                    className="mb-4"
                  >
                    <Column
                      header="Buying Price"
                      body={(row) => (
                        <span className="text-xs">
                          {row._isTemp
                            ? row.buyingPrice
                            : row.buyingOrMakingPrice || row.buyingPrice}
                        </span>
                      )}
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                    <Column
                      header="MRP"
                      body={(row) => (
                        <span className="text-xs">{row.sellingPrice}</span>
                      )}
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                    <Column
                      header="Discount %"
                      body={(row) => {
                        const discountValue = row._isTemp
                          ? row.discount
                          : (row.discountPercent ?? row.discount);
                        const isEditing =
                          editingStockId !== null &&
                          editVariantId === variant.id &&
                          row.id === editingStockId &&
                          !row._isTemp;

                        if (isEditing) {
                          return (
                            <input
                              ref={discountInputRef}
                              type="number"
                              min="0"
                              step="any"
                              defaultValue={discountValue}
                              className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Discount %"
                            />
                          );
                        }
                        if (
                          discountValue === 0 ||
                          discountValue === null ||
                          discountValue === undefined
                        ) {
                          return (
                            <div className="flex justify-center">
                              <X className="w-4 h-4 text-red-500" />
                            </div>
                          );
                        }
                        return (
                          <span className="text-xs">{discountValue}%</span>
                        );
                      }}
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1 text-center"
                    />
                    <Column
                      header="Actions"
                      body={(row) => {
                        if (row._isTemp) {
                          return (
                            <div className="flex gap-2">
                              {row.isEditing ? (
                                <button
                                  onClick={() =>
                                    saveTempStock(variant.id, row.id)
                                  }
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Save"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    editTempStock(variant.id, row.id)
                                  }
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  removeTempStock(variant.id, row.id)
                                }
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }
                        const isEditing =
                          editingStockId !== null &&
                          editVariantId === variant.id &&
                          row.id === editingStockId;
                        if (isEditing) {
                          return (
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditStock}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Save"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditStock}
                                className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditStock(row, variant.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit discount"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (row.currentQty > 0) {
                                  console.log(row.currentQty, "+++++");

                                  toast.error(
                                    "Cannot delete price set because it has quantity greater than 0. Please reduce stock to zero first.",
                                  );
                                  return;
                                }
                                if (!confirm("Delete this price set?")) return;
                                try {
                                  setSubmitting(true);
                                  await api.delete(`/stock/${row.id}`);
                                  toast.success("Price set deleted");
                                  await fetchVariants();
                                } catch (err: any) {
                                  toast.error(
                                    err.response?.data?.message ||
                                      "Failed to delete",
                                  );
                                } finally {
                                  setSubmitting(false);
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }}
                      style={{ width: "130px" }}
                      headerClassName="column-header text-xs"
                      bodyClassName="column-body text-xs py-1"
                    />
                  </DataTable>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed rounded-md mb-4">
                    No price sets added yet. Use the form below to add your
                    first price set.
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Buying Price, MRP, Discount form inputs – unchanged */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Buying Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={
                          formValues.buyingPrice === 0
                            ? ""
                            : formValues.buyingPrice
                        }
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                buyingPrice: 0,
                              },
                            }));
                          } else {
                            const num = parseFloat(val);
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                buyingPrice: isNaN(num) ? 0 : num,
                              },
                            }));
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val);
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: {
                              ...prev[variant.id],
                              buyingPrice: isNaN(num) ? 0 : num,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        MRP *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={
                          formValues.sellingPrice === 0
                            ? ""
                            : formValues.sellingPrice
                        }
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                sellingPrice: 0,
                              },
                            }));
                          } else {
                            const num = parseFloat(val);
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                sellingPrice: isNaN(num) ? 0 : num,
                              },
                            }));
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val);
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: {
                              ...prev[variant.id],
                              sellingPrice: isNaN(num) ? 0 : num,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={
                          formValues.discount === 0 ? "" : formValues.discount
                        }
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                discount: 0,
                              },
                            }));
                          } else {
                            const num = parseFloat(val);
                            setNewPriceSet((prev) => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                discount: isNaN(num) ? 0 : num,
                              },
                            }));
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val);
                          setNewPriceSet((prev) => ({
                            ...prev,
                            [variant.id]: {
                              ...prev[variant.id],
                              discount: isNaN(num) ? 0 : num,
                            },
                          }));
                        }}
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
                        Add multiple price sets for different purchase costs or
                        MRPs.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 modal-sticky-footer">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                variant="success"
                onClick={handleSaveAllChanges}
                loading={submitting}
                disabled={hasMissingPriceSet()}
                title={
                  hasMissingPriceSet()
                    ? "All variants must have at least one price set"
                    : ""
                }
              >
                Save All Changes
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
                className={`cursor-pointer flex-1 pb-2 text-center ${
                  attributeTab === "addValue"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "border-b-2 text-gray-500"
                } text-sm`}
                onClick={() => setAttributeTab("addValue")}
              >
                Add Value to Existing
              </button>
              <button
                className={`cursor-pointer flex-1 pb-2 text-center ${
                  attributeTab === "newAttr"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "border-b-2 text-gray-500"
                } text-sm`}
                onClick={() => setAttributeTab("newAttr")}
              >
                Add New Attribute
              </button>
            </div>
            {attributeTab === "addValue" && (
              <div className="flex flex-col gap-4">
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
                  <Button onClick={handleAddValueToExisting}>Add Value</Button>
                </div>
              </div>
            )}
            {attributeTab === "newAttr" && (
              <div className="flex flex-col gap-4">
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

export default EditProductWizard;
