/**
 * Interfaces para el módulo de Cotizaciones
 * Basado en los modelos del backend ERP P0
 */

import { ICustomer } from './customers.interface';
import { IProduct } from './products.interface';
import { IUser } from './users.interface';
import { ISale } from './sales.interface';

export interface IQuote {
    id: number;
    company_id: number;
    quote_number: string;
    customer_id: number;
    quote_date: string;
    valid_until: string;
    status: QuoteStatus;
    subtotal: number;
    discount_amount: number;
    discount_percentage: number;
    tax_percentage: number;
    total_amount: number;
    notes?: string;
    created_by?: number;
    approved_by?: number;
    created_at: string;
    updated_at: string;

    // Campos CU025 - Gestión de Cotizaciones
    payment_method?: string; // Método de pago
    purchase_order?: string; // Orden de compra (OC)
    payment_terms?: number; // Términos de pago en días
    fixed_discount?: number; // Descuento fijo en valor absoluto

    // Relaciones
    customer?: ICustomer;
    items?: IQuoteItem[];
    creator?: IUser;
    approver?: IUser;
    converted_sale?: ISale;

    // Campos calculados
    items_count?: number;
    days_until_expiry?: number;
    is_expired?: boolean;
    can_convert?: boolean;
}

export interface IQuoteItem {
    id: number;
    quote_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    subtotal: number;
    total: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    quote?: IQuote;
    product?: IProduct;

    // Campos calculados
    unit_discount?: number;
    unit_total?: number;
}

export type QuoteStatus =
    | 'DRAFT'
    | 'SENT'
    | 'APPROVED'
    | 'REJECTED'
    | 'CONVERTED'
    | 'EXPIRED'
    // Estados específicos CU025
    | 'ACCEPTED' // Aceptada
    | 'WAITING' // En espera  
    | 'CREDIT_30' // Crédito a 30 días
    | 'PAID'; // Pagada

export interface ICreateQuoteRequest {
    customer_id: number;
    quote_date: string;
    valid_until: string;
    discount_percentage?: number;
    tax_percentage?: number;
    notes?: string;
    items: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        discount_percentage?: number;
    }>;
    [key: string]: unknown; // Añadir signatura de índice

}

export interface IUpdateQuoteRequest {
    customer_id?: number;
    quote_date?: string;
    valid_until?: string;
    discount_percentage?: number;
    tax_percentage?: number;
    notes?: string;
    items?: Array<{
        id?: number;
        product_id: number;
        quantity: number;
        unit_price: number;
        discount_percentage?: number;
    }>;
    [key: string]: unknown;
}

export interface IConvertQuoteRequest {
    sale_date?: string;
    delivery_date?: string;
    [key: string]: unknown;
}
