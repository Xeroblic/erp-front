import { ICustomerSale } from './customerSales.interface';
import { IProduct } from './products.interface';
import { IUser } from './users.interface';

export interface ISale {
	id: number;
	company_id: number;

	sale_number: string;
	wc_order_id: number;
	wc_order_number?: string;
	quote_id?: number;

	sale_date: string;
	delivery_date?: string;
	created_at: string;
	updated_at: string;

	status: SaleStatus;

	subtotal: string;
	discount_amount: string;
	discount_rate: string;
	tax_amount: string;
	shipping_amount: string;
	shipping_total?: string;
	total_amount: string;
	paid_amount: string;
	pending_amount: string;
	document_type?: string;
	payment_method_title?: string;

	notes?: string;
	items_count?: number;
	/** La venta ya fue cerrada (cierre real del ERP), independiente del estado en Woo. */
	is_closed?: boolean;
	/** El backend permite cerrar la venta; ya contempla is_closed e inventory_finalized. */
	can_close?: boolean;
	/**
	 * El inventario de la venta ya quedó descontado/entregado, aunque is_closed venga
	 * en false (ventas históricas o entregadas por otra vía). Solo para estado visual:
	 * si es true, se muestra como "Finalizada" y el inventario queda en solo lectura.
	 * NO decide el botón de cierre (para eso está can_close).
	 */
	inventory_finalized?: boolean;
	documents_metadata?: {
		inventory_finalized: boolean;
	};
	billing_snapshot?: Record<string, unknown> | string | null;
	shipping_snapshot?: Record<string, unknown> | string | null;
	inventory_delivered: boolean;

	customer: ICustomerSale;
	creator?: IUser;
	items?: ISaleItem[];

	salesperson_id?: number;
	invoice_number?: string;

	complete_at?: string | null;
	/** Fecha/hora del cierre real de la venta (la usa el badge "Venta cerrada el ..."). */
	completed_at?: string | null;
}

export interface ISaleItem {
	id: number;
	sale_id: number;
	product_id: number;

	// Identificación y nombres (según payload de /sales/{id}/items)
	name?: string;
	sku?: string;
	product_detail?: string | null;

	// Cantidades y montos
	quantity: number;
	total?: number | string;
	unit_price?: number | string;
	unit_price_gross?: number | string;
	subtotal?: number | string;
	tax_amount?: number | string;
	discount_amount?: number | string;
	tax_rate?: number | string;
	external_line_id?: number;

	// Metadata y relaciones
	meta_json?: Record<string, unknown>;
	product?: IProduct;
}

export type SaleStatus =
	| 'draft'
	| 'pending'
	| 'on-hold'
	| 'confirmed'
	| 'processing'
	| 'paid'
	| 'completed'
	| 'delivered'
	| 'cancelled'
	| 'refunded';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';

export interface ICreateSaleRequest {
	customer_id: number;
	sale_date: string;
	notes?: string;
	items: Array<{
		product_id: number;
		quantity: number;
		price?: number;
	}>;
}

export interface ICloseSaleRequest {
	// Estructura para el endpoint POST /close
	items: Array<{
		sale_item_id: number;
		serial_numbers: string[];
		product_detail?: string;
	}>;
}

/** Cantidad descontada de una ubicación; en la etapa 1 siempre «Sin ubicación» (`null`). */
export interface ISaleCloseAllocation {
	warehouse_id: number | null;
	quantity: number;
}

/**
 * Lo que el cierre aplicó a una línea: `allocations` si es sin serie,
 * `serial_numbers` (las series efectivamente vendidas) si es con serie.
 */
export interface ISaleCloseFulfilledItem {
	sale_item_id: number;
	allocations?: ISaleCloseAllocation[];
	serial_numbers?: string[];
}

export interface ISaleCloseResult {
	id: number;
	is_closed: boolean;
	fulfilled_items: ISaleCloseFulfilledItem[];
}

/** 200 de `POST /sales/{sale}/close`: `data` va junto a `message` y `sale_id`. */
export interface ICloseSaleResponse {
	message: string;
	sale_id: number;
	data: ISaleCloseResult;
}

/**
 * Línea que no alcanza en el 409 `SALE_STOCK_INSUFFICIENT`. Las líneas de un mismo
 * producto se juzgan juntas: ambas traen el `requested` sumado del producto.
 * `branch_id` es `null` (con `available: 0`) si ni la venta ni el producto tienen sucursal.
 */
export interface ISaleStockShortageItem {
	sale_item_id: number;
	product_id: number;
	branch_id: number | null;
	requested: number;
	available: number;
}

export interface ISaleResponse {
	data: ISale;
	success?: boolean;
	message?: string;
}

export interface ISalesResponse {
	data: ISale[];
	meta?: {
		current_page: number;
		last_page: number;
		total: number;
		per_page: number;
	};
	// Soporte legacy si tu paginación viene en la raíz
	current_page?: number;
	last_page?: number;
	total?: number;
	per_page?: number;
}
