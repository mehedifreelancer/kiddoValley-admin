// modules/account/raw-material/raw-material.service.ts

import api from "../../../apiConfig";
import { PaginatedResponse, RawMaterial } from "./raw-material.types";

export const getRawMaterials = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<RawMaterial>> => {
  const res = await api.get("/account/raw-materials", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createRawMaterial = async (
  data: Partial<RawMaterial>,
): Promise<RawMaterial> => {
  const res = await api.post("/account/raw-materials", data);
  return res.data.data;
};

export const updateRawMaterial = async (
  id: number,
  data: Partial<RawMaterial>,
): Promise<RawMaterial> => {
  const res = await api.put(`/account/raw-materials/${id}`, data);
  return res.data.data;
};

export const deleteRawMaterial = async (id: number): Promise<void> => {
  await api.delete(`/account/raw-materials/${id}`);
};
