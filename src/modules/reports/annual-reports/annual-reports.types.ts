export interface MonthlyData {
  month: number;
  monthName: string;
  totalSales: number;
  salesNetProfit: number;
  otherIncome: number;
  expenses: number;
  monthlyNet: number;
  runningCash: number;
}

export interface AnnualReportTotals {
  totalSales: number;
  totalSalesNetProfit: number;
  totalOtherIncome: number;
  totalExpenses: number;
  totalMonthlyNet: number;
  finalCash: number;
}

export interface AnnualReportData {
  year: number;
  months: MonthlyData[];
  totals: AnnualReportTotals;
}
