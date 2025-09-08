/**
 * Interfaces para el módulo de Ventas
 * Basado en los modelos del backend ERP P0
 */

export interface ISale {
    id: number;
    company_id: number;
    sale_number: string;
    customer_id: number;
    quote_id?: number;
    sale_date: string;
    delivery_date?: string;
    status: SaleStatus;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    notes?: string;
    created_by?: number;
    delivered_by?: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    customer?: any; // ICustomer
    quote?: any; // IQuote
    items?: ISaleItem[];
    payments?: IPayment[];
    creator?: any; // IUser
    deliverer?: any; // IUser

    // Campos calculados
    items_count?: number;
    payments_count?: number;
    is_fully_paid?: boolean;
    is_delivered?: boolean;
    delivery_progress?: number;
}

export interface ISaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: number;
    delivered_quantity: number;
    unit_price: number;
    discount_percentage: number;
    subtotal: number;
    total: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    sale?: ISale;
    product?: any; // IProduct

    // Campos calculados
    pending_quantity?: number;
    delivery_percentage?: number;
    unit_discount?: number;
    unit_total?: number;
}

export interface IPayment {
    id: number;
    sale_id: number;
    payment_number: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    status: PaymentStatus;
    reference?: string;
    notes?: string;
    created_by?: number;
    confirmed_by?: number;
    confirmed_at?: string;
    created_at: string;
    updated_at: string;

    // Relaciones
    sale?: ISale;
    creator?: any; // IUser
    confirmer?: any; // IUser
}

export type SaleStatus =
    | 'DRAFT'
    | 'CONFIRMED'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';

export type PaymentStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'REFUNDED';

export type PaymentMethod =
    | 'CASH'
    | 'CARD'
    | 'TRANSFER'
    | 'CHECK'
    | 'OTHER';

export interface ICreateSaleRequest {
    customer_id: number;
    quote_id?: number;
    sale_date: string;
    delivery_date?: string;
    discount_percentage?: number;
    tax_percentage?: number;
    notes?: string;
    items: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        discount_percentage?: number;
    }>;
}

export interface IAddPaymentRequest {
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference?: string;
    notes?: string;
}

export interface IDeliverSaleRequest {
    items: Array<{
        sale_item_id: number;
        delivered_quantity: number;
    }>;
    delivery_date: string;
}
