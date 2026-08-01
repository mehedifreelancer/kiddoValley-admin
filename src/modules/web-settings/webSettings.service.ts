// modules/web-settings/webSettings.service.ts
import api from "../../apiConfig";
import { WebSettings } from "./webSettings.types";

export const getWebSettings = async (): Promise<WebSettings> => {
  const response = await api.get<{ success: boolean; data: WebSettings }>(
    "/web-settings",
  );
  return response.data.data;
};

export const updateWebSettings = async (formData: FormData) => {
  const response = await api.post("/web-settings", formData, {
    headers: { "Content-Type": "multipart/form-data" }, // explicit
  });
  return response.data.data;
};
     