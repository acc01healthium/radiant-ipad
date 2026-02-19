
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

export interface TreatmentCase {
  id: string;
  treatment_id: string;
  title: string;
  description: string;
  image_path: string;
  sort_order: number;
}

export interface Treatment {
  id: string;
  title: string;
  description: string;
  visual_path: string;
  sort_order: number;
  is_active: boolean;
  treatment_price_options?: TreatmentPriceOption[];
  treatment_improvement_categories?: { improvement_category_id: string }[];
  treatment_cases?: TreatmentCase[];
}
