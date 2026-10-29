/**
 * Interfaces para el módulo de Productos
 * Basado en los modelos del backend ERP P0
 */

export interface IProduct {
	id: number;
	company_id: number;
	name: string;
	description?: string;
	sku: string;
	barcode?: string;
	category_id?: number;
	brand_id?: number;
	unit_of_measure: string;
	cost_price: number;
	selling_price: number;
	minimum_stock: number;
	maximum_stock?: number;
	current_stock: number;
	is_active: boolean;
	is_trackable: boolean;
	weight?: number;
	dimensions?: string;
	image_url?: string;
	created_at: string;
	updated_at: string;

	// Relaciones
	category?: ICategory;
	brand?: IBrand;
	supplier?: ISupplier;
	warehouse_stocks?: IWarehouseStock[];

	// Campos calculados
	total_stock?: number;
	stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
	profit_margin?: number;
}

export interface ICategory {
	id: number;
	company_id: number;
	name: string;
	description?: string;
	parent_id?: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;

	// Relaciones
	parent?: ICategory;
	children?: ICategory[];
	products?: IProduct[];

	// Campos calculados
	products_count?: number;
}

export interface IBrand {
	id: number;
	company_id: number;
	name: string;
	description?: string;
	logo_url?: string;
	website?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;

	// Relaciones
	products?: IProduct[];

	// Campos calculados
	products_count?: number;
}

export interface ISupplier {
	id: number;
	company_id: number;
	name: string;
	contact_person?: string;
	email?: string;
	phone?: string;
	address?: string;
	tax_number?: string;
	website?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;

	// Relaciones
	products?: IProduct[];

	// Campos calculados
	products_count?: number;
}

export interface IWarehouse {
	id: number;
	company_id: number;
	name: string;
	description?: string;
	address?: string;
	manager_name?: string;
	manager_phone?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;

	// Relaciones
	locations?: IWarehouseLocation[];
	stocks?: IWarehouseStock[];

	// Campos calculados
	locations_count?: number;
	total_products?: number;
}

export interface IWarehouseLocation {
	id: number;
	warehouse_id: number;
	name: string;
	description?: string;
	aisle?: string;
	shelf?: string;
	level?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;

	// Relaciones
	warehouse?: IWarehouse;
	stocks?: IWarehouseStock[];

	// Campos calculados
	products_count?: number;
}

export interface IWarehouseStock {
	id: number;
	warehouse_id: number;
	product_id: number;
	location_id?: number;
	quantity: number;
	reserved_quantity: number;
	minimum_quantity: number;
	last_updated: string;
	created_at: string;
	updated_at: string;

	// Relaciones
	warehouse?: IWarehouse;
	product?: IProduct;
	location?: IWarehouseLocation;

	// Campos calculados
	available_quantity?: number;
	stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

// Requests interfaces
export interface ICreateProductRequest {
	name: string;
	description?: string;
	sku: string;
	barcode?: string;
	category_id?: number;
	brand_id?: number;
	unit_of_measure: string;
	cost_price: number;
	selling_price: number;
	minimum_stock: number;
	maximum_stock?: number;
	current_stock: number;
	is_active?: boolean;
	is_trackable?: boolean;
	weight?: number;
	dimensions?: string;
	image_url?: string;
}

export interface IUpdateProductRequest extends Partial<ICreateProductRequest> {}

export interface ICreateCategoryRequest {
	name: string;
	description?: string;
	parent_id?: number;
	is_active?: boolean;
}

export interface IUpdateCategoryRequest extends Partial<ICreateCategoryRequest> {}

export interface ICreateBrandRequest {
	name: string;
	description?: string;
	logo_url?: string;
	website?: string;
	is_active?: boolean;
}

export interface IUpdateBrandRequest extends Partial<ICreateBrandRequest> {}

export interface ICreateSupplierRequest {
	name: string;
	contact_person?: string;
	email?: string;
	phone?: string;
	address?: string;
	tax_number?: string;
	website?: string;
	is_active?: boolean;
}

export interface IUpdateSupplierRequest extends Partial<ICreateSupplierRequest> {}

export interface ICreateWarehouseRequest {
	name: string;
	description?: string;
	address?: string;
	manager_name?: string;
	manager_phone?: string;
	is_active?: boolean;
}

export interface IUpdateWarehouseRequest extends Partial<ICreateWarehouseRequest> {}
