export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  totalBought: number; // updated by stock‑in
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}
