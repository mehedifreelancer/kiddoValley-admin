export interface SliderImage {
  id: number;
  deviceType: "desktop" | "mobile";
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SliderGroup {
  desktop: SliderImage[];
  mobile: SliderImage[];
}
