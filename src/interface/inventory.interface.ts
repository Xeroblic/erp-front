/**
 * Interfaces para el módulo de Inventario
 * Basado en los servicios del backend ERP P0
 */

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

    // Relaciones
    product?: any; // IProduct
    inventory_item?: IInventoryItem;
    warehouse_location?: any; // IWarehouseLocation
    performer?: any; // IUser

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
    creator?: any; // IUser
    releaser?: any; // IUser

    // Campos calculados
    is_expired?: boolean;
    days_until_expiry?: number;
}

export type MovementType =
    | 'IN'
    | 'OUT'
    | 'ADJUST'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'RESERVE'
    | 'RELEASE'
    | 'CONSUME'
    | 'PRODUCE';

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
