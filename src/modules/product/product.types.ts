// modules/master-data/product/product.types.ts
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  imgUrl: string;
}

export interface ProductItem {
  id: number;
  barcode: string;
  name: string;
  slug: string;
  videoUrl: string | null;
  description: string | null;
  images: ProductImage[];
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
  isPublished: boolean;
  category?: Category;
}

export interface CreateProductPayload {
  barcode: string;
  barcodeTitle: string;
  name: string;
  categoryId: number;
  buyingPrice: number;
  sellingPrice: number;
  videoUrl?: string;
  description?: string;
  images?: ProductImage[];
  forceOrderPriority?: number;
  discountPercent?: number;
}

export interface UpdateProductPayload {
  barcode?: string;
  barcodeTitle?: string;
  name?: string;
  categoryId?: number;
  buyingPrice?: number;
  sellingPrice?: number;
  videoUrl?: string;
  description?: string;
  images?: ProductImage[];
  forceOrderPriority?: number;
  discountPercent?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
