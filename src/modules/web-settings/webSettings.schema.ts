import { z } from "zod";

export const socialLinksSchema = z.object({
  facebook: z.string().url().or(z.literal("")),
  instagram: z.string().url().or(z.literal("")),
  youtube: z.string().url().or(z.literal("")),
  website: z.string().url().or(z.literal("")),
});

export const webSettingsSchema = z.object({
  logoUrl: z.string().nullable(),
  socialLinks: socialLinksSchema,
  footerText: z.string().max(500, "Footer text is too long"),
});
