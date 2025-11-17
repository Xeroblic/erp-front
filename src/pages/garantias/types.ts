import type { Warranty, WarrantyDetail, WarrantyStatus } from '@/interface/warranties.interface';

export type WarrantyFilters = {
	q?: string;
	status?: WarrantyStatus | '';
	product_id?: number | null;
	customer_id?: number | null;
	sale_id?: number | null;
};

export type WarrantyListItem = Warranty;
export type WarrantyEntity = WarrantyDetail | Warranty;

export type WarrantyFormValues = {
	product_id: number | null;
	start_date: string;
	end_date: string;
	sale_id: number | null;
	customer_id: number | null;
	status: WarrantyStatus | '';
	notes: string;
	serial_number?: string;
};

export type WarrantyFormMode = 'create' | 'edit';
