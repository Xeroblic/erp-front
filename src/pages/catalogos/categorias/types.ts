export interface ICategory {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export interface ICategoryFilters {
  search: string;
  is_active?: boolean;
}

export interface ICategoryStats {
  total_categories: number;
  active_categories: number;
  products_total: number;
}

