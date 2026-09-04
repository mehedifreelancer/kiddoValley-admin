import { z } from "zod";

const urlSchema = z
  .string()
  .url("Must be a valid URL (including http:// or https://)")
  .or(z.literal(""));

const phoneRegex = /^[\d\s\-\+\(\)]+$/;

export const webSettingsSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  socialLinks: z.object({
    facebook: urlSchema,
    instagram: urlSchema,
    youtube: urlSchema,
    website: urlSchema,
  }),
  footerText: z
    .string()
    .max(500, "Footer text too long (max 500 characters)")
    .optional(),
  // 🆕 Contact Info
  contactInfo: z
    .object({
      phone: z.string().min(1, "ফোন নম্বর প্রয়োজন"),
      email: z.string().email("Valid email required"),
      facebookPage: z.string().url().optional().or(z.literal("")),
      whatsapp: z.string().min(1, "হোয়াটসঅ্যাপ নম্বর প্রয়োজন"),
      address: z.string().min(1, "ঠিকানা প্রয়োজন"),
      workingHours: z.string().min(1, "কর্মঘণ্টা প্রয়োজন"),
      workingHoursWeekend: z.string().optional().or(z.literal("")),
    })
    .optional(),
});

export type WebSettingsFormData = z.infer<typeof webSettingsSchema>;
