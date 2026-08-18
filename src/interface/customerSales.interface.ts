export interface ICustomerSale {
	id: number;
	subsidiary_id: number;
	customer_code?: string | null;
	name: string;
	document_type: string;
	document_number: string;
	type: string;

	rut: string;

	billing_company?: string | null;
	trade_activity?: string | null;
	giro?: string | null;

	contact_name?: string | null;

	primary_contact?: {
		name: string;
		email?: string | null;
		phone: string;
	} | null;

	email: string | null;
	phone?: string | null;

	billing_address_1?: string | null;
	address?: string | null;
	billing_address_2?: string | null;
	billing_city?: string | null;

	commune_id?: number | null;
	commune?: {
		id: number;
		name: string;
	} | null;

	billing_state_code?: string | null;
	billing_postcode?: string | null;
	billing_country_code?: string | null;

	shipping_address_1?: string | null;
	shipping_address_2?: string | null;
	shipping_city?: string | null;

	shipping_commune_id?: number | null;
	shipping_commune?: {
		id: number;
		name: string;
	} | null;

	shipping_state_code?: string | null;
	shipping_postcode?: string | null;
	shipping_country_code?: string | null;

	default_document_type?: string | null;
	preferred_payment_method?: string | null;
	purchase_order_number?: string | null;

	commercial_data?: any | null;
	notes?: string | null;

	is_active: boolean;

	created_at: string;
	updated_at: string;

	subsidiary?: {
		id: number;
		name: string;
	};
}
export interface ICustomerSaleOverview {
	id: number;
	name: string;
	rut: string;
	contact: {
		name?: string;
		email?: string | null;
		phone?: string;
	} | null;
	loyalty: number;
	total_sales: number;
	is_active: boolean;
}

export interface ICustomerSalePayload extends Partial<ICustomerSale>, Record<string, unknown> {
	primary_contact_name?: string | null;
	primary_contact_email?: string | null;
	primary_contact_phone?: string | null;
}
