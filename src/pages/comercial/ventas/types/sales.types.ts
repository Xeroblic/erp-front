/**
 * Interfaces para el módulo de Ventas
 */

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER';
export type DocumentType = 'BOLETA' | 'FACTURA';

export interface ISaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    discount_amount: number;
    tax_percentage: number;
    tax_amount: number;
    subtotal: number;
    total: number;
}

export interface ISalePayment {
    id: number;
    sale_id: number;
    payment_method: PaymentMethod;
    amount: number;
    fee_percentage?: number;
    fee_amount?: number;
    reference?: string;
    payment_date: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface ISaleDocument {
    id: number;
    sale_id: number;
    document_type: DocumentType;
    document_number: string;
    file_path?: string;
    generated_at: string;
    sent_at?: string;
    sent_to?: string;
}

export interface IStockMovement {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: number;
    movement_type: 'OUT';
    movement_date: string;
    notes?: string;
}

export interface ISale {
    id: number;
    sale_number: string;
    quotation_id?: number; // Si viene de cotización
    customer_id: number;
    customer?: {
        id: number;
        first_name?: string;
        last_name?: string;
        company_name?: string;
        email?: string;
        phone?: string;
        tax_id?: string;
    };
    salesperson_id: number;
    salesperson?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    sale_date: string;
    status: SaleStatus;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    total_amount: number;
    notes?: string;

    // Relaciones
    items: ISaleItem[];
    payments: ISalePayment[];
    documents: ISaleDocument[];
    stock_movements: IStockMovement[];

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface SalesFilters {
    search?: string;
    status?: SaleStatus;
    customer_id?: number;
    salesperson_id?: number;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    payment_status?: 'PENDING' | 'PARTIAL' | 'COMPLETE';
}

export interface SalesStats {
    total: number;
    byStatus: Record<SaleStatus, number>;
    totalAmount: number;
    averageAmount: number;
    pendingPayments: number;
}
