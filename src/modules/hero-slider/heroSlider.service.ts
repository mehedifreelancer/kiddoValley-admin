import api from "../../apiConfig";
import {
  HeroSlider,
  HeroSliderFormData,
  PaginatedResponse,
} from "./heroSlider.types";

// Admin – with pagination & search
export const getHeroSliders = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<PaginatedResponse<HeroSlider>> => {
  let url = `/hero-sliders?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await api.get<PaginatedResponse<HeroSlider>>(url);
  return res.data;
};

export const createHeroSlider = async (
  data: HeroSliderFormData,
): Promise<HeroSlider> => {
  const res = await api.post<{ success: boolean; data: HeroSlider }>(
    "/hero-sliders",
    data,
  );
  return res.data.data;
};

export const updateHeroSlider = async (
  id: number,
  data: Partial<HeroSliderFormData>,
): Promise<HeroSlider> => {
  const res = await api.put<{ success: boolean; data: HeroSlider }>(
    `/hero-sliders/${id}`,
    data,
  );
  return res.data.data;
};

export const deleteHeroSlider = async (id: number): Promise<void> => {
  await api.delete(`/hero-sliders/${id}`);
};

export const reorderHeroSliders = async (
  ids: number[],
): Promise<HeroSlider[]> => {
  const res = await api.post<{ success: boolean; data: HeroSlider[] }>(
    "/hero-sliders/reorder",
    { ids },
  );
  return res.data.data;
};

// Image upload
export const uploadHeroImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await api.post<{ success: boolean; data: { url: string } }>(
    "/hero-sliders/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.data.url;
};

// Public
export const getPublicHeroSliders = async (): Promise<HeroSlider[]> => {
  const res = await api.get<{ success: boolean; data: HeroSlider[] }>(
    "/public/hero-sliders",
  );
  return res.data.data;
};
