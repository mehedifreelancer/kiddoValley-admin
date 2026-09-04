// src/modules/master-data/worksheet/worksheet.types.ts

export interface WorksheetItem {
  id: number;
  title: string;
  filePath: string;
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

export interface CreateWorksheetPayload {
  title: string;
  file: File; // for FormData
}

export interface UpdateWorksheetPayload {
  title?: string;
  file?: File;
}
