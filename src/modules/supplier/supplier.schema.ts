import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
