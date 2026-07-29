import { z } from "zod";

// প্রতিটি অর্ডার আইটেমের জন্য স্কিমা
const orderItemSchema = z.object({
  stockId: z.number().int().positive("Stock ID must be a positive integer"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
});

// মূল অর্ডার পেলোড স্কিমা
export const orderPayloadSchema = z.object({
  // Customer details – কঠোর কিন্তু যুক্তিসঙ্গত
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  customerPhone: z
    .string()
    .regex(
      /^01\d{9}$/,
      "Phone must be a valid Bangladeshi number (01XXXXXXXXX)",
    ),
  customerPhone2: z
    .string()
    .regex(
      /^01\d{9}$/,
      "Secondary phone must be a valid Bangladeshi number (01XXXXXXXXX)",
    )
    .optional()
    .or(z.literal("")), // খালি থাকলে চলবে
  customerAddress: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(255, "Address too long"),
  gender: z.string().optional(),
  hasBaby: z.boolean().optional(),
  preferredToy: z.string().optional(),
  deliveryDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),

  // অর্ডার আইটেম
  items: z.array(orderItemSchema).min(1, "At least one item is required"),

  // আর্থিক তথ্য
  subtotal: z.number().min(0, "Subtotal cannot be negative"),
  discountTotal: z.number().min(0, "Discount cannot be negative"),
  total: z.number().positive("Total must be positive"),
});

// টাইপ ইনফারেন্স (ঐচ্ছিক)
export type OrderPayload = z.infer<typeof orderPayloadSchema>;
