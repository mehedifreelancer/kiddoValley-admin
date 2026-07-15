import { z } from "zod";

export const orderPayloadSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z
    .string()
    .min(11, "Phone must be exactly 11 digits")
    .max(11, "Phone must be exactly 11 digits")
    .regex(
      /^01\d{9}$/,
      "Phone must be a valid Bangladeshi number (01XXXXXXXXX)",
    ),
  customerPhone2: z.string().optional(),
  customerAddress: z.string().min(10, "Address must be at least 10 characters"),
  deliveryDate: z.string().optional(),
  items: z.array(
    z.object({
      stockId: z.number(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      totalPrice: z.number().positive(),
    }),
  ),
  subtotal: z.number(),
  discountTotal: z.number(),
  total: z.number(),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;
