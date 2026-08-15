import api from "../../../apiConfig";
import { Asset, PaginatedResponse } from "./asset.types";

// ---------- Asset CRUD ----------
export const getAssets = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Asset>> => {
  const res = await api.get("/account/assets", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createAsset = async (
  data: Partial<Asset> & { deductFromCash?: boolean },
): Promise<Asset> => {
  const res = await api.post("/account/assets", data);
  return res.data.data;
};

export const updateAsset = async (
  id: number,
  data: Partial<Asset>,
): Promise<Asset> => {
  const res = await api.put(`/account/assets/${id}`, data);
  return res.data.data;
};

export const deleteAsset = async (id: number): Promise<void> => {
  await api.delete(`/account/assets/${id}`);
};

export const sellAsset = async (
  id: number,
  sellPrice: number,
  date?: string,
): Promise<any> => {
  const res = await api.post(`/account/assets/sell/${id}`, {
    sellPrice,
    date,
  });
  return res.data;
};
