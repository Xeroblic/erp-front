import type { TCriticalStockStatus } from '@/interface/inventoryOverview.interface';
import type {
	IPurchaseDocumentCompact,
	ISupplierCompact,
	TBusinessDate,
} from '@/interface/procurement.interface';

/**
 * Filas de Reportes › Inventario (`GET S/reports/{type}`).
 *
 * `stock` es el único tipo publicado hoy. `stock_health` y `dead_stock` son
 * R1 y R3 de `docs/inventario-unificado-contrato.md`: el frontend lee
 * exactamente estos campos, y mientras el backend no los publique los sirve el
 * mock de `inventoryReportsMock.service` (bandera
 * `VITE_INVENTORY_STOCK_USE_MOCKS`).
 *
 * R2 (reposición) no es un tipo de reporte: la pestaña Acciones lee
 * `GET P/replenishment-candidates` (§13), paginada en el servidor.
 */
export type TInventoryReportType = 'stock' | 'stock_health' | 'dead_stock';

/** `api`: `GET S/reports/{type}`. `mock`: el mock del contrato, con aviso visible. */
export type TInventoryReportSource = 'api' | 'mock';

/** Producto compacto de las filas R1–R3. */
export interface IInventoryReportProduct {
	id: number;
	sku: string;
	name: string;
}

export interface IInventoryReportBranch {
	id: number;
	name: string;
}

/** `stock`: existencias por producto (los hijos se suman al padre). */
export interface IStockReportRow {
	sku: string;
	product_name: string;
	/** Nombre de la sucursal filtrada, o «Todas». */
	branch_name: string | null;
	quantity: number;
	updated_at: string | null;
}

/** R1 `stock_health`: estado del §13 por producto y sucursal. */
export interface IStockHealthReportRow {
	product: IInventoryReportProduct;
	branch: IInventoryReportBranch;
	physical_quantity: number;
	available_quantity: number;
	threshold: number | null;
	status: TCriticalStockStatus;
}

export type TReplenishmentStatus =
	| 'suggested'
	| 'without_supplier_history'
	| 'no_active_suppliers'
	| 'no_comparable_cost';

export interface IReplenishmentLastPurchase {
	received_on: TBusinessDate;
	days_since_purchase: number;
	quantity: number;
	purchase_document: IPurchaseDocumentCompact | null;
}

/**
 * Fila de `GET P/replenishment-candidates` (§13, tarea 20): un producto en
 * stock crítico (disponible ≤ umbral) con el proveedor al que conviene
 * comprarle. El contrato no sugiere cantidad a comprar: el stock objetivo
 * está fuera de alcance.
 */
export interface IReplenishmentReportRow {
	product: IInventoryReportProduct;
	/** El bloque `critical_stock` de la ficha del producto: de la filial. */
	stock: {
		physical_quantity: number;
		/** Apto menos reservas activas: puede ser negativo tras un faltante real. */
		available_quantity: number;
		threshold: number | null;
		status: TCriticalStockStatus;
	};
	recommendation: {
		status: TReplenishmentStatus;
		historical_supplier_count: number;
		eligible_supplier_count: number;
		/** Sólo con `suggested`; con los otros tres estados es `null`. */
		supplier: ISupplierCompact | null;
		last_purchase: IReplenishmentLastPurchase | null;
	};
}

export type TReplenishmentStatusCounts = Record<TReplenishmentStatus, number>;

/** Filtros de `GET P/replenishment-candidates`. Los vacíos no viajan. */
export interface IReplenishmentCandidatesParams {
	/** Nombre, SKU, SKU comercial o código de barras; hasta 100 caracteres. */
	search?: string;
	brand_id?: number;
	category_id?: number;
	/** Proveedor **sugerido**: deja sólo los `suggested` a ese proveedor. */
	supplier_id?: number;
	recommendation_status?: TReplenishmentStatus;
	page?: number;
	/** Hasta 100. */
	per_page?: number;
}

/** Una página de candidatos, en el orden fijo del backend (lo más urgente primero). */
export interface IReplenishmentCandidatesPage {
	rows: IReplenishmentReportRow[];
	page: number;
	lastPage: number;
	total: number;
	/**
	 * `context.status_counts`: con todos los filtros salvo
	 * `recommendation_status`, igual en cada página. Alimenta las pestañas.
	 */
	statusCounts: TReplenishmentStatusCounts;
}

/** R3 `dead_stock`: último movimiento por producto y sucursal. */
export interface IDeadStockReportRow {
	product: IInventoryReportProduct;
	branch: IInventoryReportBranch;
	physical_quantity: number;
	/** `null`: no hay movimiento registrado (conteo inicial sin fecha). */
	last_operation_at: string | null;
	days_without_movement: number | null;
}

export type TInventoryReportResult =
	| { type: 'stock'; rows: IStockReportRow[] }
	| { type: 'stock_health'; rows: IStockHealthReportRow[] }
	| { type: 'dead_stock'; rows: IDeadStockReportRow[] };

/** Parámetros de un reporte completo. */
export interface IInventoryReportParams {
	/** `null`: todas las sucursales de la filial. */
	branchId: number | null;
	/** R3: días mínimos sin movimiento (el contrato usa 90 por defecto). */
	days?: number;
}
