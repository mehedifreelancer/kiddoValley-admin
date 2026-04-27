// modules/master-data/product/Product.tsx
import React, { useState, FormEvent, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Editor } from "primereact/editor";
import { toast } from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  GripVertical,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Barcode from "react-barcode";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  generateBarcode,
  getCategoriesForDropdown,
} from "./product.service";
import Toolbar from "../../components/ui/Toolbar";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import InputField from "../../components/ui/InputField";
import { getCategories } from "../master-data/category/category.service";

const ItemType = "IMAGE";

interface DraggableImageProps {
  image: ProductImage;
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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor) => {
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
          alt="Product"
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

export const Product = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [barcodeValue, setBarcodeValue] = useState<string>("");
  const [barcodeTitle, setBarcodeTitle] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  
  // Image management
  const [imageList, setImageList] = useState<ProductImage[]>([]);      // For preview (both existing URLs and blob URLs)
  const [imageFiles, setImageFiles] = useState<File[]>([]);            // Actual new files to upload
  const [existingImageUrls, setExistingImageUrls] = useState<ProductImage[]>([]); // Existing image URLs from DB
  const [uploading, setUploading] = useState(false);

  const [forceOrderPriority, setForceOrderPriority] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [productDetails, setProductDetails] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalFilter);
      setPage(1);
      setFirst(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, rows, debouncedSearch]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories(1, 1000);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts(page, rows, debouncedSearch);
      if (response.success) {
        setProducts(response.data);
        setTotalRecords(response.pagination.total);
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.first / event.rows + 1);
  };

  const regenerateBarcode = () => {
    setBarcodeValue(generateBarcode());
  };

  useEffect(() => {
    if (modalFor === "create") {
      regenerateBarcode();
      setImageList([]);
      setImageFiles([]);
      setExistingImageUrls([]);
      setSelectedCategory(null);
      setForceOrderPriority(0);
      setDiscountPercent(0);
      setProductName("");
      setProductDetails("");
      setBarcodeTitle("");
      setFormErrors({});
    } else if (modalFor === "edit" && selectedProduct) {
      setBarcodeValue(selectedProduct.barcode);
      setBarcodeTitle(selectedProduct.name);
      const existing = selectedProduct.images || [];
      setExistingImageUrls(existing);
      setImageList([...existing]);               // Show existing images for preview
      setImageFiles([]);                         // No new files yet
      setSelectedCategory(selectedProduct.category || null);
      setForceOrderPriority(selectedProduct.forceOrderPriority || 0);
      setDiscountPercent(selectedProduct.discountPercent || 0);
      setProductName(selectedProduct.name);
      setProductDetails(selectedProduct.description || "");
      setFormErrors({});
    }
  }, [modalFor, selectedProduct]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const mockUrl = URL.createObjectURL(file);
      setImageList((prev) => [...prev, { imgUrl: mockUrl }]); // preview
      setImageFiles((prev) => [...prev, file]);               // actual file
    }
  };

  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    // Move preview list
    setImageList((prev) => {
      const newImages = [...prev];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      return newImages;
    });
    // Move actual files list (keep same order)
    setImageFiles((prev) => {
      const newFiles = [...prev];
      const draggedFile = newFiles[dragIndex];
      newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, draggedFile);
      return newFiles;
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = () => {
    setFormErrors({});
    setSelectedCategory(null);
    setBarcodeValue(generateBarcode());
    setBarcodeTitle("");
    setImageList([]);
    setImageFiles([]);
    setExistingImageUrls([]);
    setForceOrderPriority(0);
    setDiscountPercent(0);
    setProductName("");
    setProductDetails("");
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedProduct(null);
    setModalFor("create");
  };

  const openEditModal = (product: ProductItem) => {
    resetForm();
    setSelectedProduct(product);
    setModalFor("edit");
  };

  const openDeleteModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setModalFor("delete");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!barcodeValue) errors.barcode = "Barcode is required";
    if (!barcodeTitle) errors.barcodeTitle = "Barcode title is required";
    if (!productName?.trim()) errors.name = "Product name is required";
    if (!selectedCategory) errors.categoryId = "Category is required";
    if (imageList.length === 0) errors.images = "At least one product image is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("barcode", barcodeValue);
      formData.append("barcodeTitle", barcodeTitle);
      formData.append("name", productName);
      formData.append("categoryId", selectedCategory!.id.toString());
      formData.append("buyingPrice", (event.currentTarget.elements.namedItem("buyingPrice") as HTMLInputElement)?.value || "0");
      formData.append("sellingPrice", (event.currentTarget.elements.namedItem("sellingPrice") as HTMLInputElement)?.value || "0");
      
      const videoUrl = (event.currentTarget.elements.namedItem("videoUrl") as HTMLInputElement)?.value;
      if (videoUrl) formData.append("videoUrl", videoUrl);
      if (productDetails) formData.append("description", productDetails);
      if (forceOrderPriority) formData.append("forceOrderPriority", forceOrderPriority.toString());
      if (discountPercent) formData.append("discountPercent", discountPercent.toString());

      // Append all image files (new files only)
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await createProduct(formData);
      toast.success("Product created successfully");
      setModalFor(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm() || !selectedProduct) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("barcode", barcodeValue);
      formData.append("barcodeTitle", barcodeTitle);
      formData.append("name", productName);
      formData.append("categoryId", selectedCategory!.id.toString());
      formData.append("buyingPrice", (event.currentTarget.elements.namedItem("buyingPrice") as HTMLInputElement)?.value || "0");
      formData.append("sellingPrice", (event.currentTarget.elements.namedItem("sellingPrice") as HTMLInputElement)?.value || "0");

      const videoUrl = (event.currentTarget.elements.namedItem("videoUrl") as HTMLInputElement)?.value;
      if (videoUrl) formData.append("videoUrl", videoUrl);
      if (productDetails) formData.append("description", productDetails);
      if (forceOrderPriority) formData.append("forceOrderPriority", forceOrderPriority.toString());
      if (discountPercent) formData.append("discountPercent", discountPercent.toString());

      // Send existing image URLs as JSON (preserves order and existing images)
      // Important: Use the current imageList order (which includes existing images in the dragged order)
      const currentOrderedUrls = imageList
        .filter(img => !img.imgUrl.startsWith("blob:"))
        .map(img => ({ imgUrl: img.imgUrl }));
      formData.append("existingImages", JSON.stringify(currentOrderedUrls));

      // Append new image files
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await updateProduct(selectedProduct.id, formData);
      toast.success("Product updated successfully");
      setModalFor(null);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setSubmitting(true);
      await deleteProduct(selectedProduct.id);
      toast.success("Product deleted successfully");
      setModalFor(null);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedProduct(null);
    resetForm();
  };

  // DataTable column templates (same as before, keep styling)
  const imageBody = (rowData: ProductItem) => {
    if (!rowData.images?.length) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex -space-x-2">
        {rowData.images.slice(0, 3).map((img, idx) => (
          <img
            key={idx}
            src={img.imgUrl}
            alt=""
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover"
          />
        ))}
        {rowData.images.length > 3 && (
          <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
            +{rowData.images.length - 3}
          </span>
        )}
      </div>
    );
  };

  const categoryBody = (rowData: ProductItem) => (
    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
      {rowData.category?.name}
    </span>
  );

  const priceBody = (rowData: ProductItem) => (
    <div>
      <div className="text-gray-700 dark:text-gray-300">Buy: ${rowData.buyingPrice}</div>
      <div className="text-green-600 dark:text-green-400">Sell: ${rowData.sellingPrice}</div>
    </div>
  );

  const discountBody = (rowData: ProductItem) => {
    if (!rowData.hasDiscount) return <span className="text-gray-400">—</span>;
    return (
      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
        {rowData.discountPercent}% OFF
      </span>
    );
  };

  const forceOrderBody = (rowData: ProductItem) => {
    if (!rowData.isForceOrder) return <span className="text-gray-400">No</span>;
    return (
      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium">
        Priority: {rowData.forceOrderPriority}
      </span>
    );
  };

  const actionsBody = (rowData: ProductItem) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(rowData)}
        className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(rowData)}
        className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <Toolbar title="Products">
          <div className="flex gap-2">
            <DataTableSearch
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search products..."
              className="w-[220px]"
            />
            <Button
              onClick={openCreateModal}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
        </Toolbar>

        <div className="table-container">
          <DataTable
            value={products}
            paginator
            lazy
            first={first}
            rows={rows}
            totalRecords={totalRecords}
            onPage={onPageChange}
            loading={loading}
            emptyMessage="No products found"
            stripedRows
            rowClassName={() => "table-row"}
          >
            <Column field="id" header="ID" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column field="barcode" header="Barcode" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column field="name" header="Product Name" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Images" body={imageBody} headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Category" body={categoryBody} headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Price" body={priceBody} headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Discount" body={discountBody} headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Force Order" body={forceOrderBody} headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Actions" body={actionsBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "120px" }} />
          </DataTable>
        </div>

        {/* Create Modal */}
        {modalFor === "create" && (
          <Modal isOpen={true} onClose={closeModal} title="Create New Product" size="lg">
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Product Name *"
                  name="name"
                  type="text"
                  placeholder="Enter product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  error={formErrors.name}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category *</label>
                  <Dropdown
                    value={selectedCategory?.id}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.value);
                      setSelectedCategory(cat || null);
                    }}
                    options={categories}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select category"
                    className="w-full"
                    appendTo="self"
                  />
                  {formErrors.categoryId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.categoryId}</p>}
                </div>
                <InputField
                  label="Barcode Title *"
                  name="barcodeTitle"
                  type="text"
                  placeholder="Enter barcode title"
                  value={barcodeTitle}
                  onChange={(e) => setBarcodeTitle(e.target.value)}
                  error={formErrors.barcodeTitle}
                  required
                />
                <InputField label="Buying Price *" name="buyingPrice" type="number" placeholder="0.00" error={formErrors.buyingPrice} required />
                <InputField label="Selling Price *" name="sellingPrice" type="number" placeholder="0.00" error={formErrors.sellingPrice} required />
                <InputField
                  label="Discount Percent"
                  name="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  placeholder="0 (0 = no discount)"
                  helperText="Set value > 0 to apply discount"
                />
                <InputField
                  label="Force Order Priority"
                  name="forceOrderPriority"
                  type="number"
                  value={forceOrderPriority}
                  onChange={(e) => setForceOrderPriority(Number(e.target.value))}
                  placeholder="0 (0 = disabled)"
                  helperText="Set value > 0 to enable force order"
                />
              </div>
              <InputField label="Video URL" name="videoUrl" type="text" placeholder="https://example.com/video.mp4" />

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Details</label>
                <Editor
                  value={productDetails}
                  onTextChange={(e) => setProductDetails(e.htmlValue || "")}
                  style={{ height: "320px" }}
                  className="border border-gray-300 dark:border-gray-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Images *</label>
                <div className="mb-4">
                  <label className="inline-flex items-center justify-center w-full gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Images</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  {uploading && <span className="ml-3 text-sm text-gray-500 animate-pulse">Uploading...</span>}
                  {formErrors.images && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.images}</p>}
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  {imageList.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {imageList.map((image, index) => (
                        <DraggableImage
                          key={index}
                          image={image}
                          index={index}
                          moveImage={moveImage}
                          removeImage={removeImage}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[148px] text-gray-400 dark:text-gray-500">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm">No images uploaded. Click "Upload Images" to add product photos.</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Barcode</label>
                <div className="relative flex flex-col items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-center mb-2">
                      <p className="text-sm font-medium text-gray-800">{productName || "Product Name"}</p>
                    </div>
                    <Barcode value={barcodeValue} format="CODE128" width={2} height={60} fontSize={12} margin={0} displayValue={false} />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateBarcode}
                    className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                </div>
                <input type="hidden" name="barcode" value={barcodeValue} />
                {formErrors.barcode && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.barcode}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button type="button" onClick={closeModal} variant="outline" disabled={submitting}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting}>Create Product</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Modal */}
        {modalFor === "edit" && selectedProduct && (
          <Modal isOpen={true} onClose={closeModal} title="Edit Product" size="lg">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Product Name *"
                  name="name"
                  type="text"
                  defaultValue={selectedProduct.name}
                  onChange={(e) => setProductName(e.target.value)}
                  error={formErrors.name}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category *</label>
                  <Dropdown
                    value={selectedCategory?.id}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.value);
                      setSelectedCategory(cat || null);
                    }}
                    options={categories}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select category"
                    className="w-full"
                    appendTo="self"
                  />
                  {formErrors.categoryId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.categoryId}</p>}
                </div>
                <InputField
                  label="Barcode Title *"
                  name="barcodeTitle"
                  type="text"
                  defaultValue={selectedProduct.name}
                  onChange={(e) => setBarcodeTitle(e.target.value)}
                  error={formErrors.barcodeTitle}
                  required
                />
                <InputField label="Buying Price *" name="buyingPrice" type="number" defaultValue={selectedProduct.buyingPrice} error={formErrors.buyingPrice} required />
                <InputField label="Selling Price *" name="sellingPrice" type="number" defaultValue={selectedProduct.sellingPrice} error={formErrors.sellingPrice} required />
                <InputField
                  label="Discount Percent"
                  name="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  placeholder="0 (0 = no discount)"
                  helperText="Set value > 0 to apply discount"
                />
                <InputField
                  label="Force Order Priority"
                  name="forceOrderPriority"
                  type="number"
                  value={forceOrderPriority}
                  onChange={(e) => setForceOrderPriority(Number(e.target.value))}
                  placeholder="0 (0 = disabled)"
                  helperText="Set value > 0 to enable force order"
                />
              </div>
              <InputField label="Video URL" name="videoUrl" type="text" defaultValue={selectedProduct.videoUrl || ""} placeholder="https://example.com/video.mp4" />

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Details</label>
                <Editor
                  value={productDetails}
                  onTextChange={(e) => setProductDetails(e.htmlValue || "")}
                  style={{ height: "320px" }}
                  className="border border-gray-300 dark:border-gray-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Images *</label>
                <div className="mb-4">
                  <label className="inline-flex items-center justify-center w-full gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload More Images</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  {uploading && <span className="ml-3 text-sm text-gray-500 animate-pulse">Uploading...</span>}
                  {formErrors.images && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.images}</p>}
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  {imageList.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {imageList.map((image, index) => (
                        <DraggableImage
                          key={index}
                          image={image}
                          index={index}
                          moveImage={moveImage}
                          removeImage={removeImage}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[148px] text-gray-400 dark:text-gray-500">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm">No images uploaded. Click "Upload More Images" to add product photos.</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Barcode</label>
                <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-center mb-2">
                      <p className="text-sm font-medium text-gray-800">{selectedProduct.name}</p>
                    </div>
                    <Barcode value={barcodeValue} format="CODE128" width={2} height={60} fontSize={12} margin={0} displayValue={true} />
                  </div>
                </div>
                <input type="hidden" name="barcode" value={barcodeValue} />
                {formErrors.barcode && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.barcode}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button type="button" onClick={closeModal} variant="outline" disabled={submitting}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting}>Save Changes</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {modalFor === "delete" && (
          <Modal isOpen={true} onClose={closeModal} title="Delete Product" size="sm">
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the product{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">"{selectedProduct?.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button onClick={closeModal} variant="outline" disabled={submitting}>Cancel</Button>
                <Button onClick={handleDelete} variant="danger" loading={submitting}>Delete Product</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DndProvider>
  );
};

export default Product;