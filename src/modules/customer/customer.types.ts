// modules/customer/customer.types.ts
export interface Customer {
  phone: string;
  name: string;
  address: string;
  secondaryPhone?: string;
  gender?: string;
  hasBaby?: boolean;
  preferredToy?: string;
  createdAt: string;
  updatedAt: string;
  orders?: {
    id: number;
    invoiceNo: string;
    total: number;
    createdAt: string;
  }[];
}

export type CreateCustomerPayload = Omit<
  Customer,
  "createdAt" | "updatedAt" | "orders"
>;
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;
