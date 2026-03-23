export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}