export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  website: string;
}

// 🆕 Contact Info Interface
export interface ContactInfo {
  phone: string;
  email: string;
  facebookPage?: string;
  whatsapp: string;
  address: string;
  workingHours: string;
  workingHoursWeekend?: string;
}

export interface WebSettings {
  logoUrl: string | null;
  socialLinks: SocialLinks;
  footerText: string;
  contactInfo?: ContactInfo; // 🆕
}
