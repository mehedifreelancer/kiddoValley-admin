import api from "../../apiConfig";
import {
  BalanceSummary,
  DashboardData,
  PaginatedResponse,
  Transaction,
  TransactionCategory,
} from "./balance.types";

// ---------- Categories ----------
export const getCategories = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<PaginatedResponse<TransactionCategory>> => {
  const res = await api.get("/account/categories", {
    params: { page, limit, search },
  });
  return res.data;
};

export const createCategory = async (data: {
  name: string;
  type: "in" | "out";
  description?: string;
}): Promise<TransactionCategory> => {
  const res = await api.post("/account/categories", data);
  return res.data.data;
};

export const updateCategory = async (
  id: number,
  data: Partial<{ name: string; type: "in" | "out"; description?: string }>,
): Promise<TransactionCategory> => {
  const res = await api.put(`/account/categories/${id}`, data);
  return res.data.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/account/categories/${id}`);
};

// ---------- Transactions ----------
export const getTransactions = async (
  page = 1,
  limit = 10,
  filters?: any,
): Promise<PaginatedResponse<Transaction>> => {
  const res = await api.get("/account/transactions", {
    params: { page, limit, ...filters },
  });
  return res.data;
};

export const createTransaction = async (data: {
  categoryId: number;
  amount: number;
  note?: string;
  date?: string;
}): Promise<Transaction> => {
  const res = await api.post("/account/transactions", data);
  return res.data.data;
};

export const updateTransaction = async (
  id: number,
  data: Partial<{
    categoryId: number;
    amount: number;
    note?: string;
    date?: string;
  }>,
): Promise<Transaction> => {
  const res = await api.put(`/account/transactions/${id}`, data);
  return res.data.data;
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await api.delete(`/account/transactions/${id}`);
};

// ---------- Dashboard (পুরনো) ----------
export const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get("/account/dashboard");
  return res.data.data;
};

// ✅ নতুন – Balance Summary (মোট মূলধন + ক্যাশ + স্টক + অ্যাসেট)
export const getBalanceSummary = async (): Promise<BalanceSummary> => {
  const res = await api.get("/account/balance-summary");
  return res.data.data;
};
