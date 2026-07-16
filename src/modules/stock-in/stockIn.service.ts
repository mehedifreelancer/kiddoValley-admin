import api from "../../apiConfig";
import { CreateStockInPayload, Supplier } from "./stockIn.types";

export const createStockIn = (payload: CreateStockInPayload) => {
  return api.post("/stock/stock-in/create", payload);
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get("/suppliers");
  return response.data.data;
};
