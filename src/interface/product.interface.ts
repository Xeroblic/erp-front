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

/** Visibilidad de un producto dentro de un canal/marketplace. */
export type ChannelVisibility = 'publish' | 'private';

/**
 * Override de un producto para una integración/canal concreto (WooCommerce,
 * Falabella, etc.). Cada canal mantiene su propio precio, nombre y visibilidad;
 * los campos `effective_*` resuelven override → valor base del producto.
 */
export interface ProductChannelPrice {
	integration_id: string;
	channel: string | null;
	channel_name: string | null;
	name_override?: string | null;
	visibility?: ChannelVisibility | null;
	price_override: DecimalString | null;
	offer_price_override: DecimalString | null;
	effective_price: DecimalString | null;
	effective_offer_price: DecimalString | null;
}

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

/**
 * Detalle de una retención temporal (soft-hold) asociada a una venta en proceso.
 * Sólo viene en el endpoint de detalle (`/products/{id}`).
 */
export interface IProductSoftHold {
	sale_id: number;
	sale_number: string | null;
	wc_order_number: string | null;
	channel: string | null;
	quantity: number;
	status: string | null;
	sale_status: string | null;
}

/**
 * Unidades apartadas temporalmente por ventas en proceso. El campo `stock`
 * del producto ya viene descontado por estas retenciones, así que esto es
 * meramente informativo. Sólo es relevante para productos no serializados y
 * para productos hijos (variantes por grado).
 */
export interface IProductSoftHolds {
	quantity: number;
	pending_sales_count: number;
	web: number;
	manual: number;
	holds?: IProductSoftHold[];
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
	soft_holds?: IProductSoftHolds | null;
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
	/** Overrides por canal/marketplace (precio, nombre y visibilidad). */
	channel_prices?: ProductChannelPrice[] | null;
	/** Si el stock del producto se sincroniza con WooCommerce. */
	sync_stock_with_woo?: boolean;
	is_active: boolean;
	snippet_description?: string | null;
	short_description?: string | null;
	long_description?: string | null;
	stock?: number | null;
	stock_by_status?: IProductChildStockStatus | null;
	soft_holds?: IProductSoftHolds | null;
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
	channel_prices?: ProductChannelPrice[] | null;
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
	branch_id?: number;
	subsidiary_id?: number;
	params?: {
		critical_threshold?: number;
	};
	summary?: {
		products_total?: number;
		total_children_products?: number;
		products_total_all?: number;
		active?: number;
		inactive?: number;
		with_offer?: number;
		with_serial_tracking?: number;
		without_serial_tracking?: number;
		stock_total?: number;
		stock_without_serials?: number;
		synced_products?: number;
		stock_average?: number;
		serial_tracking_count?: number;
		low_stock_count?: number;
		out_of_stock?: number;
		with_stock_available?: number;
		serials_available?: number;
		serials_on_hold?: number;
		serials_reserved?: number;
		serials_in_quotation?: number;
		serials_sold?: number;
		serials_total_approved?: number;
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
	// Campos ampliados de la API
	productsTotal: number;
	totalChildrenProducts: number;
	productsTotalAll: number;
	withoutSerialTracking: number;
	stockWithoutSerials: number;
	serialsAvailable: number;
	serialsOnHold: number;
	serialsReserved: number;
	serialsInQuotation: number;
	serialsSold: number;
	serialsTotalApproved: number;
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

