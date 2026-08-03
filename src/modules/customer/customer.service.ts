// modules/customer/customer.service.ts
import api from "../../apiConfig";
import {
  CreateCustomerPayload,
  Customer,
  UpdateCustomerPayload,
} from "./customer.types";

export const getCustomers = async (search?: string): Promise<Customer[]> => {
  const response = await api.get("/customers", { params: { search } });
  return response.data.data;
};

export const getCustomer = async (phone: string): Promise<Customer> => {
  const response = await api.get(`/customers/${phone}`);
  return response.data.data;
};

export const createCustomer = async (
  payload: CreateCustomerPayload,
): Promise<Customer> => {
  const response = await api.post("/customers", payload);
  return response.data.data;
};

export const updateCustomer = async (
  phone: string,
  payload: UpdateCustomerPayload,
): Promise<Customer> => {
  const response = await api.put(`/customers/${phone}`, payload);
  return response.data.data;
};

export const deleteCustomer = async (phone: string): Promise<void> => {
  await api.delete(`/customers/${phone}`);
};
