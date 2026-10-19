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
	/**
	 * Devolución física de la etapa 2 que espera recepción; `null` si no hay. Es la única
	 * forma de conocer el `return_id` de una devolución que inició el canal (Woo).
	 */
	pending_return?: ISalePendingReturn | null;
}

export type TSaleReturnStatus = 'pending_receipt' | 'received';

/** `manual` la inició alguien desde el ERP; `channel`, un `cancelled`/`refunded` de Woo. */
export type TSaleReturnSource = 'manual' | 'channel';

/** Resumen de la devolución pendiente que traen la venta y sus listados. */
export interface ISalePendingReturn {
	id: number;
	sale_cycle: number;
	status: TSaleReturnStatus;
	source: TSaleReturnSource;
}

/** `fit` vuelve a la venta; `unfit` queda en el físico sin venderse ni publicarse. */
export type TSaleReturnCondition = 'fit' | 'unfit';

/** Lo que entró de un ítem al recibir; `reason` sólo en lo no apto. */
export interface ISaleReturnReceivedAllocation {
	warehouse_id: number | null;
	quantity: number;
	condition: TSaleReturnCondition;
	reason: string | null;
	serial_number: string | null;
}

/** Lo que la devolución usa de la ficha del producto. */
export interface ISaleReturnProduct {
	id: number;
	sku: string | null;
	name: string;
}

export interface ISaleReturnItem {
	sale_item_id: number;
	/**
	 * Sucursal a la que vuelve el ítem: las bodegas que se ofrecen para recibirlo son de
	 * ella. `null` sólo si ni la venta ni el producto tienen sucursal.
	 */
	branch_id: number | null;
	product: ISaleReturnProduct;
	serial_tracking: boolean;
	quantity_expected: number;
	/** Series vendidas que vuelven; `[]` en un ítem sin serie. */
	serial_numbers: string[];
	/** `[]` mientras la devolución espera. */
	received_allocations: ISaleReturnReceivedAllocation[];
}

/** `data` de `POST /sales/{sale}/returns` y de `GET /sales/{sale}/returns/{return}`. */
export interface ISaleReturn {
	id: number;
	sale_id: number;
	sale_cycle: number;
	status: TSaleReturnStatus;
	source: TSaleReturnSource;
	reason: string | null;
	items: ISaleReturnItem[];
	created_at: string | null;
	received_at: string | null;
	received_by: { id: number; name: string } | null;
	inventory_operation_id: string | null;
}

export interface IStartSaleReturnRequest {
	/** Obligatorio, máximo 500. */
	reason: string;
}

/** Parte de un ítem sin serie. `warehouse_id: null` es «Sin ubicación». */
export interface IConfirmSaleReturnAllocation {
	warehouse_id: number | null;
	quantity: number;
	condition: TSaleReturnCondition;
	/** Obligatorio si `condition` es `unfit`; `null` en lo apto. */
	reason: string | null;
}

/** Una serie devuelta. `warehouse_id: null` conserva la bodega que ya tenía. */
export interface IConfirmSaleReturnSerial {
	serial_number: string;
	warehouse_id: number | null;
	condition: TSaleReturnCondition;
	reason: string | null;
}

/** Un ítem sin serie lleva `allocations`; uno con serie, `serials`. */
export interface IConfirmSaleReturnItem {
	sale_item_id: number;
	allocations?: IConfirmSaleReturnAllocation[];
	serials?: IConfirmSaleReturnSerial[];
}

/**
 * Cuerpo de `POST /confirm-return` en la etapa 2: la devolución completa, cada ítem una
 * vez y con exactamente su cantidad o sus series. Sin `return_id` es la etapa 1, sin cuerpo.
 */
export interface IConfirmSaleReturnRequest {
	return_id: number;
	items: IConfirmSaleReturnItem[];
}

export interface ISaleReturnReceiptItem {
	sale_item_id: number;
	received_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
}

/** 200 de `POST /confirm-return` con `return_id`: `data` junto a `message` y `sale_id`. */
export interface IConfirmSaleReturnReceiptResponse {
	message: string;
	sale_id: number;
	data: {
		id: number;
		status: TSaleReturnStatus;
		items: ISaleReturnReceiptItem[];
	};
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

/** Cantidad descontada de una ubicación; en la etapa 1 siempre «Sin ubicación» (`null`). */
export interface ISaleCloseAllocation {
	warehouse_id: number | null;
	quantity: number;
}

/**
 * Línea del `POST /close`: un ítem con serie lleva `serial_numbers`; uno sin serie de la
 * etapa 2 lleva `allocations` cuando su ubicación se eligió (modo `manual`). Un ítem que
 * no lleva ninguno de los dos no va en el request.
 */
export interface ICloseSaleRequestItem {
	sale_item_id: number;
	serial_numbers?: string[];
	product_detail?: string;
	/** Sin repetir ubicación; deben sumar la cantidad del ítem. `null` es «Sin ubicación». */
	allocations?: ISaleCloseAllocation[];
}

export interface ICloseSaleRequest {
	// Estructura para el endpoint POST /close
	items: ICloseSaleRequestItem[];
}

/**
 * Cómo se elige la ubicación de un ítem sin serie en `fulfillment-options`:
 * `automatic` (una sola ubicación con apto, se omite `allocations`), `manual` (varias,
 * `allocations` obligatorio) o `blocked` (la sucursal no alcanza; no se puede cerrar).
 */
export type TSaleAllocationMode = 'automatic' | 'manual' | 'blocked';

/** Ubicación con apto para un ítem. `warehouse_id: null` es «Sin ubicación». */
export interface ISaleFulfillmentLocation {
	warehouse_id: number | null;
	name: string;
	/** Apto del producto en la ubicación, compartido por las líneas del mismo producto. */
	fit_quantity: number;
}

/** Lo que la vista previa usa de la ficha del producto. */
export interface ISaleFulfillmentProduct {
	id: number;
	sku: string | null;
	name: string;
}

/** Opciones de un ítem **sin serie**; los ítems con serie no aparecen en la vista previa. */
export interface ISaleFulfillmentOptionItem {
	sale_item_id: number;
	/** Sucursal de la que sale el ítem (la de la venta o la del producto); `null` si ninguna. */
	branch_id: number | null;
	product: ISaleFulfillmentProduct;
	quantity_required: number;
	/** Retención activa de la propia venta: ya está descontada del apto, no restarla de nuevo. */
	own_hold_quantity: number;
	stock_sufficient: boolean;
	allocation_mode: TSaleAllocationMode;
	/** Selección confirmable tal cual; vacía en `blocked`. */
	suggested_allocations: ISaleCloseAllocation[];
	/** Sólo ubicaciones con apto, de mayor a menor. */
	locations: ISaleFulfillmentLocation[];
}

/** `data` de `GET /sales/{sale}/fulfillment-options` (etapa 2 del cierre con ubicación). */
export interface ISaleFulfillmentOptions {
	sale_id: number;
	branch_id: number | null;
	is_closed: boolean;
	/** `[]` si la venta ya no se puede cerrar. */
	items: ISaleFulfillmentOptionItem[];
}

/**
 * Ubicación elegida que ya no alcanza, en el 409 `ALLOCATION_STOCK_INSUFFICIENT`.
 * `requested` es lo que toda la venta saca de esa ubicación para el producto.
 */
export interface ISaleAllocationShortageItem {
	sale_item_id: number;
	product_id: number;
	branch_id: number | null;
	warehouse_id: number | null;
	requested: number;
	available: number;
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
