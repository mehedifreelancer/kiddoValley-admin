import React, { useState, useMemo, FormEvent, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Plus, Edit, Trash2, RefreshCw, GripVertical, Upload, X, Image as ImageIcon } from "lucide-react";
import Barcode from "react-barcode";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Product, Category, ImageItem } from "./product.types";
import Toolbar from "../../components/ui/Toolbar";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import InputField from "../../components/ui/InputField";

// Drag & Drop Item Type
const ItemType = "IMAGE";

interface DraggableImageProps {
  image: ImageItem;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (index: number) => void;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ image, index, moveImage, removeImage }) => {
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
        <img src={image.imgUrl} alt="Product" className="w-full h-full object-cover" />
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

// Generate random barcode number
const generateBarcode = (): string => {
  return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
};

// Mock categories for dropdown
const mockCategories: Category[] = [
  { id: 1, name: "Baby Products", slug: "baby-products" },
  { id: 2, name: "Dairy", slug: "dairy" },
  { id: 3, name: "Beverages", slug: "beverages" },
  { id: 4, name: "Snacks", slug: "snacks" },
  { id: 5, name: "Household", slug: "household" },
];

// Mock products data
const mockProducts: Product[] = [
  {
    id: 18,
    barcode: "444444444444",
    name: "Baby Wipes",
    slug: "baby-wipes",
    videoUrl: "https://example.com/video.mp4",
    images: [{ imgUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150" }],
    isForceOrder: true,
    forceOrderPriority: 0,
    categoryId: 1,
    buyingPrice: 200,
    sellingPrice: 250,
    hasDiscount: true,
    discountPercent: 10,
    stockQuantity: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 1, name: "Baby Products", slug: "baby-products" },
  },
  {
    id: 19,
    barcode: "555555555555",
    name: "Milk",
    slug: "milk",
    videoUrl: "",
    images: [],
    isForceOrder: false,
    forceOrderPriority: 0,
    categoryId: 2,
    buyingPrice: 60,
    sellingPrice: 80,
    hasDiscount: false,
    discountPercent: 0,
    stockQuantity: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 2, name: "Dairy", slug: "dairy" },
  },
];

export const Product = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories] = useState<Category[]>(mockCategories);
  const [globalFilter, setGlobalFilter] = useState("");

  // Modal state
  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [barcodeValue, setBarcodeValue] = useState<string>("");
  const [imageList, setImageList] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [forceOrderPriority, setForceOrderPriority] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Form errors state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Generate new barcode on mount or when regenerated
  const regenerateBarcode = () => {
    if (modalFor !== "edit") {
      setBarcodeValue(generateBarcode());
    }
  };

  // Initialize form when opening modal
  useEffect(() => {
    if (modalFor === "create") {
      regenerateBarcode();
      setImageList([]);
      setSelectedCategory(null);
      setForceOrderPriority(0);
      setDiscountPercent(0);
      setFormErrors({});
    } else if (modalFor === "edit" && selectedProduct) {
      setBarcodeValue(selectedProduct.barcode);
      setImageList(selectedProduct.images || []);
      setSelectedCategory(selectedProduct.category || null);
      setForceOrderPriority(selectedProduct.forceOrderPriority || 0);
      setDiscountPercent(selectedProduct.discountPercent || 0);
      setFormErrors({});
    }
  }, [modalFor, selectedProduct]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    // Simulate upload - replace with actual API call
    for (const file of files) {
      const mockUrl = URL.createObjectURL(file);
      setImageList(prev => [...prev, { imgUrl: mockUrl }]);
    }

    setUploading(false);
  };

  // Move image (drag & drop)
  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setImageList((prevImages) => {
      const newImages = [...prevImages];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      return newImages;
    });
  }, []);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImageList(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!globalFilter) return products;

    const searchTerm = globalFilter.toLowerCase();

    return products.filter((item) => {
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.barcode.toLowerCase().includes(searchTerm) ||
        item.category?.name.toLowerCase().includes(searchTerm) ||
        item.id.toString().includes(searchTerm)
      );
    });
  }, [products, globalFilter]);

  // Reset form
  const resetForm = () => {
    setFormErrors({});
    setSelectedCategory(null);
    setBarcodeValue(generateBarcode());
    setImageList([]);
    setForceOrderPriority(0);
    setDiscountPercent(0);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setSelectedProduct(null);
    setModalFor("create");
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    resetForm();
    setSelectedProduct(product);
    setModalFor("edit");
  };

  // Open delete modal
  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setModalFor("delete");
  };

  // Validate form
  const validateForm = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};

    const name = formData.get("name") as string;
    const buyingPrice = formData.get("buyingPrice") as string;
    const sellingPrice = formData.get("sellingPrice") as string;
    const stockQuantity = formData.get("stockQuantity") as string;

    if (!barcodeValue) errors.barcode = "Barcode is required";
    if (!name?.trim()) errors.name = "Product name is required";
    if (!selectedCategory) errors.categoryId = "Category is required";
    if (!buyingPrice) errors.buyingPrice = "Buying price is required";
    if (Number(buyingPrice) <= 0) errors.buyingPrice = "Buying price must be greater than 0";
    if (!sellingPrice) errors.sellingPrice = "Selling price is required";
    if (Number(sellingPrice) <= 0) errors.sellingPrice = "Selling price must be greater than 0";
    if (!stockQuantity) errors.stockQuantity = "Stock quantity is required";
    if (Number(stockQuantity) < 0) errors.stockQuantity = "Stock quantity cannot be negative";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create submit
  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!validateForm(formData)) return;

    const newProduct: Product = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      barcode: barcodeValue,
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, '-'),
      videoUrl: formData.get("videoUrl") as string || "",
      images: imageList,
      isForceOrder: forceOrderPriority > 0,
      forceOrderPriority: forceOrderPriority,
      categoryId: selectedCategory?.id || 0,
      buyingPrice: Number(formData.get("buyingPrice")),
      sellingPrice: Number(formData.get("sellingPrice")),
      hasDiscount: discountPercent > 0,
      discountPercent: discountPercent,
      stockQuantity: Number(formData.get("stockQuantity")),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: selectedCategory!,
    };

    setProducts([...products, newProduct]);
    setModalFor(null);
  };

  // Handle edit submit
  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!validateForm(formData) || !selectedProduct) return;

    const updatedProducts = products.map(p =>
      p.id === selectedProduct.id
        ? {
          ...p,
          barcode: barcodeValue,
          name: formData.get("name") as string,
          slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, '-'),
          videoUrl: formData.get("videoUrl") as string || "",
          images: imageList,
          isForceOrder: forceOrderPriority > 0,
          forceOrderPriority: forceOrderPriority,
          categoryId: selectedCategory?.id || 0,
          buyingPrice: Number(formData.get("buyingPrice")),
          sellingPrice: Number(formData.get("sellingPrice")),
          hasDiscount: discountPercent > 0,
          discountPercent: discountPercent,
          stockQuantity: Number(formData.get("stockQuantity")),
          updatedAt: new Date().toISOString(),
          category: selectedCategory!,
        }
        : p
    );

    setProducts(updatedProducts);
    setModalFor(null);
    setSelectedProduct(null);
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedProduct) return;

    const filteredProducts = products.filter(p => p.id !== selectedProduct.id);
    setProducts(filteredProducts);
    setModalFor(null);
    setSelectedProduct(null);
  };

  // Close modal
  const closeModal = () => {
    setModalFor(null);
    setSelectedProduct(null);
    resetForm();
  };

  // Column Templates
  const imageBody = (rowData: Product) => {
    if (!rowData.images || rowData.images.length === 0) return <span className="text-gray-400">—</span>;
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

  const categoryBody = (rowData: Product) => {
    return (
      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
        {rowData.category?.name}
      </span>
    );
  };

  const priceBody = (rowData: Product) => {
    return (
      <div>
        <div className="text-gray-700 dark:text-gray-300">
          Buy: ${rowData.buyingPrice}
        </div>
        <div className="text-green-600 dark:text-green-400">
          Sell: ${rowData.sellingPrice}
        </div>
      </div>
    );
  };

  const discountBody = (rowData: Product) => {
    if (!rowData.hasDiscount) return <span className="text-gray-400">—</span>;
    return (
      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
        {rowData.discountPercent}% OFF
      </span>
    );
  };

  const stockBody = (rowData: Product) => {
    const stockClass = rowData.stockQuantity <= 10
      ? "text-red-600 dark:text-red-400 font-medium"
      : "text-gray-700 dark:text-gray-300";
    return <span className={stockClass}>{rowData.stockQuantity}</span>;
  };

  const forceOrderBody = (rowData: Product) => {
    if (!rowData.isForceOrder) return <span className="text-gray-400">No</span>;
    return (
      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium">
        Priority: {rowData.forceOrderPriority}
      </span>
    );
  };

  const actionsBody = (rowData: Product) => {
    return (
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
  };

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
            <Button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-xs">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </Toolbar>

        {/* DataTable */}
        <div className="table-container">
          <DataTable
            value={filteredData}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No products found"
            stripedRows
            rowClassName={() => 'table-row'}
          >
            <Column field="id" header="ID" sortable headerClassName="column-header" bodyClassName="column-body" style={{ width: "70px" }} />
            <Column field="barcode" header="Barcode" sortable headerClassName="column-header" bodyClassName="column-body" style={{ width: "120px" }} />
            <Column field="name" header="Product Name" sortable headerClassName="column-header" bodyClassName="column-body" />
            <Column header="Images" body={imageBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "100px" }} />
            <Column header="Category" body={categoryBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "120px" }} />
            <Column header="Price" body={priceBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "100px" }} />
            <Column field="stockQuantity" header="Stock" body={stockBody} sortable headerClassName="column-header" bodyClassName="column-body" style={{ width: "80px" }} />
            <Column header="Discount" body={discountBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "100px" }} />
            <Column header="Force Order" body={forceOrderBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "100px" }} />
            <Column header="Actions" body={actionsBody} headerClassName="column-header" bodyClassName="column-body" style={{ width: "100px" }} />
          </DataTable>
        </div>

        {/* Create Modal */}
        {modalFor === "create" && (
          <Modal isOpen={true} onClose={closeModal} title="Create New Product" size="lg">
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Product Name *" name="name" type="text" placeholder="Enter product name" error={formErrors.name} required />

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <Dropdown
                    value={selectedCategory?.id}
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === e.value);
                      setSelectedCategory(cat || null);
                    }}
                    options={categories}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select category"
                    className="w-full"
                    appendTo="self"
                  />
                  {formErrors.categoryId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.categoryId}</p>
                  )}
                </div>

                <InputField label="Buying Price *" name="buyingPrice" type="number" placeholder="0.00" error={formErrors.buyingPrice} required />
                <InputField label="Selling Price *" name="sellingPrice" type="number" placeholder="0.00" error={formErrors.sellingPrice} required />
                <InputField label="Stock Quantity *" name="stockQuantity" type="number" placeholder="0" error={formErrors.stockQuantity} required />
                <InputField label="Video URL" name="videoUrl" type="text" placeholder="https://example.com/video.mp4" />

                {/* Force Order Priority (Optional) */}
                <InputField
                  label="Force Order Priority"
                  name="forceOrderPriority"
                  type="number"
                  value={forceOrderPriority}
                  onChange={(e) => setForceOrderPriority(Number(e.target.value))}
                  placeholder="0 (0 = disabled)"
                  helperText="Set value > 0 to enable force order"
                />

                {/* Discount Percent (Optional) */}
                <InputField
                  label="Discount Percent"
                  name="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  placeholder="0 (0 = no discount)"
                  helperText="Set value > 0 to apply discount"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Product Images
                </label>

                {/* Upload Button */}
                <div className="mb-4">
                  <label className="inline-flex items-center justify-center w-full gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploading && <span className="ml-3 text-sm text-gray-500 animate-pulse">Uploading...</span>}
                </div>

                {/* Image Grid */}
                <div className="min-h-[180px] p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
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

              {/* Barcode Section */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Barcode
                </label>
                <div className="relative flex flex-col items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <Barcode
                      value={barcodeValue}
                      format="CODE128"
                      width={2}
                      height={60}
                      fontSize={12}
                      margin={10}
                      displayValue={true}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateBarcode}
                    className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <input type="hidden" name="barcode" value={barcodeValue} />
                {formErrors.barcode && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.barcode}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button type="button" onClick={closeModal} variant="outline">Cancel</Button>
                <Button type="submit" variant="primary">Create Product</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Modal */}
        {modalFor === "edit" && selectedProduct && (
          <Modal isOpen={true} onClose={closeModal} title="Edit Product" size="lg">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Product Name *" name="name" type="text" defaultValue={selectedProduct.name} error={formErrors.name} required />

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <Dropdown
                    value={selectedCategory?.id}
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === e.value);
                      setSelectedCategory(cat || null);
                    }}
                    options={categories}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select category"
                    className="w-full"
                    appendTo="self"
                  />
                  {formErrors.categoryId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.categoryId}</p>
                  )}
                </div>

                <InputField label="Buying Price *" name="buyingPrice" type="number" defaultValue={selectedProduct.buyingPrice} error={formErrors.buyingPrice} required />
                <InputField label="Selling Price *" name="sellingPrice" type="number" defaultValue={selectedProduct.sellingPrice} error={formErrors.sellingPrice} required />
                <InputField label="Stock Quantity *" name="stockQuantity" type="number" defaultValue={selectedProduct.stockQuantity} error={formErrors.stockQuantity} required />
                <InputField label="Video URL" name="videoUrl" type="text" defaultValue={selectedProduct.videoUrl} />

                {/* Force Order Priority (Optional) */}
                <InputField
                  label="Force Order Priority"
                  name="forceOrderPriority"
                  type="number"
                  value={forceOrderPriority}
                  onChange={(e) => setForceOrderPriority(Number(e.target.value))}
                  placeholder="0 (0 = disabled)"
                  helperText="Set value > 0 to enable force order"
                />

                {/* Discount Percent (Optional) */}
                <InputField
                  label="Discount Percent"
                  name="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  placeholder="0 (0 = no discount)"
                  helperText="Set value > 0 to apply discount"
                />
              </div>

              {/* Image Upload Section - Same as create modal */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Product Images
                </label>

                {/* Upload Button */}
                <div className="mb-4">
                  <label className="inline-flex items-center justify-center w-full gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload More Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {uploading && <span className="ml-3 text-sm text-gray-500 animate-pulse">Uploading...</span>}
                </div>

                {/* Image Grid */}
                <div className="min-h-[180px] p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
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

              {/* Barcode Section - Without regenerate button */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Barcode
                </label>
                <div className="flex items-center justify-center p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <Barcode
                      value={barcodeValue}
                      format="CODE128"
                      width={1.8}
                      height={50}
                      fontSize={10}
                      margin={5}
                      displayValue={true}
                    />
                  </div>
                </div>
                <input type="hidden" name="barcode" value={barcodeValue} />
                {formErrors.barcode && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.barcode}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button type="button" onClick={closeModal} variant="outline">Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
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
              {selectedProduct && selectedProduct.stockQuantity > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                  ⚠️ Warning: This product has {selectedProduct.stockQuantity} units in stock. Deleting will remove all stock data.
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button onClick={closeModal} variant="outline">Cancel</Button>
                <Button onClick={handleDelete} variant="danger">Delete Product</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DndProvider>
  );
};

export default Product;