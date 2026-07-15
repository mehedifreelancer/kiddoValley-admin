import { z } from "zod";

export const stockInPayloadSchema = z.object({
  vendorId: z.number().positive("Vendor is required"),
  vendorName: z.string().optional(),
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
