// ─── Tipos del Módulo Reportes ───────────────────────────────────────────────

/** Registro de venta tal como llega del API */
export interface SaleRecord {
	id: number;
	sale_number: string | null;
	wc_order_number: string | null;
	sale_date: string | null;
	date: string | null;
	created_at: string | null;
	updated_at: string | null;
	status: string;
	total_amount: string | number;
	subtotal: string | number | null;
	tax_amount: string | number | null;
	returns: string | number | null;
	refunded_amount: string | number | null;
	customer_id: number | null;
	customer_name: string | null;
	customer: SaleCustomer | string | null;
	billing_snapshot: BillingSnapshot | null;
	branch_id: number | null;
	branch_name: string | null;
}

export interface SaleCustomer {
	id: number;
	billing_company: string | null;
	contact_name: string | null;
	name: string | null;
}

export interface BillingSnapshot {
	first_name: string | null;
	last_name: string | null;
	company: string | null;
}

/** Registro de stock tal como llega del API */
export interface StockRecord {
	sku: string;
	product_name: string;
	warehouse_name: string | null;
	branch_name: string | null;
	quantity: number | string;
}

/** Row normalizada para la tabla de inventario */
export interface InventoryRow {
	sku: string;
	nombre: string;
	bodega: string;
	stock: number;
}

/** Filtros compartidos entre ambos reportes */
export interface ReportFiltersState {
	dateFrom?: string;
	dateTo?: string;
	parameter?: string;
	priceMin?: number | '';
	priceMax?: number | '';
	subsidiary?: string;
	branch?: string;
	customer?: string;
}

/** Métricas del Dashboard de Ventas */
export interface SalesDashboardStats {
	total: number;
	returns: number;
	refundedTotal: number;
	count: number;
	avg: number;
	retPct: number;
	monthlyAvg: number;
	projectedTotal: number;
}

/** Filtros mapeados para enviar al API (alias estricto de IReportFilters) */
export type { IReportFilters as MappedFilters } from '@/interface/reports.interface';
