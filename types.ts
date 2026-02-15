
export enum CategoryType {
  SPOTS = '斑點',
  WRINKLES = '皺紋',
  PORES = '毛孔',
  SAGGING = '鬆弛',
  REDNESS = '泛紅',
  ACNE = '痘痘'
}

export interface Treatment {
  id: string;
  name: string;
  price: number;
  description: string;
  categories: CategoryType[];
  imageUrl?: string;
}

export interface CarouselImage {
  id: string;
  url: string;
  title?: string;
}

export interface User {
  uid: string;
  email: string | null;
}
