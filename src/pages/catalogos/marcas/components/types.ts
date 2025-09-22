export type BrandMarketPosition = 'PREMIUM' | 'MEDIO' | 'ECONOMICO';

export interface IBrand {
  id: number;
  company_id: number;
  code: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  origin_country: string;
  manufacturer: string;
  quality_rating: number;
  market_position: BrandMarketPosition;
  category_focus: string;
  is_active: boolean;
  is_exclusive: boolean;
  margin_percentage: number;
  created_at: string;
  updated_at: string;
  products_count: number;
  total_sales: number;
  avg_price: number;
}

export interface IBrandFilters {
  search: string;
  market_position?: BrandMarketPosition;
  origin_country?: string;
  is_active?: boolean;
  is_exclusive?: boolean;
  quality_rating_min?: number;
}

export interface IBrandStats {
  total_brands: number;
  active_brands: number;
  exclusive_brands: number;
  avg_quality_rating: number;
  total_products: number;
  total_sales: number;
}