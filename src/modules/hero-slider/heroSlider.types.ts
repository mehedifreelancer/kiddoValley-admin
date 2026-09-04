export interface HeroSliderFormData {
  badgeText: string;
  firstTitle: string;
  secondTitle: string;
  firstTitleColor: string;
  secondTitleColor: string;
  description: string;
  bookTitle: string;
  bookSubtitle: string;
  sliderDetailsUrl?: string;
  bgType: "image" | "color"; // 🆕
  bgImage?: string | null; // 🆕 optional
  bgColor?: string | null; // 🆕
  innerBigImage: string;
  innerTopImage: string;
  innerBottomImage: string;
  isActive: boolean;
}

export interface HeroSlider extends HeroSliderFormData {
  id: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}
