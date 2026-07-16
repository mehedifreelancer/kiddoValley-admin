import api from "../../apiConfig";
import { SliderGroup, SliderImage } from "./slider.types";

export const getSliders = async (): Promise<SliderGroup> => {
  const response = await api.get<{ success: boolean; data: SliderGroup }>(
    "/sliders",
  );
  return response.data.data;
};

export const addSlider = async (formData: FormData): Promise<SliderImage> => {
  const response = await api.post<{ success: boolean; data: SliderImage }>(
    "/sliders",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data;
};

export const reorderSliders = async (
  deviceType: string,
  ids: number[],
): Promise<SliderImage[]> => {
  const response = await api.put<{ success: boolean; data: SliderImage[] }>(
    "/sliders/reorder",
    {
      deviceType,
      ids,
    },
  );
  return response.data.data;
};

export const deleteSlider = async (id: number): Promise<void> => {
  await api.delete(`/sliders/${id}`);
};
