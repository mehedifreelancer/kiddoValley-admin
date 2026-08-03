// modules/customer/customer.schema.ts
import { z } from "zod";

export const customerSchema = z.object({
  phone: z
    .string()
    .min(11, "Phone must be at least 11 digits")
    .max(14, "Phone must be at most 14 digits")
    .regex(
      /^01\d{9}$/,
      "Phone must be a valid Bangladeshi number (01XXXXXXXXX)",
    ),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  secondaryPhone: z
    .string()
    .regex(
      /^01\d{9}$/,
      "Secondary phone must be a valid Bangladeshi number (01XXXXXXXXX)",
    )
    .optional()
    .or(z.literal("")),
  gender: z.string().optional(),
  hasBaby: z.boolean().optional(),
  preferredToy: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
