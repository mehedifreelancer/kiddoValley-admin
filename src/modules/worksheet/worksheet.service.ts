// src/modules/master-data/worksheet/worksheet.service.ts

import api from "../../apiConfig";
import type { PaginatedResponse, WorksheetItem } from "./worksheet.types";

export const getWorksheets = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<PaginatedResponse<WorksheetItem>> => {
  const url = `worksheets?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const response = await api.get<PaginatedResponse<WorksheetItem>>(url);
  return response.data;
};

export const createWorksheet = async (
  formData: FormData,
): Promise<WorksheetItem> => {
  const response = await api.post<{ success: boolean; data: WorksheetItem }>(
    "worksheets",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  if (response.data.success) return response.data.data;
  throw new Error("Failed to create worksheet");
};

export const updateWorksheet = async (
  id: number,
  formData: FormData,
): Promise<WorksheetItem> => {
  const response = await api.put<{ success: boolean; data: WorksheetItem }>(
    `worksheets/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  if (response.data.success) return response.data.data;
  throw new Error("Failed to update worksheet");
};

export const deleteWorksheet = async (id: number): Promise<void> => {
  const response = await api.delete<{ success: boolean }>(`worksheets/${id}`);
  if (!response.data.success) throw new Error("Failed to delete");
};
