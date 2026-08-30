// modules/reports/daily-report/daily-report.types.ts

export interface ExpenseDetail {
  category: string;
  amount: number;
  note: string;
  date: string;
}

export interface DailyData {
  date: string;
  label: string;
  totalSales: number;
  totalRefunds: number;
  salesNetProfit: number;
  otherIncome: number;
  expenses: number;
  expenseDetails: ExpenseDetail[]; // ✅ new
  dailyNet: number;
  runningCash: number;
}

export interface DailyReportTotals {
  totalSales: number;
  totalRefunds: number;
  totalSalesNetProfit: number;
  totalOtherIncome: number;
  totalExpenses: number;
  totalDailyNet: number;
  finalCash: number;
}

export interface DailyReportData {
  startDate: string;
  endDate: string;
  days: DailyData[];
  totals: DailyReportTotals;
}
