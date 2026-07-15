import api from "../../apiConfig";
import {
  CreateSupplierPayload,
  Supplier,
  UpdateSupplierPayload,
} from "./supplier.types";

export const getSuppliers = async (search?: string): Promise<Supplier[]> => {
  const response = await api.get("/suppliers", { params: { search } });
  return response.data.data;
};

export const getSupplier = async (id: number): Promise<Supplier> => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data.data;
};

export const createSupplier = async (
  payload: CreateSupplierPayload,
): Promise<Supplier> => {
  const response = await api.post("/suppliers", payload);
  return response.data.data;
};

export const updateSupplier = async (
  id: number,
  payload: UpdateSupplierPayload,
): Promise<Supplier> => {
  const response = await api.put(`/suppliers/${id}`, payload);
  return response.data.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/suppliers/${id}`);
};
