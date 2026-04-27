import api from "../../apiConfig";
import type { Category, PaginatedResponse, ProductItem } from "./product.types";

export const getProducts = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  categoryId?: number,
): Promise<PaginatedResponse<ProductItem>> => {
  let url = `products/getAll?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (categoryId) url += `&categoryId=${categoryId}`;
  const response = await api.get<PaginatedResponse<ProductItem>>(url);
  return response.data;
};

export const getProductById = async (id: number): Promise<ProductItem> => {
  const response = await api.get<{ success: boolean; data: ProductItem }>(
    `products/getById/${id}`,
  );
  return response.data.data;
};

export const getProductByBarcode = async (
  barcode: string,
): Promise<ProductItem> => {
  const response = await api.get<{ success: boolean; data: ProductItem }>(
    `products/getByBarcode/${barcode}`,
  );
  return response.data.data;
};

export const getCategoriesForDropdown = async (): Promise<Category[]> => {
  const response = await api.get<{ success: boolean; data: Category[] }>(
    "categories/dropdown",
  );
  return response.data.data || [];
};

// ✅ CREATE - Send FormData
export const createProduct = async (
  formData: FormData,
): Promise<ProductItem> => {
  const response = await api.post<{
    success: boolean;
    data: { product: ProductItem };
  }>("products/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data.product;
};

// ✅ UPDATE - Send FormData
export const updateProduct = async (
  id: number,
  formData: FormData,
): Promise<ProductItem> => {
  const response = await api.put<{ success: boolean; data: ProductItem }>(
    `products/edit/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`products/delete/${id}`);
};

export const generateBarcode = (): string => {
  return Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0");
};
