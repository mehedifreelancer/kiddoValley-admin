export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  website: string;
}

export interface WebSettings {
  logoUrl: string | null;
  socialLinks: SocialLinks;
  footerText: string;
}
