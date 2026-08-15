import api from "../../../apiConfig";
import { AnnualReportData } from "./annual-reports.types";

export const fetchAnnualReport = async (
  year: number,
): Promise<AnnualReportData> => {
  const res = await api.get("/account/annual-report", {
    params: { year },
  });
  return res.data.data;
};
