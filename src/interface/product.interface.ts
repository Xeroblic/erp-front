export type ProductType =
	| 'general'
	| 'desktop_pc'
	| 'notebook'
	| 'aio'
	| 'monitor'
	| 'docking'
	| string;
export type ProductConditionPolicy = 'NEW' | 'USED' | 'REFURBISHED' | 'DAMAGED' | string;
export type ProductStatus = 'pending' | 'validated' | 'rejected' | 'archived' | string;
export type EquipmentGradeLiteral = 'A' | 'B' | 'C' | 'M';
export type DecimalString = string;
export type ISODateTimeString = string;
export type NullableJson = Record<string, unknown> | null;

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

export interface IProductImage {
	id?: number | null;
	url: string;
	thumb?: string | null;
	alt?: string | null;
}

export interface IProductGalleryImage extends IProductImage {
	sort?: number | null;
}

export interface IProductChildStockStatus {
	available?: number;
	on_hold?: number;
	reserved?: number;
	in_quotation?: number;
	sold?: number;
	total_approved?: number;
	[key: string]: number | undefined;
}

export interface IProductParentSummary {
	id: number;
	sku: string;
	name: string;
}

export interface IProductChild {
	id: number;
	grade?: EquipmentGradeLiteral | null;
	sku: string;
	name: string;
	price?: number | string | null;
	offer_price?: number | string | null;
	stock?: number | null;
	stock_by_status?: IProductChildStockStatus | null;
	marketplace_external_ids?: Record<string, string | number> | null;
}

export interface IProduct {
	id: number;
	/**
	 * Sucursal consultada en el endpoint actual (contexto de lectura).
	 * Ya no representa necesariamente la sucursal creadora.
	 */
	branch_id: number;
	/**
	 * Sucursal de origen/creacion del producto en backend (si viene en payload).
	 */
	origin_branch_id?: number | null;
	subsidiary_id?: number | null;
	parent_product_id?: number | null;
	is_parent?: boolean;
	is_child?: boolean;
	image?: IProductImage | null;
	gallery?: Array<IProductGalleryImage> | null;
	product_status: ProductStatus;
	sku: string;
	commercial_sku?: string | null;
	barcode?: string | null;
	name: string;
	grade?: EquipmentGradeLiteral | null;
	brand_id?: number | null;
	brand?: IProductBrandSummary | null;
	product_type?: ProductType | null;
	condition_policy?: ProductConditionPolicy | null;
	serial_tracking: boolean;
	uom?: string | null;
	warranty_months?: number | null;
	cost?: number | null;
	price: number;
	price_override?: number | null;
	offer_price_override?: number | null;
	global_price?: number | null;
	offer_price?: number | null;
	attributes_json?: Record<string, unknown> | null;
	marketplace_external_ids?: NullableJson;
	is_active: boolean;
	snippet_description?: string | null;
	short_description?: string | null;
	long_description?: string | null;
	stock?: number | null;
	stock_by_status?: IProductChildStockStatus | null;
	categories?: IProductCategorySummary[];
	children?: IProductChild[] | null;
	parent?: IProductParentSummary;
	available_serials?: string[] | null;
	created_at: string;
	updated_at: string;
	brand_name?: string | null;
}

// ---------------------------------------------------------------------------
// API Resource contracts (backend payload shape before front normalization)
// ---------------------------------------------------------------------------
export interface ProductSerialStockByStatus {
	available: number;
	on_hold: number;
	reserved: number;
	in_quotation: number;
	sold: number;
	total_approved: number;
}

export interface ProductImage {
	id: number;
	url: string;
	thumb: string;
	alt: string | null;
}

export interface ProductGalleryImage extends ProductImage {
	sort: number;
}

export interface ProductBrandSummary {
	id: number;
	name: string;
	slug: string | null;
}

export interface ProductCategorySummary {
	id: number;
	name: string;
	slug: string | null;
}

export interface ProductParentSummary {
	id: number;
	sku: string;
	name: string;
}

export interface ProductChildSummary {
	id: number;
	grade: EquipmentGradeLiteral | null;
	sku: string;
	name: string;
	marketplace_external_ids: NullableJson;
	price: DecimalString;
	offer_price: DecimalString | null;
	stock: number;
	stock_by_status: ProductSerialStockByStatus;
}

