// src/interface/supplier.interface.ts

export interface ICustomerSupplierMin {
  id: number;
  name: string;
  subsidiary_id: number;
}

export interface ISubsidiaryMin {
  id: number;
  subsidiary_name: string;
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
