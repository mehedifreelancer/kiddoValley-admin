// ============================================================
// sells-reports.types.ts
// Sells Report এর জন্য টাইপ ডিফিনেশন
// ============================================================

// প্রতিটি পণ্যের বিক্রয় ডেটা
export interface SoldItem {
  id: number;
  productName: string;
  buyPrice: number; // ক্রয় মূল্য (প্রতি ইউনিট)
  sellingPrice: number; // স্টকে রাখা বিক্রয় মূল্য (প্রতি ইউনিট)
  soldPrice: number; // প্রকৃত বিক্রি দাম (প্রতি ইউনিট)
  weight: number; // পরিমাণ/ওজন
  grossProfit: number; // মোট মুনাফা (সক্রুড)
  deliveryCharge: number; // ডেলিভারি চার্জ
  netProfit: number; // নেট মুনাফা (grossProfit - deliveryCharge)
  returnAmount: number; // ফেরত/রিটার্ন অ্যামাউন্ট
  refundedQuantity?: number; // কত পিস ফেরত এসেছে (ঐচ্ছিক)
}

// প্রতিটি অর্ডার
export interface OrderData {
  invoiceNo: string;
  items: SoldItem[];
}

// API রেসপন্সের র‍্যাপার (সাধারণত আপনার ব্যাকএন্ড এভাবেই ডেটা দেয়)
export interface SellsReportResponse {
  success: boolean;
  data: OrderData[];
  message?: string;
}

// ফিল্টার প্যারামিটার (যদি প্রয়োজন হয়)
export interface SellsReportFilters {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
}
