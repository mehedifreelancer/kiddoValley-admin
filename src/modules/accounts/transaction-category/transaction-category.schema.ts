// modules/account/transaction-category/transaction-category.schema.ts
import { z } from "zod";

export const transactionCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-_]+$/,
      "Name can only contain letters, spaces, hyphens and underscores",
    ),
  type: z.enum(["in", "out"], {
    errorMap: () => ({
      message: "Type must be either 'in' (Income) or 'out' (Expense)",
    }),
  }),
  description: z
    .string()
    .max(255, "Description must be less than 255 characters")
    .optional()
    .nullable(),
});

export type TransactionCategoryFormData = z.infer<
  typeof transactionCategorySchema
>;
