export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  slug: string;
  videoUrl: string;
  images: string;
  isForceOrder: boolean;
  forceOrderPriority: number;
  categoryId: number;
  buyingPrice: number;
  sellingPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}