
export type CreateBrandPayload = {
  name: string;
  code?: string;
  origin_country?: string;
  manufacturer?: string;
  is_active: boolean;
  image?: File | null;
};

export type UpdateBrandPayload = CreateBrandPayload & {
  id: number;
  branch_id?: number;
};

export interface FetchBrandsParams {
  branchId: number;
  search?: string;
}



export interface IBrandImage {
  id?: number;
  url: string;
  thumb?: string | null;
  alt?: string | null;
}

export interface IBrand {
  id: number;
  company_id: number;
  branch_id?: number;
  code?: string;
  name: string;
  slug?: string;
  origin_country?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count: number;
  total_sales: number;
  photo_url?: string | null;
  image?: IBrandImage | null;
  gallery?: IBrandImage[];
}

export interface IBrandFilters {
  search: string;
  branch_id?: number;
  origin_country?: string;
  is_active?: boolean;
}

export interface IBrandStats {
  total_brands: number;
  active_brands: number;
  inactive_brands: number;
  total_products: number;
  total_sales: number;
}

export interface CreateBrandInput {
  name: string;
  code?: string;
  origin_country?: string;
  manufacturer?: string;
  is_active: boolean;
  branch_id?: number;
  image?: File | null;
}

export interface UpdateBrandInput extends CreateBrandInput {
  id: number;
}
