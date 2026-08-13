// ============================================================
// sells-report.service.ts
// Sells Report এর জন্য API কল
// ============================================================

import api from "../../apiConfig"; // আপনার API ক্লায়েন্ট (axios instance)
import {
  OrderData,
  SellsReportFilters,
  SellsReportResponse,
} from "./sells-reports.types";

/**
 * সেলস রিপোর্ট ডেটা ফেচ করে
 * @param startDate - 'YYYY-MM-DD' ফরম্যাটে (ঐচ্ছিক)
 * @param endDate - 'YYYY-MM-DD' ফরম্যাটে (ঐচ্ছিক)
 * @returns Promise<OrderData[]> - অর্ডারগুলোর অ্যারে
 */
export const fetchSellsReport = async (
  startDate?: string,
  endDate?: string,
): Promise<OrderData[]> => {
  // কুয়েরি প্যারামিটার তৈরি
  const params: SellsReportFilters = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  // API কল
  const response = await api.get<SellsReportResponse>("/report/sells", {
    params,
  });

  // রেসপন্স চেক
  if (response.data.success && response.data.data) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || "Failed to fetch sells report");
  }
};

/**
 * (ঐচ্ছিক) আজকের তারিখ স্ট্রিং ফরম্যাটে রিটার্ন করে
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};
