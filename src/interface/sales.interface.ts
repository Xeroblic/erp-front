/**
 * Interfaces para el módulo de Ventas
 * Basado en los modelos del backend ERP P0
 */

import { ICustomer } from './customers.interface';
import { IProduct } from './products.interface';
import { IUser } from './users.interface';

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

    // Propiedades adicionales para compatibilidad
    payment_status?: string;
    invoice_number?: string;
    salesperson?: any;
    salesperson_id?: number;

    // Relaciones
    customer?: ICustomer;
    quote?: any; // IQuote (evitar dependencia circular)
    items?: ISaleItem[];
    payments?: IPayment[];
    creator?: IUser;
    deliverer?: IUser;

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
    product?: IProduct;

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
    creator?: IUser;
    confirmer?: IUser;
}

export type SaleStatus =
    | 'DRAFT'
    | 'CONFIRMED'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'INVOICED'
    | 'SHIPPED'
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
    [key: string]: unknown;
}

export interface IAddPaymentRequest {
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference?: string;
    notes?: string;
    [key: string]: unknown;
}

export interface IDeliverSaleRequest {
    items: Array<{
        sale_item_id: number;
        delivered_quantity: number;
    }>;
    delivery_date: string;
    [key: string]: unknown;
}

// Aliases para mantener compatibilidad con el slice
export type ISaleRequest = ICreateSaleRequest;
export type ISaleUpdateRequest = Partial<ICreateSaleRequest>;

// Response interfaces para API
export interface ISaleResponse {
    data: ISale;
    success?: boolean;
    message?: string;
}

export interface ISalesResponse {
    data: ISale[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    success?: boolean;
    message?: string;
}
