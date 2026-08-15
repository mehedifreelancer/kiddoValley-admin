import api from "../../../apiConfig";
import { EmployeeBill, PaginatedResponse } from "./employee-bill.types";

export const getEmployeeBills = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<EmployeeBill>> => {
  const res = await api.get("/account/employee-bills", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createEmployeeBill = async (
  data: Partial<EmployeeBill>,
): Promise<EmployeeBill> => {
  const res = await api.post("/account/employee-bills", data);
  return res.data.data;
};

export const updateEmployeeBill = async (
  id: number,
  data: Partial<EmployeeBill>,
): Promise<EmployeeBill> => {
  const res = await api.put(`/account/employee-bills/${id}`, data);
  return res.data.data;
};

export const deleteEmployeeBill = async (id: number): Promise<void> => {
  await api.delete(`/account/employee-bills/${id}`);
};
