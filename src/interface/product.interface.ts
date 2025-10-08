export type ProductType = 'NOTEBOOK' | 'DESKTOP' | 'GENERAL' | string;
export type ProductConditionPolicy = 'NEW' | 'USED' | 'REFURBISHED' | 'DAMAGED' | string;

export interface IProductBrandSummary {
	id: number;
	name: string;
	slug?: string | null;
}

export interface IProductCategorySummary {
	id: number;
	name: string;
	slug?: string | null;
}

export interface IProduct {
	id: number;
	branch_id: number;
	sku: string;
	commercial_sku?: string | null;
	barcode?: string | null;
	name: string;
	brand_id?: number | null;
	brand?: IProductBrandSummary | null;
	product_type?: ProductType | null;
	condition_policy?: ProductConditionPolicy | null;
	serial_tracking: boolean;
	uom?: string | null;
	warranty_months?: number | null;
	cost?: number | null;
	price: number;
	offer_price?: number | null;
	attributes_json?: Record<string, unknown> | null;
	is_active: boolean;
	categories?: IProductCategorySummary[];
	created_at: string;
	updated_at: string;
}

export interface ProductListMeta {
	total: number;
	current_page: number;
	per_page: number;
	last_page: number;
}

export interface ProductFilters {
	search?: string;
	brand_id?: number;
	category_id?: number;
	is_active?: boolean;
	product_type?: ProductType;
	serial_tracking?: boolean;
	min_price?: number;
	max_price?: number;
	order_by?: string;
	order_dir?: 'asc' | 'desc';
}

export interface ProductsStateStats {
	total: number;
	actives: number;
	inactives: number;
	with_offer: number;
	serial_tracked: number;
}

export interface FetchProductsParams extends ProductFilters {
	page?: number;
	per_page?: number;
}

export interface CreateProductPayload {
	sku: string;
	commercial_sku?: string | null;
	barcode?: string | null;
	name: string;
	brand_id: number;
	product_type?: ProductType | null;
	condition_policy?: ProductConditionPolicy | null;
	serial_tracking: boolean;
	uom?: string | null;
	warranty_months?: number | null;
	cost?: number | null;
	price: number;
	offer_price?: number | null;
	attributes_json?: Record<string, unknown> | null;
	is_active: boolean;
	category_ids: number[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
	id: number;
	branch_id?: number;
}

