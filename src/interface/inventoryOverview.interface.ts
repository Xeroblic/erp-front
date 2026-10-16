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
 *
 * El backend publica `GET B/inventory-stock` y `/{product}/origins`, y el
 * umbral §13 en el producto (`GET B/products/{product}`), que sólo lee la
 * ficha. Lo que no sale de ahí (reparto por bodega en la lista, totales de
 * unidades, umbral y reservas por fila) llega `null` desde la API real en vez
 * de inventarse. El doble de datos simulados sí lo calcula.
 */

/** Estado del stock crítico (§13 del contrato aprobado). */
export type TCriticalStockStatus = 'critical' | 'healthy' | 'unconfigured';

/** Filtro `stock_status` de A1: los tres estados del §13 más `out` (disponible ≤ 0). */
export type TInventoryStockStatusFilter = TCriticalStockStatus | 'out';

/**
 * `location`: primera ubicación del reparto («Sin ubicación» antes que las bodegas).
 * `stock_status`: de más a menos urgente (sin disponible, bajo el umbral, sin umbral, normal).
 */
export type TInventoryStockSortField =
	| 'name'
	| 'location'
	| 'physical_quantity'
	| 'available_quantity'
	| 'stock_status';
export type TInventoryStockSort = TInventoryStockSortField | `-${TInventoryStockSortField}`;

/**
 * Bloque `critical_stock` del §13. La API real lo calcula para la filial
 * (`scope: 'subsidiary'`) aunque se lea desde una sucursal; el doble, para la
 * sucursal (`scope: 'branch'`). El estado viene del backend: no se recalcula.
 */
export interface IInventoryCriticalStock {
	scope: 'branch' | 'subsidiary';
	/** Sólo con `scope: 'subsidiary'`. */
	subsidiary_id?: number;
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
	/**
	 * Siempre de la sucursal completa, aunque la consulta filtre una ubicación.
	 * `null`: el backend no publica el reparto por bodega en la lista.
	 */
	warehouses: IInventoryWarehouseBreakdown[] | null;
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

/**
 * A2 · totales de la sucursal para la franja de alertas. Desde la API real sólo
 * se conocen los conteos de productos (`meta.total` de una consulta): las
 * unidades exigirían recorrer todas las páginas, y los estados necesitan umbral
 * y reservas, que no están publicados.
 */
export interface IInventoryStockSummary {
	/** Productos con stock en la sucursal. */
	products_count: number;
	/** Productos con stock en «Sin ubicación». `null` en el doble, que informa unidades. */
	unlocated_products_count: number | null;
	physical_quantity: number | null;
	unfit_quantity: number | null;
	undocumented_quantity: number | null;
	unlocated_quantity: number | null;
	critical_count: number | null;
	out_count: number | null;
	unconfigured_count: number | null;
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

/**
 * A3 · agregado por bodega. `warehouse: null` es «Sin ubicación». Desde la API
 * real las unidades y los críticos son `null`: sólo se conoce cuántos
 * productos con stock tiene cada ubicación.
 */
export interface IInventoryWarehouseAggregate {
	warehouse: IInventoryWarehouseInfo | null;
	capacity: number | null;
	maximum_capacity: number | null;
	product_count: number;
	physical_quantity: number | null;
	unfit_quantity: number | null;
	undocumented_quantity: number | null;
	critical_count: number | null;
}

export interface IInventoryWarehouseAggregatesResponse {
	data: IInventoryWarehouseAggregate[];
	context: IInventoryLocationContext;
	/**
	 * `false`: el usuario no puede leer el catálogo de bodegas (403), así que
	 * `data` trae sólo «Sin ubicación». No significa que la sucursal no tenga bodegas.
	 */
	warehouses_complete: boolean;
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
	/** Ubicaciones con saldo que se conocen. Ver `warehouses_complete`. */
	warehouses: IInventoryWarehouseBreakdown[];
	/**
	 * `false`: sin acceso al catálogo de bodegas sólo se conoce «Sin ubicación»;
	 * el resto del físico está en bodegas que no se pueden nombrar. Un reparto
	 * vacío con `true` sí significa que no hay unidades.
	 */
	warehouses_complete: boolean;
	/** `null` en productos con serie o si no se pudo leer el producto. */
	critical_stock: IInventoryCriticalStock | null;
	/**
	 * Sucursal cuya ruta edita el umbral: la dueña del producto
	 * (`PATCH B/products/{product}` exige que `{branch}` sea la suya). `null`: es
	 * un producto de filial, y ninguna ruta publicada le acepta umbral.
	 */
	threshold_branch_id: number | null;
	series_summary: IInventorySeriesSummary | null;
}

export type IInventoryStockDetailResponse = IApiResourceEnvelope<
	IInventoryStockDetail,
	IInventoryLocationContext
>;
