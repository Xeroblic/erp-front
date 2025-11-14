import ApiService from '@/services/ApiService';

// Tipos mínimos basados en la guía de implementación
export type SaleStatusAPI =
  | 'draft'
  | 'confirmed'
  | 'partially_paid'
  | 'paid'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface SaleListItem {
  id: number;
  wc_order_id?: number | null;
  wc_order_number?: string | null;
  sale_number: string;
  status: SaleStatusAPI;
  sale_date: string;
  total_amount: string | number;
  customer?: { rut?: string | null; name?: string | null } | null;
  items_count?: number;
}

export interface SaleDetail extends SaleListItem {
  subtotal?: string | number;
  discount_total?: string | number;
  tax_amount?: string | number;
  shipping_total?: string | number;
  paid_amount?: string | number;
  pending_amount?: string | number;
  customer?: {
    rut?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  billing_address?: any;
  shipping_address?: any;
  documents_metadata?: any;
  inventory_delivered?: boolean;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product?: { sku?: string; name?: string } | null;
  sku?: string | null;
  name?: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal?: string | number;
  total?: string | number;
  status?: string | null;
}

export interface CloseSalePayloadItem {
  sale_item_id: number;
  serial_numbers: string[];
}

export interface CloseSaleResponse {
  message: string;
  sale_id: number;
}

export interface SalesListFilters {
  status?: string;
  wc_order_id?: string | number;
  q?: string; // Nº Venta / Nº Woo
  per_page?: number;
  page?: number;
  with_customer?: 0 | 1;
}

const base = (subsidiaryId: number) => `/subsidiaries/${subsidiaryId}/sales`;

export const fetchSalesList = async (
  subsidiaryId: number,
  filters: SalesListFilters = {}
): Promise<{ data: SaleListItem[]; meta?: any }> => {
  const params = { with_customer: 1, per_page: 20, ...filters } as Record<string, any>;
  const resp = await ApiService.fetchData<any>({ url: base(subsidiaryId), method: 'get', params });
  const payload = (resp.data?.data ?? resp.data) as any;
  if (Array.isArray(payload)) {
    return { data: payload as SaleListItem[] };
  }
  return { data: (payload?.data ?? []) as SaleListItem[], meta: payload?.meta };
};

export const fetchSaleDetail = async (
  subsidiaryId: number,
  saleId: number
): Promise<SaleDetail> => {
  const resp = await ApiService.fetchData<any>({
    url: `${base(subsidiaryId)}/${saleId}`,
    method: 'get',
    params: { with_customer: 1 },
  });
  return (resp.data?.data ?? resp.data) as SaleDetail;
};

export const fetchSaleItems = async (
  subsidiaryId: number,
  saleId: number
): Promise<SaleItem[]> => {
  const resp = await ApiService.fetchData<any>({
    url: `${base(subsidiaryId)}/${saleId}/items`,
    method: 'get',
  });
  return (resp.data?.data ?? resp.data) as SaleItem[];
};

export const closeSale = async (
  subsidiaryId: number,
  saleId: number,
  payload: { items: CloseSalePayloadItem[] }
): Promise<CloseSaleResponse> => {
  const resp = await ApiService.fetchData<any>({
    url: `${base(subsidiaryId)}/${saleId}/close`,
    method: 'post',
    data: payload,
  });
  return (resp.data?.data ?? resp.data) as CloseSaleResponse;
};

export default {
  fetchSalesList,
  fetchSaleDetail,
  fetchSaleItems,
  closeSale,
};

