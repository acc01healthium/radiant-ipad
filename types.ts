
export enum CategoryType {
  SPOTS = '斑點',
  WRINKLES = '皺紋',
  PORES = '毛孔',
  LIFTING = '拉提',
  HAIR_REMOVAL = '除毛',
  FILLERS = '微整填補'
}

export interface Treatment {
  id: string;
  title: string;
  price: number;
  description: string;
  icon_name: string;
  sort_order: number;
  image_url?: string;
  updated_at?: string;
}

export interface AestheticCase {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  created_at: any;
}

export interface CarouselImage {
  id: string;
  url: string;
  title?: string;
}

export interface User {
  id: string;
  email: string | null;
}
