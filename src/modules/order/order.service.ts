import api from "../../apiConfig";
import { CreateOrderPayload } from "./order.types";
export interface OrderItem {
  id: number;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  total: number;
  subtotal: number;
  discount: number;
  orderStatus: string;
  isWebsiteOrder: boolean;
  isSuspicious: boolean;
  paymentStatus: string;
  deliveryStatus?: string;
  pathaoInvoiceId?: string;
  pathaoConsignmentId?: string;
  pathaoLastSyncedAt?: string;
  deliveryDate?: string;
  createdAt: string;
  hasRefund?: boolean;
  refundStatus?: string;
  totalRefunded?: number;
  soldItems?: any[];
}

export interface RefundPayload {
  type: "partial" | "full";
  reason: string;
  imageUrl?: string;
  transactionId?: string;
  items?: { soldItemId: number; quantity: number; amount: number }[];
}

// অর্ডার তৈরি (status new)
export const createOrder = (payload: CreateOrderPayload) =>
  api.post("/orders", payload).then((res) => res.data);

// অর্ডার তৈরি + কনফর্ম (status confirmed + Pathao)
export const createAndConfirmOrder = (payload: CreateOrderPayload) =>
  api.post("/orders/confirm-and-pack", payload).then((res) => res.data);

// কাস্টমার চেক (ফোন নম্বর দিয়ে)
export const checkCustomerExists = (phone: string) =>
  api.get(`/customers/check?phone=${phone}`).then((res) => res.data);

// অর্ডার কনফর্ম (ইতিমধ্যে তৈরি অর্ডার -> confirmed + Pathao)
export const confirmOrder = (id: number) =>
  api.put(`/orders/${id}/confirm`).then((res) => res.data);

// অর্ডার আপডেট (শুধু কাস্টমার ইনফো, 'new' স্ট্যাটাসে)
export const updateOrder = (id: number, payload: any) =>
  api.put(`/orders/${id}`, payload).then((res) => res.data);

// অর্ডার বাতিল (status cancelled)
export const cancelOrder = (id: number) =>
  api.delete(`/orders/${id}`).then((res) => res.data);

// অর্ডার ডিলিট (শুধু cancelled হলে)
export const deleteOrder = (id: number) =>
  api.delete(`/orders/${id}/delete`).then((res) => res.data);

// অর্ডার ডিটেইলস
export const getOrderDetails = (id: number) =>
  api.get(`/orders/${id}`).then((res) => res.data);

// অর্ডার লিস্ট
export const getOrders = (
  page: number,
  limit: number,
  search: string,
  sortBy: string,
  sortOrder: string,
) =>
  api
    .get(
      `orders?page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
    )
    .then((res) => res.data);

// (ঐচ্ছিক) পাথাও স্ট্যাটাস সিঙ্ক
export const syncPathaoStatuses = (orderIds: number[]) =>
  api.post("/orders/sync-statuses", { orderIds }).then((res) => res.data);

export const processRefund = async (
  orderId: number,
  payload: RefundPayload,
): Promise<any> => {
  const response = await api.post(`/orders/${orderId}/refund`, payload);
  return response.data;
};
