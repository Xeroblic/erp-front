/**
 * Interfaces para el módulo de Inventario
 * Basado en los servicios del backend ERP P0
 */
import type { IUser } from '@/interface/users.interface';

export interface IInventoryMovement {
	id: number;
	company_id: number;
	movement_number: string;
	movement_type: MovementType;
	scope: MovementScope;
	product_id?: number;
	inventory_item_id?: number;
	warehouse_location_id?: number;
	quantity?: number;
	reference_type?: string;
	reference_id?: number;
	notes?: string;
	performed_by?: number;
	performed_at: string;
	idempotency_key?: string;
	created_at: string;

	// Propiedades adicionales para compatibilidad con páginas
	warehouse_id?: number;
	warehouse?: any;
	movement_date?: string;
	previous_stock?: number;
	new_stock?: number;

	// Relaciones
	product?: any; // IProduct
	inventory_item?: IInventoryItem;
	warehouse_location?: any; // IWarehouseLocation
	performer?: IUser;

	// Campos calculados
	movement_direction?: 'IN' | 'OUT';
	formatted_quantity?: string;
}

export interface IInventoryItem {
	id: number;
	company_id: number;
	product_id: number;
	serial_number?: string;
	condition_grade: ConditionGrade;
	lifecycle_state: LifecycleState;
	warehouse_location_id?: number;
	is_reserved: boolean;
	created_at: string;
	updated_at: string;

	// Propiedades adicionales para compatibilidad
	warehouse_id?: number;
	warehouse?: any;
	current_stock?: number;
	available_stock?: number;
	reserved_stock?: number;
	min_stock?: number;
	max_stock?: number;
	last_updated?: string;

	// Relaciones
	product?: any; // IProduct
	location?: any; // IWarehouseLocation
	reservation?: IReservationBucket;
}

export interface IStockLevel {
	id: number;
	company_id: number;
	product_id: number;
	warehouse_location_id: number;
	quantity: number;
	reserved_quantity: number;
	available_quantity: number;
	updated_at: string;

	// Relaciones
	product?: any; // IProduct
	location?: any; // IWarehouseLocation
}

export interface IReservationBucket {
	id: number;
	company_id: number;
	branch_id: number;
	scope: MovementScope;
	product_id?: number;
	inventory_item_id?: number;
	warehouse_location_id?: number;
	quantity?: number;
	reference_type: string;
	reference_id: number;
	expires_at?: string;
	is_active: boolean;
	created_by?: number;
	released_by?: number;
	created_at: string;
	updated_at: string;

	// Relaciones
	product?: any; // IProduct
	inventory_item?: IInventoryItem;
	location?: any; // IWarehouseLocation
	creator?: IUser;
	releaser?: IUser;

	// Campos calculados
	is_expired?: boolean;
	days_until_expiry?: number;
}

export type MovementType =
	| 'IN'
	| 'OUT'
	| 'ADJUST'
	| 'ADJUSTMENT'
	| 'TRANSFER'
	| 'TRANSFER_OUT'
	| 'TRANSFER_IN'
	| 'RESERVE'
	| 'RELEASE'
	| 'CONSUME'
	| 'PRODUCE'
	| 'PRODUCTION'
	| 'RETURN';

export type MovementScope = 'BIN' | 'ITEM';

export type ConditionGrade = 'A' | 'B' | 'C' | 'M';

export type LifecycleState = 'AS_RECEIVED' | 'REVIEWED' | 'COMMERCIAL';

// Requests para operaciones de inventario
export interface IAdjustBinRequest {
	product_id: number;
	warehouse_location_id: number;
	quantity: number;
	notes?: string;
	idempotency_key?: string;
}

export interface IReserveBinRequest {
	product_id: number;
	warehouse_location_id: number;
	quantity: number;
	reference_type: string;
	reference_id: number;
	expires_at?: string;
	idempotency_key?: string;
}

export interface IReserveItemRequest {
	inventory_item_id: number;
	reference_type: string;
	reference_id: number;
	expires_at?: string;
	idempotency_key?: string;
}

export interface IOutBinRequest {
	product_id: number;
	warehouse_location_id: number;
	quantity: number;
	reference_type?: string;
	reference_id?: number;
	notes?: string;
	idempotency_key?: string;
}

export interface IOutItemRequest {
	inventory_item_id: number;
	reference_type?: string;
	reference_id?: number;
	notes?: string;
	idempotency_key?: string;
}

// Dashboard y reportes
export interface IInventoryDashboard {
	total_products: number;
	total_locations: number;
	total_stock_value: number;
	low_stock_alerts: number;
	recent_movements: IInventoryMovement[];
	top_products_by_movement: Array<{
		product: any; // IProduct
		movement_count: number;
		total_quantity: number;
	}>;
	stock_by_warehouse: Array<{
		warehouse: any; // IWarehouse
		total_products: number;
		total_quantity: number;
		stock_value: number;
	}>;
}

export interface IInventoryReport {
	product_id: number;
	product_name: string;
	total_in: number;
	total_out: number;
	current_stock: number;
	reserved_stock: number;
	available_stock: number;
	locations: Array<{
		location: any; // IWarehouseLocation
		quantity: number;
		reserved_quantity: number;
	}>;
}

// Interfaces adicionales para compatibilidad con las páginas
export interface IStockAlert {
	id: number;
	product_id: number;
	product?: any;
	warehouse_id?: number;
	warehouse?: any;
	alert_type: 'LOW' | 'OUT' | 'OVERSTOCK';
	alert_level: string; // Agregado para compatibilidad
	current_stock: number;
	threshold: number;
	min_stock?: number; // Agregado para compatibilidad
	message: string;
	is_resolved: boolean;
	created_at: string;
	updated_at: string;
}

export interface IStockLevel {
	id: number;
	product_id: number;
	product?: any;
	warehouse_id?: number;
	warehouse?: any;
	current_stock?: number;
	min_stock?: number;
	max_stock?: number;
	reorder_point?: number;
	created_at: string;
	updated_at: string;
}

// Requests
export interface IInventoryRequest {
	product_id: number;
	warehouse_id: number;
	movement_type: MovementType;
	quantity: number;
	reference_type?: string;
	reference_id?: number;
	notes?: string;
	[key: string]: unknown;
}

export interface IInventoryUpdateRequest {
	product_id?: number;
	warehouse_id?: number;
	movement_type?: MovementType;
	quantity?: number;
	reference_type?: string;
	reference_id?: number;
	notes?: string;
	[key: string]: unknown;
}

// Response interfaces for API
export interface IInventoryResponse {
	data: IInventoryMovement[];
	current_page: number;
	last_page: number;
	total: number;
	per_page: number;
}

export interface IInventoryItemResponse {
	data: IInventoryItem[];
	current_page: number;
	last_page: number;
	total: number;
	per_page: number;
}
