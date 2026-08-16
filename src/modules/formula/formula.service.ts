// src/modules/manufacturing/formula/formula.service.ts
import api from "../../apiConfig";
import { Formula, PaginatedResponse } from "./formula.types";

export const getFormulas = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<Formula>> => {
  const res = await api.get<PaginatedResponse<Formula>>("/formulas", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createFormula = async (
  data: Partial<Formula>,
): Promise<Formula> => {
  const res = await api.post<{ success: boolean; data: Formula }>(
    "/formulas",
    data,
  );
  return res.data.data;
};

export const updateFormula = async (
  id: number,
  data: Partial<Formula>,
): Promise<Formula> => {
  const res = await api.put<{ success: boolean; data: Formula }>(
    `/formulas/${id}`,
    data,
  );
  return res.data.data;
};

export const deleteFormula = async (id: number): Promise<void> => {
  await api.delete(`/formulas/${id}`);
};
