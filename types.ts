
export enum CategoryType {
  SPOTS = '斑點',
  WRINKLES = '皺紋',
  PORES = '毛孔',
  LIFTING = '拉提',
  HAIR_REMOVAL = '除毛',
  FILLERS = '微整填補'
}

export interface TreatmentPriceOption {
  id: string;
  treatment_id: string;
  label: string;
  sessions: number | null;
  price: number;
  sort_order: number;
  is_active: boolean;
}

export interface Treatment {
  id: string;
  title: string;
  price: number;
  description: string;
  sort_order: number;
  image_url?: string;
  updated_at?: string;
  treatment_price_options?: TreatmentPriceOption[];
}

export interface ImprovementCategory {
  id: string;
  name: string;
  icon_name: string;
  icon_image_path?: string;
  icon_url?: string;
  icon_image_updated_at?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface AestheticCase {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  created_at: any;
}

export interface User {
  id: string;
  email: string | null;
}
