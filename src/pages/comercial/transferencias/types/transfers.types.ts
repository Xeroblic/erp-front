/**
 * Tipos específicos para el módulo de Transferencias
 * Basado en los casos de uso CU023 y CU024
 */

// Request interfaces
export interface ICreateTransferRequest {
    from_warehouse_id: number;
    to_warehouse_id: number;
    items: {
        product_id: number;
        quantity: number;
        from_location_id?: number;
        to_location_id?: number;
    }[];
    notes?: string;
    expected_date?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface IReceiveTransferRequest {
    transfer_id: number;
    items: {
        item_id: number;
        received_quantity: number;
        condition: 'GOOD' | 'DAMAGED' | 'MISSING';
        notes?: string;
    }[];
    received_date: string;
    notes?: string;
}

export interface ITransferFilters {
    status?: string;
    from_warehouse_id?: string;
    to_warehouse_id?: string;
    date_from?: string;
    date_to?: string;
    responsible_id?: string;
    search?: string;
}

export interface ITransferStats {
    total_transfers: number;
    pending_transfers: number;
    in_transit_transfers: number;
    completed_transfers: number;
    total_items_transferred: number;
    total_value_transferred: number;
}

export interface IWarehouseOption {
    id: number;
    name: string;
    code: string;
    address?: string;
    manager?: string;
}

export interface IProductStock {
    product_id: number;
    product_name: string;
    product_sku: string;
    warehouse_id: number;
    available_quantity: number;
    reserved_quantity: number;
    total_quantity: number;
    unit_cost?: number;
}

export interface ITransferItemForm {
    product_id: number;
    product_name: string;
    product_sku: string;
    quantity: number;
    available_quantity: number;
    from_location_id?: number;
    to_location_id?: number;
    unit_cost?: number;
}

export interface IReceiveTransferForm {
    items: {
        item_id: number;
        product_name: string;
        product_sku: string;
        quantity: number;
        received_quantity: number;
        condition: 'GOOD' | 'DAMAGED' | 'MISSING';
        notes?: string;
    }[];
    received_date: string;
    notes?: string;
}

export interface ICreateTransferForm {
    from_warehouse_id: number;
    to_warehouse_id: number;
    items: ITransferItemForm[];
    notes?: string;
    expected_date?: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface IReceiveTransferItemForm {
    transfer_item_id: number;
    product_name: string;
    product_sku: string;
    quantity_requested: number;
    quantity_received: number;
    to_location_id?: number;
    condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
    notes?: string;
}

export interface IReceiveTransferForm {
    items: {
        item_id: number;
        product_name: string;
        product_sku: string;
        quantity: number;
        received_quantity: number;
        condition: 'GOOD' | 'DAMAGED' | 'MISSING';
        notes?: string;
    }[];
    received_date: string;
    notes?: string;
}

export interface IMovementHistoryFilters {
    product_id?: number;
    warehouse_id?: number;
    movement_type?: 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ALL';
    date_from?: string;
    date_to?: string;
    responsible_id?: number;
}

export interface IMovementHistoryRecord {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    warehouse_id: number;
    warehouse_name: string;
    movement_type: 'TRANSFER_OUT' | 'TRANSFER_IN';
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    unit_cost?: number;
    total_cost?: number;
    transfer_id?: number;
    transfer_number?: string;
    responsible_id: number;
    responsible_name: string;
    notes?: string;
    created_at: string;
}
