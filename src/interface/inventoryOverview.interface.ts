import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IInventoryLocationContext,
	IInventoryStockListParams,
	IInventoryStockRow,
	IProcurementProduct,
	IWarehouseCompact,
} from '@/interface/procurement.interface';

/**
 * Ampliación del contrato de abastecimiento para la vista unificada de
 * Inventario (`docs/inventario-unificado-contrato.md`). Reutiliza los tipos de
 * `procurement.interface` para lo que el contrato aprobado ya define.
 */

/** Estado del stock crítico (§13 del contrato aprobado). */
export type TCriticalStockStatus = 'critical' | 'healthy' | 'unconfigured';

/** Filtro `stock_status` de A1: los tres estados del §13 más `out` (disponible ≤ 0). */
export type TInventoryStockStatusFilter = TCriticalStockStatus | 'out';

export type TInventoryStockSortField = 'name' | 'physical_quantity' | 'available_quantity';
export type TInventoryStockSort = TInventoryStockSortField | `-${TInventoryStockSortField}`;

/** Bloque `critical_stock` del §13, calculado para la sucursal (`scope: 'branch'`). */
export interface IInventoryCriticalStock {
	scope: 'branch' | 'subsidiary';
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
	held_quantity: number;
	/** `fit - held`. Negativo significa faltante frente a lo reservado. */
	available_quantity: number;
	threshold: number | null;
	status: TCriticalStockStatus;
}

/** Saldo de un producto en una ubicación. `warehouse: null` es «Sin ubicación». */
export interface IInventoryWarehouseBreakdown {
	warehouse: IWarehouseCompact | null;
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
	documented_quantity: number;
	undocumented_quantity: number;
}

/** Fila de A1 con `include=warehouses`. */
export interface IInventoryOverviewRow extends IInventoryStockRow {
	/** Siempre de la sucursal completa, aunque la consulta filtre una ubicación. */
	warehouses: IInventoryWarehouseBreakdown[];
	/** `null` en productos con serie, igual que el §13. */
	critical_stock: IInventoryCriticalStock | null;
}

export type IInventoryOverviewParams = IInventoryStockListParams & {
	include: 'warehouses';
	stock_status?: TInventoryStockStatusFilter;
	brand_id?: number;
	category_id?: number;
	sort?: TInventoryStockSort;
};

export type IInventoryOverviewResponse = IApiCollectionEnvelope<
	IInventoryOverviewRow,
	IInventoryLocationContext
> & { context: IInventoryLocationContext };

/** A2 · totales de la sucursal para la franja de alertas. */
export interface IInventoryStockSummary {
	products_count: number;
	physical_quantity: number;
	unfit_quantity: number;
	undocumented_quantity: number;
	unlocated_quantity: number;
	critical_count: number;
	out_count: number;
	unconfigured_count: number;
}

export type IInventoryStockSummaryResponse = IApiResourceEnvelope<
	IInventoryStockSummary,
	IInventoryLocationContext
>;

export interface IInventoryWarehouseInfo extends IWarehouseCompact {
	code: string | null;
	warehouse_type: string | null;
	is_active: boolean;
	/** Datos de la ficha de la bodega (tabla `warehouses`); `null` si no se cargaron. */
	description: string | null;
	manager_name: string | null;
	address: string | null;
	commune_name: string | null;
	schedule: string | null;
	requires_serial_tracking: boolean;
}

/** A3 · agregado por bodega. `warehouse: null` es «Sin ubicación». */
export interface IInventoryWarehouseAggregate {
	warehouse: IInventoryWarehouseInfo | null;
	capacity: number | null;
	maximum_capacity: number | null;
	product_count: number;
	physical_quantity: number;
	unfit_quantity: number;
	undocumented_quantity: number;
	critical_count: number;
}

export interface IInventoryWarehouseAggregatesResponse {
	data: IInventoryWarehouseAggregate[];
	context: IInventoryLocationContext;
}

export interface IInventorySeriesSummary {
	total: number;
	by_status: Record<string, number>;
	by_grade: Record<string, number>;
}

/** Producto de la ficha: el del §2 más el umbral del §13. */
export interface IInventoryDetailProduct extends IProcurementProduct {
	critical_stock_threshold: number | null;
}

/** A4 · ficha de un producto en la sucursal. */
export interface IInventoryStockDetail {
	product: IInventoryDetailProduct;
	physical_quantity: number;
	fit_quantity: number;
	unfit_quantity: number;
	documented_quantity: number;
	undocumented_quantity: number;
	warehouses: IInventoryWarehouseBreakdown[];
	critical_stock: IInventoryCriticalStock | null;
	series_summary: IInventorySeriesSummary | null;
}

export type IInventoryStockDetailResponse = IApiResourceEnvelope<
	IInventoryStockDetail,
	IInventoryLocationContext
>;
