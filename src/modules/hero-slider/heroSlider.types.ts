export interface HeroSlider {
  id: number;
  badgeText: string;
  firstTitle: string;
  secondTitle: string;
  firstTitleColor: string;
  secondTitleColor: string;
  description: string;
  bookTitle: string;
  bookSubtitle: string;
  sliderDetailsUrl: string | null;
  bgImage: string;
  innerBigImage: string;
  innerTopImage: string;
  innerBottomImage: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HeroSliderFormData = Omit<
  HeroSlider,
  "id" | "createdAt" | "updatedAt" | "order"
>;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
