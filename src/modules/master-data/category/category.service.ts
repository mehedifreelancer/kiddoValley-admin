// modules/master-data/category/category.service.ts
import api from "../../../apiConfig";
import type {
  CategoryItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ApiResponse,
} from "./category.types";

// Get all categories
export const getCategories = async (): Promise<CategoryItem[]> => {
  try {
    const response =
      await api.get<ApiResponse<CategoryItem[]>>("categories/getAll");
    if (response.data.success) {
      return response.data.data;
    }
    return [];
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
    const response = await api.post<ApiResponse<CategoryItem>>(
      "categories/create",
      payload,
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create category");
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
    const response = await api.put<ApiResponse<CategoryItem>>(
      `categories/edit/${id}`,
      payload,
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to update category");
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse<void>>(
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
