export interface IWarehouse {
    id: number;
    company_id: number;
    code: string;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    postal_code: string;
    phone: string;
    email: string;
    manager_name: string;
    manager_phone: string;
    warehouse_type: 'CENTRAL' | 'SUCURSAL' | 'DISTRIBUCION' | 'TEMPORAL';
    max_capacity: number;
    current_capacity: number;
    is_active: boolean;
    has_climate_control: boolean;
    has_security_system: boolean;
    has_loading_dock?: boolean;
    operating_hours: string;
    created_at: string;
    updated_at: string;
    products_count: number;
    total_value: number;
}

export interface IWarehouseFilters {
    search: string;
    warehouse_type?: string;
    city?: string;
    is_active?: boolean;
    has_climate_control?: boolean;
}

export interface IWarehouseStats {
    total_warehouses: number;
    active_warehouses: number;
    total_capacity: number;
    used_capacity: number;
    total_products: number;
    total_value: number;
}
