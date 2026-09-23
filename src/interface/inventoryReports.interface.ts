import type { TCriticalStockStatus } from '@/interface/inventoryOverview.interface';
import type {
	IPurchaseDocumentCompact,
	ISupplierCompact,
	TBusinessDate,
} from '@/interface/procurement.interface';

/**
 * Filas de Reportes › Inventario (`GET S/reports/{type}`).
 *
 * `stock` es el único tipo publicado hoy. `stock_health`, `replenishment` y
 * `dead_stock` son R1–R3 de `docs/inventario-unificado-contrato.md`: el
 * frontend lee exactamente estos campos, y mientras el backend no los publique
 * los sirve el mock de `inventoryReportsMock.service` (bandera
 * `VITE_INVENTORY_STOCK_USE_MOCKS`).
 */
export type TInventoryReportType = 'stock' | 'stock_health' | 'replenishment' | 'dead_stock';

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
 * R2 `replenishment`: fila de `P/replenishment-candidates` (§13). Sólo
 * productos bajo el umbral. El contrato no sugiere cantidad a comprar: el
 * stock objetivo está fuera de alcance.
 */
export interface IReplenishmentReportRow {
	product: IInventoryReportProduct;
	stock: {
		physical_quantity: number;
		available_quantity: number;
		threshold: number | null;
		status: TCriticalStockStatus;
	};
	recommendation: {
		status: TReplenishmentStatus;
		historical_supplier_count: number;
		eligible_supplier_count: number;
		supplier: ISupplierCompact | null;
		last_purchase: IReplenishmentLastPurchase | null;
	};
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
	| { type: 'replenishment'; rows: IReplenishmentReportRow[] }
	| { type: 'dead_stock'; rows: IDeadStockReportRow[] };

/** Parámetros de un reporte completo. */
export interface IInventoryReportParams {
	/** `null`: todas las sucursales de la filial. */
	branchId: number | null;
	/** R3: días mínimos sin movimiento (el contrato usa 90 por defecto). */
	days?: number;
}
