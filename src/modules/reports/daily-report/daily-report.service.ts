// modules/reports/daily-report/daily-report.service.ts
import api from "../../../apiConfig";
import { DailyReportData } from "./daily-report.types";

export const fetchDailyReport = async (
  startDate: string,
  endDate: string,
): Promise<DailyReportData> => {
  const res = await api.get("/report/daily-report", {
    params: { startDate, endDate },
  });
  return res.data.data;
};