export interface ProductResourcePayload {
	id: number;
	/**
	 * Sucursal consultada en la respuesta del endpoint.
	 */
	branch_id: number | null;
	/**
	 * Sucursal de origen/creacion real del producto.
	 */
	origin_branch_id?: number | null;
	parent_product_id: number | null;
	is_parent?: boolean;
	is_child?: boolean;
	sku: string;
	commercial_sku: string | null;
	barcode: string | null;
	name: string;
	grade: EquipmentGradeLiteral | null;
	brand?: ProductBrandSummary;
	product_type: string | null;
	warranty_months: number;
	serial_tracking: boolean;
	short_description: string | null;
	long_description: string | null;
	snippet_description: string | null;
	stock: number;
	cost: DecimalString;
	price: DecimalString;
	price_override?: DecimalString | null;
	offer_price_override?: DecimalString | null;
	global_price?: DecimalString | null;
	offer_price: DecimalString | null;
	product_status: string | null;
	attributes_json: NullableJson;
	marketplace_external_ids: NullableJson;
	is_active: boolean;
	category_ids?: ProductCategorySummary[];
	image: ProductImage | null;
	gallery: ProductGalleryImage[];
	stock_by_status?: ProductSerialStockByStatus;
	parent?: ProductParentSummary;
	children?: ProductChildSummary[];
	available_serials?: string[] | null;
	created_at: ISODateTimeString;
	updated_at: ISODateTimeString;
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
	product_status?: ProductStatus;
	product_type?: ProductType;
	serial_tracking?: boolean;
	min_price?: number;
	max_price?: number;
	order_by?: string;
	order_dir?: 'asc' | 'desc';
	// attribute filters (optional)
	attributes?: Record<string, string | number | boolean>;
	attributes_like?: Record<string, string | number>;
	attributes_any_like?: string | number;
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
	branchId?: number | null;
}

export interface CreateProductPayload {
	sku: string;
	commercial_sku?: string | null;
	barcode?: string | null;
	name: string;
	brand_id: number;
	condition_policy?: ProductConditionPolicy | null;
	serial_tracking: boolean;
	uom?: string | null;
	warranty_months?: number | null;
	cost?: number | null;
	price: number;
	offer_price?: number | null;
	attributes_json?: Record<string, unknown> | null;
	is_active: boolean;
	product_status?: ProductStatus;
	product_type?: ProductType | null;
	category_ids: number[];
	snippet_description?: string | null;
	short_description?: string | null;
	long_description?: string | null;
	stock?: number | null;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
	id: number;
	branch_id?: number;
}

export interface ProductInventoryCriticalProduct {
	id: number;
	name: string;
	sku: string;
	brand_name?: string | null;
	stock?: number | null;
}

export interface ProductInventorySummaryResponse {
	branch_id: number;
	params?: {
		critical_threshold?: number;
	};
	summary?: {
		products_total?: number;
		active?: number;
		inactive?: number;
		with_offer?: number;
		with_serial_tracking?: number;
		stock_total?: number;
		synced_products?: number;
		stock_average?: number;
		serial_tracking_count?: number;
		low_stock_count?: number;
		out_of_stock?: number;
		with_stock_available?: number;
	};
	critical_products?: ProductInventoryCriticalProduct[];
}

export interface ProductInventorySummary {
	branchId: number | null;
	criticalThreshold: number;
	stockTotal: number;
	stockAverage: number;
	lowStockCount: number;
	outOfStock: number;
	withStockAvailable: number;
	syncedProducts: number;
	serialTrackingCount: number;
}

// ---------------------------------------------------------------------------
// Strict API Responses for Thunks (@Full_TS)
// ---------------------------------------------------------------------------
export interface IProductResponse {
	data: IProduct;
}

export interface IProductListResponse {
	data: IProduct[];
	meta: Partial<ProductListMeta> & Record<string, unknown>;
}

export interface IProductAttributesResponse {
	attributes?: Record<string, unknown> | null;
}

export interface IMediaUploadResponse {
	data?: {
		url?: string;
		[key: string]: unknown;
	};
}

export interface ILibraryMediaItem {
	id: number;
	url: string;
	thumb_url?: string;
	name?: string;
	[key: string]: unknown;
}

export interface ILibraryMediaResponse {
	data?: ILibraryMediaItem[];
	meta?: unknown;
}

export interface ILibraryMediaAttachResponse {
	status?: string;
	id?: number;
	url?: string;
	thumb_url?: string;
}

