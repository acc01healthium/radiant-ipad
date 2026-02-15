
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
  name: string;
  price: number;
  description: string;
  categories: CategoryType[];
  imageUrl?: string;
}

export interface AestheticCase {
  id: string;
  title: string;
  treatmentName: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  createdAt: any;
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
