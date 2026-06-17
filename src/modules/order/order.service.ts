import api from "../../apiConfig";
import { CreateOrderPayload } from "./order.types";

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post("/orders/create", payload);
  return response.data;
};
