import { Supplier } from "../supplier/supplier.types";

export interface StockInItem {
  stockId: number;
  batchNo: string;
  productName: string;
  sku: string;
  buyingPrice: number;
  sellingPrice: number;
  discountPercent: number;
  quantity: number;
  total: number; // buyingPrice * quantity
}

export interface CreateStockInPayload {
  supplierId: number;
  supplierName: string;
  stockInDate: string;
  items: {
    stockId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  total: number;
}

export { Supplier };
