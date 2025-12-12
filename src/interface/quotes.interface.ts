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
	unit_price: number | string;
	unit_price_gross?: number | string;
	subtotal?: number | string;
	total_net?: number | string;
	total?: number | string;
	tax_amount?: number | string;
	tax_rate?: number | string;
	customer_sku?: string | null;
	customer_name?: string | null;
	name?: string | null;
	description?: string | null;
	product_detail?: string | null;
	product_attributes?: Record<string, any> | null;
	notes?: string | null;
	discount_amount?: number | string | null;
	discount_percentage?: number | string | null;
	product?: (Pick<IProduct, 'id' | 'name' | 'sku'> & { unit_price?: number | string }) | null;
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
	status: QuoteStatus;
	salesperson_id?: number | null;
	quote_date: string;
	expiry_date: string;
	valid_until?: string | null;
	subtotal: number | string;
	tax_amount: number | string;
	discount_amount: number | string;
	total_amount: number | string;
	tax_rate?: string | number;
	tax_percentage?: number | string;
	discount_rate?: string | number;
	discount_percentage?: number | string;
	notes?: string | null;
	internal_notes?: string | null;
	terms_conditions?: Record<string, any> | null;
	payment_method?:
		| 'efectivo'
		| 'tarjeta_credito'
		| 'tarjeta_debito'
		| 'transferencia'
		| 'cheque'
		| 'credito'
		| string
		| string[]
		| null;
	purchase_order?: string | null;
	payment_terms?: number | null;
	fixed_discount?: number | null;
	document_type?: string | null;
	metadata?: Record<string, any>;
	created_at?: string;
	updated_at?: string;
	created_by?: number | null;
	approved_by?: number | null;
	billing_snapshot?: Record<string, unknown> | string | null;
	shipping_snapshot?: Record<string, unknown> | string | null;
	customer?: QuoteCustomerSummary | ICustomer | null;
	totals?: QuoteTotals;
	items?: QuoteItem[];
	can_convert?: boolean;
	items_count?: number;
	is_converted_to_sale?: boolean;
	converted_at?: string | null;
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
	// quote_number?: string | null;
	quote_date: string;
	expiry_date: string;
	tax_rate: number;
	notes?: string | null;
	internal_notes?: string | null;
	payment_method?: string | string[] | null;
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

export type IQuote = Quote;
export type IQuoteItem = QuoteItem;
export type ICreateQuoteRequest = QuoteCreateDTO;
export type IUpdateQuoteRequest = QuoteUpdateDTO;
export type IConvertQuoteRequest = Record<string, any>;
