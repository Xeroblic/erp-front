export type TDocumentType = 'NIT' | 'CC' | 'CE' | 'PASSPORT';
export type TCustomerSegment = 'CORPORATIVO' | 'PYME' | 'PERSONA_NATURAL';

export interface ICustomer {
  id: number;
  company_id: number;
  name: string;
  code: string;
  document_type: TDocumentType;
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
  credit_limit: number;
  payment_terms: number; // días
  segment: TCustomerSegment;
  industry: string;
  customer_since: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  orders_count: number;
  total_sales: number;
  last_order_date?: string;
  loyalty_score: number; // 1-100
}

export interface ICustomerFilters {
  search: string;
  segment?: string;
  industry?: string;
  city?: string;
  loyalty_score?: number;
  is_active?: boolean;
}

export interface ICustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  total_sales: number;
  avg_loyalty_score: number;
  top_segment: string;
  new_this_month: number;
}

