import { FlatStockItem } from "../modules/stock/stock.types";

// lib/stockHelpers.ts
export const checkStockAvailability = (stock: FlatStockItem) => {
  if (stock.currentQty <= 0) {
    return { available: false, message: "Out of stock" };
  }
  return { available: true };
};