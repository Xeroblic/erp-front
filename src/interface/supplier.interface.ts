// src/interface/supplier.interface.ts
import type { ISubsidiaryMin } from '@/interface/empresas.interface';

// Fuente única en empresas.interface.ts; se re-exporta para no romper imports existentes.
export type { ISubsidiaryMin };

export interface ICustomerSupplierMin {
	id: number;
	name: string;
	subsidiary_id: number;
}

export interface ISupplier {
	id: number;
	subsidiary_id: number;
	name: string;
	created_at: string;
	updated_at: string;
	customer_suppliers_count?: number;
	customerSuppliers?: ICustomerSupplierMin[];
	subsidiary?: ISubsidiaryMin;
}

export interface ICreateSupplierRequest {
	name: string;
}

export interface IUpdateSupplierRequest {
	id: number;
	name: string;
}

export interface IAttachCustomersToSupplierRequest {
	customer_supplier_ids: number[];
}
