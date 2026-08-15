// modules/account/transaction-category/transaction-category.types.ts

export interface TransactionCategory {
  id: number;
  name: string;
  type: "in" | "out";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionCategoryPayload {
  name: string;
  type: "in" | "out";
  description?: string;
}

export interface UpdateTransactionCategoryPayload {
  name?: string;
  type?: "in" | "out";
  description?: string;
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
