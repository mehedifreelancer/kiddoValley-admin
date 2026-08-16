// modules/manufacturing/formula/formula.schema.ts

import { z } from "zod";

export const formulaSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(1, "Content is required"),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export type FormulaFormData = z.infer<typeof formulaSchema>;
