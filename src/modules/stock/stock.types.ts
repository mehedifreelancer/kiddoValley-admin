export interface FlatStockItem {
  id: number;
  batchNo: string;
  buyingPrice: number;
  sellingPrice: number;
  discountPercent: number;
  currentQty: number;
  createdAt: string;
  variant: {
    id: number;
    sku: string;
    barcode: string | null;
    attributes: any;
    images: any[];
    isImported: boolean;
    countryOfOrigin: string | null;
    productName: string;
  };
}

export interface StockListResponse {
  success: boolean;
  data: FlatStockItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
