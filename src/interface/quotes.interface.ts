import type { ICustomer } from './customers.interface';
import type { IProduct } from './products.interface';

type QuoteStatusLower = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted' | 'expired';

export type QuoteStatus = QuoteStatusLower | Uppercase<QuoteStatusLower>;

export interface QuoteCustomerSummary {
	id: number;
	name: string;
	rut?: string | null;
	email?: string | null;
	billing_company?: string | null;
	contact_name?: string | null;
	default_document_type?: string | null;
	address?: string | null;
	phone?: string | null;
}

export interface QuoteItem {
	id: number;
	quote_id: number;
	product_id?: number | null;
	quantity: number;
	unit_price: number; // NETO
	total_net?: number;
	customer_sku?: string | null;
	customer_name?: string | null;
	description?: string | null;
	notes?: string | null;
	discount_amount?: number | null;
	discount_percentage?: number | null;
	product?: Pick<IProduct, 'id' | 'name' | 'sku'> | null;
	metadata?: Record<string, any>;
	terms_conditions?: Record<string, any>;
	created_at?: string;
	updated_at?: string;
}

export interface QuoteTotals {
	total_net: number;
	tax_rate: number;
	tax_amount: number;
	grand_total: number;
	shipping_net?: number | null;
}

export interface Quote {
	id: number;
	subsidiary_id: number;
	customer_id: number;
	quote_number?: string | null;
	quote_date: string;
	expiry_date: string;
	valid_until?: string | null;
	status: QuoteStatus;
	tax_rate: number;
	notes?: string | null;
	internal_notes?: string | null;
	payment_method?: string | null;
	purchase_order?: string | null;
	payment_terms?: number | null;
	fixed_discount?: number | null;
	total_net?: number | string;
	total_tax?: number | string;
	total_amount?: number | string;
	subtotal?: number | string;
	tax_amount?: number | string;
	discount_amount?: number | string;
	discount_percentage?: number | string;
	tax_percentage?: number | string;
	created_at?: string;
	updated_at?: string;
	created_by?: number | null;
	approved_by?: number | null;
	customer?: QuoteCustomerSummary | ICustomer | null;
	items?: QuoteItem[];
	totals?: QuoteTotals;
	metadata?: Record<string, any>;
	terms_conditions?: Record<string, any> | null;
	can_convert?: boolean;
	items_count?: number;
	is_converted_to_sale?: boolean;
	converted_at?: string | null;
	salesperson_id?: number | null;
}

export interface QuotePDFResponse {
	quote_id: number;
	storage_relative: string;
	url?: string;
}

export interface QuoteItemDTO {
    [key: string]: unknown;
    id?: number;
    product_id?: number | null;
    customer_name?: string | null;
    customer_sku?: string | null;
    description?: string | null;
    notes?: string | null;
    quantity: number;
    unit_price?: number;
    discount_amount?: number | null;
    metadata?: Record<string, any>;
}


export interface QuoteCreateDTO {
	[key: string]: unknown;
	customer_id: number;
	quote_number?: string | null;
	quote_date: string;
	expiry_date: string;
	tax_rate: number;
	notes?: string | null;
	internal_notes?: string | null;
	payment_method?: string | null;
	purchase_order?: string | null;
	payment_terms?: number | null;
	fixed_discount?: number | null;
	discount_percentage?: number | null;
	status?: QuoteStatus;
}

export interface QuoteUpdateDTO extends Partial<QuoteCreateDTO> {
	[key: string]: unknown;
	status?: QuoteStatus;
}

export interface QuoteListMeta {
	total: number;
	current_page: number;
	per_page: number;
	last_page: number;
}

// Aliases para compatibilidad con código existente
export type IQuote = Quote;
export type IQuoteItem = QuoteItem;
export type ICreateQuoteRequest = QuoteCreateDTO;
export type IUpdateQuoteRequest = QuoteUpdateDTO;
export type IConvertQuoteRequest = Record<string, any>;
