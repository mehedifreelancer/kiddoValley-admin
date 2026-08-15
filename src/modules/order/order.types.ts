export interface OrderItem {
  stockId: number;
  batchNo: string;
  productName: string;
  sku: string;
  buyingPrice: number;
  sellingPrice: number;
  discountPercent: number;
  quantity: number;
  maxQuantity: number;
  total: number;
  discountAmount: number;
  finalPrice: number;
  profitTk: number;
  profitPercent: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  deliveryDate?: string;
  items: {
    stockId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  discountTotal: number;
  total: number;
}
// order.types.ts
export type LocationType = "inside_dhaka" | "suburbs" | "outside_dhaka";
