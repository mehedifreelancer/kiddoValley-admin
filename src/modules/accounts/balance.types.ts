export interface TransactionCategory {
  id: number;
  name: string;
  type: "in" | "out";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  date: string;
  categoryId: number;
  category: TransactionCategory;
  amount: number;
  note?: string;
  createdBy?: number;
  createdAt: string;
}

export interface DashboardData {
  cashBalance: number;
  stockValue: number;
  profit: number;
  month: string;
}

// ✅ নতুন – Balance Summary টাইপ
export interface BalanceSummary {
  cashBalance: number;
  stockValue: number;
  assetValue: number;
  totalAssets: number; // ✅ notun — age "totalCapital" hishebe misuse hoto
  ownerCapital: number; // ✅ notun
  totalCapital: number; // ✅ ekhon true equity (ownerCapital + netProfit)
  totalRevenue: number;
  totalCOGS: number;
  totalExpense: number;
  netProfit: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
