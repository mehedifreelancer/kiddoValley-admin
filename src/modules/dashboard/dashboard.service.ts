import api from "../../apiConfig";
import {
  BestProduct,
  CategorySale,
  HeatmapData,
  OrderStatus,
  OrderTrafficData,
  OverviewData,
  PaymentStatus,
  ProductSale,
  RetentionData,
  SalesTrend,
  SalesVsProfitData,
  TopCustomer,
  TopProfitProduct,
} from "./dashboard.types";

// Helper to build query string
const buildQuery = (startDate?: string, endDate?: string): string => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();
  return q ? `?${q}` : "";
};

export const fetchOverview = async (
  startDate?: string,
  endDate?: string,
): Promise<OverviewData> => {
  const res = await api.get(
    `/dashboard/overview${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchSalesTrend = async (
  startDate?: string,
  endDate?: string,
): Promise<SalesTrend[]> => {
  const res = await api.get(
    `/dashboard/sales-trend${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchBestProducts = async (
  startDate?: string,
  endDate?: string,
): Promise<BestProduct[]> => {
  const res = await api.get(
    `/dashboard/best-products${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchCategorySales = async (
  startDate?: string,
  endDate?: string,
): Promise<CategorySale[]> => {
  const res = await api.get(
    `/dashboard/category-sales${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchTopCustomers = async (
  startDate?: string,
  endDate?: string,
): Promise<TopCustomer[]> => {
  const res = await api.get(
    `/dashboard/top-customers${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchHeatmap = async (
  startDate?: string,
  endDate?: string,
): Promise<HeatmapData[]> => {
  const res = await api.get(
    `/dashboard/heatmap${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchRetention = async (
  startDate?: string,
  endDate?: string,
): Promise<RetentionData> => {
  const res = await api.get(
    `/dashboard/retention${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchPaymentStatus = async (
  startDate?: string,
  endDate?: string,
): Promise<PaymentStatus[]> => {
  const res = await api.get(
    `/dashboard/payment-status${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchOrderStatus = async (
  startDate?: string,
  endDate?: string,
): Promise<OrderStatus[]> => {
  const res = await api.get(
    `/dashboard/order-status${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

// ✅ নতুন ফাংশন – টপ লাভজনক পণ্য
export const fetchTopProfitProducts = async (
  startDate?: string,
  endDate?: string,
): Promise<TopProfitProduct[]> => {
  const res = await api.get(
    `/dashboard/top-profit-products${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchProductSales = async (
  startDate?: string,
  endDate?: string,
): Promise<ProductSale[]> => {
  const res = await api.get(
    `/dashboard/product-sales${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};

export const fetchSalesVsProfit = async (
  startDate?: string,
  endDate?: string,
): Promise<SalesVsProfitData[]> => {
  const res = await api.get(
    `/dashboard/sales-vs-profit${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};
export const fetchOrderTraffic = async (
  startDate?: string,
  endDate?: string,
): Promise<OrderTrafficData> => {
  const res = await api.get(
    `/dashboard/order-traffic${buildQuery(startDate, endDate)}`,
  );
  return res.data.data;
};
