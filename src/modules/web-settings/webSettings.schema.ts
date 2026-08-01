// modules/web-settings/webSettings.schema.ts
import { z } from "zod";

const urlSchema = z
  .string()
  .url("Must be a valid URL (including http:// or https://)")
  .or(z.literal(""));

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
});

export type WebSettingsFormData = z.infer<typeof webSettingsSchema>;
