export interface OverviewData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export interface SalesTrend {
  date: string;
  total: number;
}

export interface BestProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategorySale {
  name: string;
  value: number;
}

export interface TopCustomer {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

export interface HeatmapData {
  day: string;
  total: number;
}

export interface RetentionData {
  new: { count: number; spent: number };
  returning: { count: number; spent: number };
}

export interface PaymentStatus {
  paymentStatus: string;
  _count: number;
}

export interface OrderStatus {
  orderStatus: string;
  _count: number;
}

// ✅ নতুন টাইপ
export interface TopProfitProduct {
  name: string;
  profit: number;
}
export interface ProductSale {
  name: string;
  value: number;
}
export interface SalesVsProfitData {
  date: string;
  revenue: number;
  profit: number;
}
export interface OrderTrafficItem {
  x: string; // day
  y: string; // time slot
  value: number;
}

export interface OrderTrafficData {
  all: OrderTrafficItem[];
  website: OrderTrafficItem[];
  custom: OrderTrafficItem[];
  timeSlots: string[];
  dayNames: string[];
}
