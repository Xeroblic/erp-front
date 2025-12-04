/**
 * Interfaces para el módulo de Clientes
 * Basado en los modelos del backend ERP P0
 */

import type { Quote } from './quotes.interface';

export interface ICustomer {
	id: number;
	company_id: number;
	customer_type: CustomerType;
	first_name?: string;
	last_name?: string;
	company_name?: string;
	email?: string;
	phone?: string;
	mobile_phone?: string;
	tax_number?: string;
	address?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
	birth_date?: string;
	credit_limit?: number;
	payment_terms?: number; // días
	is_active: boolean;
	notes?: string;
	created_at: string;
	updated_at: string;

	// Relaciones
	sales?: any[]; // ISale[]
	quotes?: Quote[];

	// Campos calculados
	full_name?: string;
	display_name?: string;
	total_sales?: number;
	total_pending?: number;
	last_sale_date?: string;
	sales_count?: number;
	quotes_count?: number;
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface ICreateCustomerRequest {
	customer_type: CustomerType;
	first_name?: string;
	last_name?: string;
	company_name?: string;
	email?: string;
	phone?: string;
	mobile_phone?: string;
	tax_number?: string;
	address?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
	birth_date?: string;
	credit_limit?: number;
	payment_terms?: number;
	is_active?: boolean;
	notes?: string;
	[key: string]: unknown;
}

export interface IUpdateCustomerRequest extends Partial<ICreateCustomerRequest> {
	[key: string]: unknown;
}
