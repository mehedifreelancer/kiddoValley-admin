import api from "../../apiConfig";
import { StockListResponse } from "./stock.types";

export const getStockList = async (
  page: number,
  limit: number,
  search: string,
  sortBy: string,
  sortOrder: "asc" | "desc",
): Promise<StockListResponse> => {
  const response = await api.get<StockListResponse>("/stock/flat-list", {
    params: { page, limit, search, sortBy, sortOrder },
  });
  return response.data;
};
