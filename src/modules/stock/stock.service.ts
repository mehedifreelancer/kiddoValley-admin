import api from "../../apiConfig";
import { FlatStockItem } from "./stock.types";

interface StockListResponse {
  data: FlatStockItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getStockList = async (
  page: number,
  limit: number,
  search: string,
  sortBy: string,
  sortOrder: "asc" | "desc",
  onlyInStock?: boolean,
): Promise<StockListResponse> => {
  const response = await api.get<StockListResponse>("/stock/flat-list", {
    params: { page, limit, search, sortBy, sortOrder, onlyInStock },
  });
  return response.data;
};
