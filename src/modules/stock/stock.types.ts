export interface FlatStockItem {
  id: number;
  batchNo: string;
  buyingPrice: number;
  sellingPrice: number;
  discountPercent: number;
  currentQty: number;
  variant: {
    id: number;
    sku: string;
    barcode: string | null;
    attributes: any;
    images: any[];
    productName: string;
  };
}
