import api from "../../apiConfig";
import { WebSettings } from "./webSettings.types";

export const getWebSettings = async (): Promise<WebSettings> => {
  const response = await api.get<{ success: boolean; data: WebSettings }>(
    "/web-settings",
  );
  return response.data.data;
};

export const updateWebSettings = async (
  formData: FormData,
): Promise<WebSettings> => {
  const response = await api.post<{ success: boolean; data: WebSettings }>(
    "/web-settings",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
};
