import { ICustomer } from './customers.interface';
import { ICustomerSale } from './customerSales.interface';
import { IProduct } from './products.interface';
import { IUser } from './users.interface';


export interface ISale {
    id: number;
    company_id: number;
    
    sale_number: string;
    wc_order_id: number;
    wc_order_number?: string;
    quote_id?: number;
    
    sale_date: string;
    delivery_date?: string;
    created_at: string;
    updated_at: string;

    status: SaleStatus;
    
    subtotal: string;
    discount_amount: string;
    discount_rate: string;
    tax_amount: string;
    shipping_amount: string;
    shipping_total?: string;
    total_amount: string;
    paid_amount: string;
    pending_amount: string;

    notes?: string;
    items_count?: number;
    
    documents_metadata?: {
        inventory_finalized: boolean;
    };
    billing_snapshot?: Record<string, unknown> | string | null;
    shipping_snapshot?: Record<string, unknown> | string | null;
    inventory_delivered: boolean;

    customer: ICustomerSale;
    creator?: IUser;
    items?: ISaleItem[];
    
    salesperson_id?: number;
    invoice_number?: string;
}

export interface ISaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    
    product_name: string;
    sku: string;
    
    attributes_description?: string; 

    quantity: number;
    price: number;
    total: number;
    
    serial_numbers?: string[];

    // Relaciones
    product?: IProduct;
}

export type SaleStatus =
    | 'draft'
    | 'pending'
    | 'on-hold'
    | 'confirmed'
    | 'processing'
    | 'paid'
    | 'completed' 
    | 'delivered' 
    | 'cancelled' 
    | 'refunded';

export type PaymentMethod =
    | 'CASH'
    | 'CARD'
    | 'TRANSFER'
    | 'CHECK'
    | 'OTHER';


export interface ICreateSaleRequest {
    customer_id: number;
    sale_date: string;
    notes?: string;
    items: Array<{
        product_id: number;
        quantity: number;
        price?: number;
    }>;
}

export interface ICloseSaleRequest {
    // Estructura para el endpoint POST /close
    items: Array<{
        sale_item_id: number;
        serial_numbers: string[];
    }>;
}


export interface ISaleResponse {
    data: ISale;
    success?: boolean;
    message?: string;
}

export interface ISalesResponse {
    data: ISale[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    // Soporte legacy si tu paginación viene en la raíz
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
}
