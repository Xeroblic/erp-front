/**
 * Interfaces para el módulo de Transferencias
 * Basado en los modelos del backend ERP P0
 */

export interface ITransfer {
    id: number;
    company_id: number;
    transfer_number: string;
    from_warehouse_id: number;
    to_warehouse_id: number;
    status: TransferStatus;
    requested_at?: string;
    shipped_at?: string;
    received_at?: string;
    completed_at?: string;
    created_by?: number;
    shipped_by?: number;
    received_by?: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    from_warehouse?: IWarehouse;
    to_warehouse?: IWarehouse;
    items?: ITransferItem[];
    creator?: IUser;
    shipper?: IUser;
    receiver?: IUser;

    // Campos calculados
    items_count?: number;
    total_quantity?: number;
    received_quantity?: number;
    completion_percentage?: number;
}

export interface ITransferItem {
    id: number;
    transfer_id: number;
    product_id: number;
    from_location_id?: number;
    to_location_id?: number;
    quantity: number;
    received_quantity: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    transfer?: ITransfer;
    product?: IProduct;
    from_location?: IWarehouseLocation;
    to_location?: IWarehouseLocation;

    // Campos calculados
    pending_quantity?: number;
    completion_percentage?: number;
}

export type TransferStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'SHIPPED'
    | 'PARTIALLY_RECEIVED'
    | 'COMPLETED'
    | 'CANCELLED';

export interface ICreateTransferRequest {
    from_warehouse_id: number;
    to_warehouse_id: number;
    items: Array<{
        product_id: number;
        quantity: number;
        from_location_id?: number;
        to_location_id?: number;
    }>;
}

export interface IReceiveTransferRequest {
    items: Array<{
        transfer_item_id: number;
        received_quantity: number;
        to_location_id?: number;
    }>;
}
