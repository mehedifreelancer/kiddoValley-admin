// src/modules/manufacturing/formula/formula.types.ts
export interface Formula {
  id: number;
  title: string;
  content: string;
  images: string[]; // array of image URLs
  createdAt: string;
  updatedAt: string;
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
