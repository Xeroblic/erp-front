// ==================== Interfaces Principales ====================

export interface IWarehouse {
	id: number;
	name: string;
	code: string;
	branch_id: number;
	branch_name?: string;
	warehouse_type: string;
	description?: string;
	maximum_capacity: number | null;
	current_capacity?: number;
	available_capacity?: number;
	is_active: boolean;
	manager_id?: number | null;
	manager_name?: string | null;
	address?: string | null;
	commune_id?: number | null;
	commune_name?: string | null;
	schedule?: string | null;
	requires_serial_tracking: boolean;
	created_at?: string;
	updated_at?: string;

	// Relaciones
	products?: IWarehouseProduct[];
}

export interface IWarehouseProduct {
	id: number;
	sku: string;
	name: string;
	brand_name?: string | null;
	quantity: number;
	sync_stock: boolean;
	price?: string | null;
	cost?: string | null;
}

export interface IWarehouseDetail extends IWarehouse {
	products: IWarehouseProduct[];
}

// ==================== Request Payloads ====================

export interface ICreateWarehouseRequest {
	name: string;
	code: string;
	warehouse_type: string;
	description?: string;
	maximum_capacity?: number | null;
	manager_id?: number | null;
	address?: string | null;
	commune_id?: number | null;
	schedule?: string | null;
	is_active?: boolean;
	requires_serial_tracking?: boolean;
}

export interface IUpdateWarehouseRequest extends Partial<ICreateWarehouseRequest> {}

export interface IAttachProductRequest {
	product_id: number | number[];
	quantity?: number | number[] | null;
	sync_stock?: boolean | boolean[];
}

export interface IDetachProductRequest {
	product_id: number;
}

// ==================== Response Types ====================

export interface IWarehouseListResponse {
	data: IWarehouse[];
	meta: IWarehouseListMeta;
}

export interface IWarehouseListMeta {
	total: number;
	current_page: number;
	per_page: number;
	last_page: number;
}

export interface IWarehouseDetailResponse {
	data: IWarehouseDetail;
}

// ==================== Fetch Params ====================

export interface IFetchWarehousesParams {
	page?: number;
	per_page?: number;
	q?: string;
	warehouse_type?: string;
	is_active?: boolean;
}

// ==================== Statistics ====================

export interface IWarehouseStats {
	total: number;
	actives: number;
	inactives: number;
	with_products: number;
	empty: number;
	near_capacity: number;
}

// ==================== Error Types ====================

export interface IWarehouseError {
	message: string;
	error?: string;
	products_count?: number;
	errors?: Record<string, string[]>;
}

// ==================== Validation ====================

export interface IWarehouseValidation {
	name?: string;
	code?: string;
	warehouse_type?: string;
	maximum_capacity?: string;
	quantity?: string;
	product_id?: string;
}

// ==================== UI State ====================

export interface IWarehouseFormData extends Partial<IWarehouse> {
	categoryIds?: number[];
}

export interface IAttachProductFormData {
	product_id: number;
	modo: 'manual' | 'sincronizar';
	quantity?: number;
	sync_stock: boolean;
	stock_actual?: number;
}
