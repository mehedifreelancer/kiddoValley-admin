// modules/account/transaction-category/transaction-category.service.ts
import api from "../../../apiConfig";
import type {
  CreateTransactionCategoryPayload,
  PaginatedResponse,
  TransactionCategory,
  UpdateTransactionCategoryPayload,
} from "./transaction-category.types";

// Get all categories with pagination and search
export const getTransactionCategories = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<PaginatedResponse<TransactionCategory>> => {
  const res = await api.get<PaginatedResponse<TransactionCategory>>(
    "/account/categories",
    {
      params: { page, limit, search },
    },
  );
  return res.data;
};

// Get all categories (no pagination – for dropdown)
export const getAllTransactionCategories = async (): Promise<
  TransactionCategory[]
> => {
  const res = await api.get<{ success: boolean; data: TransactionCategory[] }>(
    "/account/categories/all",
  );
  return res.data.data;
};

// Create new category
export const createTransactionCategory = async (
  payload: CreateTransactionCategoryPayload,
): Promise<TransactionCategory> => {
  const res = await api.post<{ success: boolean; data: TransactionCategory }>(
    "/account/categories",
    payload,
  );
  if (res.data.success) {
    return res.data.data;
  }
  throw new Error("Failed to create category");
};

// Update category
export const updateTransactionCategory = async (
  id: number,
  payload: UpdateTransactionCategoryPayload,
): Promise<TransactionCategory> => {
  const res = await api.put<{ success: boolean; data: TransactionCategory }>(
    `/account/categories/${id}`,
    payload,
  );
  if (res.data.success) {
    return res.data.data;
  }
  throw new Error("Failed to update category");
};

// Delete category
export const deleteTransactionCategory = async (id: number): Promise<void> => {
  const res = await api.delete<{ success: boolean }>(
    `/account/categories/${id}`,
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete category");
  }
};
