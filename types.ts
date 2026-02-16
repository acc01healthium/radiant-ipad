
export interface TreatmentPriceOption {
  id: string;
  treatment_id: string;
  label: string;
  price: number;
  sessions: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface ImprovementCategory {
  id: string;
  name: string;
  icon_name: string;
  icon_image_path?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Treatment {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  treatment_price_options?: TreatmentPriceOption[];
  treatment_categories?: { category_id: string }[];
}

export interface AestheticCase {
  id: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  case_categories?: { category_id: string }[];
  case_treatments?: { treatment_id: string }[];
}
