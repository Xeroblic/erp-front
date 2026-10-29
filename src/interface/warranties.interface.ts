export type WarrantyStatus = 'Activa' | 'Expirada' | 'Usada' | 'Anulada';

export interface WarrantyProduct {
	id: number;
	name: string;
	sku?: string | null;
	warranty_months?: number | null;
	attributes_json?: Record<string, any> | null;
	parent_id?: number | null;
	parent?: WarrantyProduct | null;
}

export interface WarrantyCustomer {
	id: number;
	name: string;
	rut?: string | null;
	email?: string | null;
	phone?: string | null;
}

export interface WarrantySale {
	id: number;
	sale_number?: string | null;
	sale_date?: string | null;
}

export interface Warranty {
	id: number;
	subsidiary_id: number;
	product_id?: number | null;
	customer_id?: number | null;
	sale_id?: number | null;
	serial_number?: string | null;
	status: WarrantyStatus;
	start_date?: string | null;
	end_date?: string | null;
	notes?: string | null;
	created_at?: string;
	updated_at?: string;
	product?: WarrantyProduct | null;
	customer?: WarrantyCustomer | null;
	sale?: WarrantySale | null;
}

export interface WarrantyDetail extends Warranty {}

export interface WarrantyCreateDTO {
	product_id?: number;
	start_date?: string;
	end_date?: string;
	sale_id?: number;
	customer_id?: number;
	status?: WarrantyStatus;
	notes?: string;
	serial_number?: string;
}

export interface WarrantyUpdateDTO extends Partial<WarrantyCreateDTO> {}

export interface WarrantyListResponse {
	data: Warranty[];
	meta: {
		total: number;
		current_page: number;
		per_page: number;
		last_page: number;
	};
}
