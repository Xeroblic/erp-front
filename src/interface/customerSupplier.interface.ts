// src/interface/customerSupplier.interface.ts
import type { ISubsidiaryMin } from '@/interface/empresas.interface';

// Fuente única en empresas.interface.ts; se re-exporta para no romper imports existentes.
export type { ISubsidiaryMin };

export interface ISupplierMin {
	created_at: string;
	id: number;
	name: string;
	subsidiary_id: number;
	updated_at: string;
}

export interface ICustomerSupplier {
	id: number;
	subsidiary_id: number;
	name: string;
	created_at: string;
	updated_at: string;
	suppliers_count?: number;
	suppliers?: ISupplierMin[];
	subsidiary?: ISubsidiaryMin;
}

export interface ICreateCustomerSupplierRequest {
	name: string;
}

export interface IUpdateCustomerSupplierRequest {
	id: number;
	name: string;
}

export interface IAttachSuppliersToCustomerSupplierRequest {
	supplier_ids: number[];
}
