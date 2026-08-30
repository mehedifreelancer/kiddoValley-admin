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
// in your stock api service file
export const adjustStock = async (payload: {
  stockId: number;
  quantity: number;
  reasonType: "lost" | "damaged" | "count_mistake" | "other";
  customReason?: string;
  imageUrl?: string;
}) => {
  const response = await api.post("/stock/adjust", payload);
  return response.data;
};
