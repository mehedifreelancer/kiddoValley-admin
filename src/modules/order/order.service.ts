import api from "../../apiConfig";

// ---------- Order creation flows ----------

// 1. Confirm order – DB only (no Pathao, no email from backend)
export const createOrder = (payload: any) => {
  return api.post("/orders/confirm", payload);
};

// 2. Confirm & Pack – DB + Pathao + mandatory email (backend)
export const confirmAndPack = (payload: any) => {
  return api.post("/orders/confirm-and-pack", payload);
};
export const checkCustomerExists = async (phone: string) => {
  try {
    const response = await api.get(`/customers/${phone}`);
    return response.data.success && response.data.data !== null;
  } catch {
    return false;
  }
};
// ---------- Order list (pagination + search) ----------
export const getOrders = async (
  page: number,
  limit: number,
  search: string,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const response = await api.get("/orders/orders", {
    params: { page, limit, search, sortBy, sortOrder },
  });
  return response.data;
};

// ---------- Batch sync Pathao statuses ----------
export const syncPathaoStatuses = async (orderIds: number[]) => {
  const response = await api.post("/orders/sync-statuses", { orderIds });
  return response.data;
};

// ---------- Pack existing order (for OrderList) ----------
export const packOrder = (orderId: number) => {
  return api.post(`/orders/${orderId}/pack`);
};

// ---------- Reprint order ----------
export const reprintOrder = (orderId: number) => {
  return api.get(`/orders/${orderId}/reprint`);
};
