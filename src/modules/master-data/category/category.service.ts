// modules/master-data/category/category.service.ts
import api from "../../../apiConfig";
import type {
  CategoryItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  PaginatedResponse,
} from "./category.types";

// Get all categories with pagination and search
export const getCategories = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<PaginatedResponse<CategoryItem>> => {
  try {
    let url = `categories/getAll?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await api.get<PaginatedResponse<CategoryItem>>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Create new category
export const createCategory = async (
  payload: CreateCategoryPayload,
): Promise<CategoryItem> => {
  try {
    const response = await api.post<{ success: boolean; data: CategoryItem }>(
      "categories/create",
      payload,
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error("Failed to create category");
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Update category
export const updateCategory = async (
  id: number,
  payload: UpdateCategoryPayload,
): Promise<CategoryItem> => {
  try {
    const response = await api.put<{ success: boolean; data: CategoryItem }>(
      `categories/edit/${id}`,
      payload,
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error("Failed to update category");
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<{ success: boolean }>(
      `categories/delete/${id}`,
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete category");
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
