export interface PathaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface PathaoStore {
  id: number;
  name: string;
  address: string;
  // ... other fields
}

export interface PathaoCreateOrderRequest {
  store_id: number;
  merchant_order_id: string;   // your internal order ID
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_type: number;       // 48 = Normal
  item_type: number;           // 2 = Parcel
  item_weight: number;         // in KG
  amount_to_collect: number;   // COD amount (total bill)
  item_quantity: number;
  // optional: special_instruction, etc.
}

export interface PathaoCreateOrderResponse {
  consignment_id: string;
  tracking_url: string;
  // ... other fields
}