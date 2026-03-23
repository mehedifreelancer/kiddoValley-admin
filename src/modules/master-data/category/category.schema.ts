import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Category name can only contain letters and spaces"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
};