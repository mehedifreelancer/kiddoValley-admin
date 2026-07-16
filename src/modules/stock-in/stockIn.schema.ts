import { z } from "zod";

export const stockInPayloadSchema = z.object({
  supplierId: z.number().positive("Supplier is required"),
  supplierName: z.string().optional(),
  stockInDate: z.string().datetime(),
  items: z
    .array(
      z.object({
        stockId: z.number().positive(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      }),
    )
    .min(1, "At least one item is required"),
  subtotal: z.number(),
  total: z.number(),
});

export type StockInPayload = z.infer<typeof stockInPayloadSchema>;
