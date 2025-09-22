export type SupplierDocumentType = 'NIT' | 'CC' | 'CE' | 'PASSPORT';

export interface ISupplier {
  id: number;
  company_id: number;
  name: string;
  code: string;
  document_type: SupplierDocumentType;
  document_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website?: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  payment_terms: number;
  credit_limit: number;
  category: string;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count: number;
  orders_count: number;
  total_purchases: number;
}

export interface ISupplierFilters {
  search: string;
  category?: string;
  city?: string;
  rating?: number;
  is_active?: boolean;
}

export interface ISupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
  total_purchases: number;
  avg_rating: number;
  top_category: string;
}