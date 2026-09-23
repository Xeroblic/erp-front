import type {
	IInventoryLocationContext,
	IInventoryStockListParams,
	IProcurementProduct,
	IWarehouseCompact,
} from '@/interface/procurement.interface';
import type {
	IInventoryCriticalStock,
	IInventoryOverviewParams,
	IInventoryOverviewResponse,
	IInventoryOverviewRow,
	IInventoryStockDetailResponse,
	IInventoryStockSummaryResponse,
	IInventoryWarehouseAggregate,
	IInventoryWarehouseAggregatesResponse,
	IInventoryWarehouseBreakdown,
	TCriticalStockStatus,
	TInventoryStockSort,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';
import {
	inventoryCriticalThresholdSeed,
	inventoryStockHolds,
	inventoryWarehouseProfiles,
	inventoryWarehousesByBranch,
	type IInventorySeedOrigin,
} from '@/mocks/db/inventoryStock.db';
import {
	inventoryMockDelay,
	inventoryMockError,
	paginateInventoryMock,
	readInventoryBranchOrigins,
	resolveInventoryStockProduct,
} from '@/services/procurement/inventoryStock.service';
import {
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';

/**
 * Servicio mock de la vista unificada de Inventario: A1–A4 de
 * `docs/inventario-unificado-contrato.md`, ampliación del contrato de
 * abastecimiento (PR #67 del backend). **Ninguno de estos endpoints existe
 * todavía.**
 *
 * No tiene store propio de stock: agrega las procedencias vivas de
 * `inventoryStock.service`, así un ajuste, traslado o recepción simulados se
 * reflejan acá sin duplicar estado. Lo único propio es el umbral crítico
 * (`critical_stock_threshold`, §13), que en el backend real vive en el
 * producto y se edita con la edición de producto.
 */

/* =================================================
   Umbral crítico (§13) — mock del campo del producto
   ================================================= */

const THRESHOLD_STORAGE_NAMESPACE = 'inventory-critical-thresholds';
/** v2: umbrales de los ejemplos de Ecopc en la semilla. */
const THRESHOLD_STORAGE_VERSION = 2;
/** El umbral es del producto (filial), no de la sucursal: una sola partición basta en el mock. */
const THRESHOLD_STORAGE_PARTITION = 0;

let thresholds: Map<number, number> | null = null;

const getThresholds = (): Map<number, number> => {
	if (thresholds === null) {
		const persisted = loadPersistedMockState<[number, number][]>(
			THRESHOLD_STORAGE_NAMESPACE,
			THRESHOLD_STORAGE_VERSION,
			THRESHOLD_STORAGE_PARTITION,
		);
		thresholds = new Map(
			persisted ??
				Object.entries(inventoryCriticalThresholdSeed).map(
					([productId, value]): [number, number] => [Number(productId), value],
				),
		);
	}
	return thresholds;
};

export const getInventoryCriticalThreshold = (productId: number): number | null =>
	getThresholds().get(productId) ?? null;

/**
 * Mock de la edición del umbral (§13): entero ≥ 0 o `null` para desactivarlo.
 * Con serie responde 422 `CRITICAL_THRESHOLD_NOT_ALLOWED`, como el contrato.
 */
export const updateInventoryCriticalThreshold = async (
	productId: number,
	threshold: number | null,
): Promise<{ data: { product_id: number; critical_stock_threshold: number | null } }> => {
	const product = resolveInventoryStockProduct(productId);
	if (!product) throw inventoryMockError(404, 'NOT_FOUND', 'El producto no existe.');
	if (product.serial_tracking)
		throw inventoryMockError(
			422,
			'CRITICAL_THRESHOLD_NOT_ALLOWED',
			'Los productos con serie no admiten umbral crítico.',
		);
	if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0))
		throw inventoryMockError(
			422,
			'VALIDATION_ERROR',
			'El umbral debe ser un número entero mayor o igual a 0.',
		);

	const store = getThresholds();
	if (threshold === null) store.delete(productId);
	else store.set(productId, threshold);
	savePersistedMockState(
		THRESHOLD_STORAGE_NAMESPACE,
		THRESHOLD_STORAGE_VERSION,
		THRESHOLD_STORAGE_PARTITION,
		[...store.entries()],
	);
	return inventoryMockDelay({
		data: { product_id: productId, critical_stock_threshold: threshold },
	});
};

/** Sólo para tests: vuelve el umbral a la semilla. */
export const resetInventoryCriticalThresholdsForTests = (): void => {
	thresholds = null;
};

/* =================================================
   Agregados
   ================================================= */

interface IProductAggregate {
	product: IProcurementProduct;
	totals: IInventoryWarehouseBreakdown;
	byWarehouse: Map<number | null, IInventoryWarehouseBreakdown>;
}

const emptyBreakdown = (warehouse: IWarehouseCompact | null): IInventoryWarehouseBreakdown => ({
	warehouse,
	physical_quantity: 0,
	fit_quantity: 0,
	unfit_quantity: 0,
	documented_quantity: 0,
	undocumented_quantity: 0,
});

/** Las cantidades de un desglose, sin la ubicación: es la forma de las filas de A1/A4. */
const quantitiesOf = ({
	physical_quantity,
	fit_quantity,
	unfit_quantity,
	documented_quantity,
	undocumented_quantity,
}: IInventoryWarehouseBreakdown) => ({
	physical_quantity,
	fit_quantity,
	unfit_quantity,
	documented_quantity,
	undocumented_quantity,
});

const addOrigin = (target: IInventoryWarehouseBreakdown, origin: IInventorySeedOrigin): void => {
	target.physical_quantity += origin.physical_quantity;
	target.fit_quantity += origin.fit_quantity;
	target.unfit_quantity += origin.unfit_quantity;
	if (origin.purchase_document) target.documented_quantity += origin.physical_quantity;
	else target.undocumented_quantity += origin.physical_quantity;
};

const warehouseById = (branchId: number, warehouseId: number | null): IWarehouseCompact | null =>
	warehouseId === null
		? null
		: ((inventoryWarehousesByBranch[branchId] ?? []).find(
				(warehouse) => warehouse.id === warehouseId,
			) ?? { id: warehouseId, name: `Bodega #${warehouseId}` });

/** Agrega las procedencias de la sucursal por producto y por ubicación. */
const aggregateBranch = (branchId: number): Map<number, IProductAggregate> => {
	const products = new Map<number, IProductAggregate>();
	readInventoryBranchOrigins(branchId).forEach((origin) => {
		const product = resolveInventoryStockProduct(origin.product_id);
		// Mismo criterio que `listInventoryStock`: sin producto resoluble no hay
		// fila, y las series tienen su propia consulta (§3).
		if (!product || product.serial_tracking) return;

		const aggregate = products.get(product.id) ?? {
			product,
			totals: emptyBreakdown(null),
			byWarehouse: new Map<number | null, IInventoryWarehouseBreakdown>(),
		};
		const location =
			aggregate.byWarehouse.get(origin.warehouse_id) ??
			emptyBreakdown(warehouseById(branchId, origin.warehouse_id));
		addOrigin(aggregate.totals, origin);
		addOrigin(location, origin);
		aggregate.byWarehouse.set(origin.warehouse_id, location);
		products.set(product.id, aggregate);
	});
	return products;
};

/** «Sin ubicación» primero y luego por nombre, como pide A1. */
const sortedBreakdown = (aggregate: IProductAggregate): IInventoryWarehouseBreakdown[] =>
	[...aggregate.byWarehouse.values()]
		.filter((location) => location.physical_quantity !== 0)
		.sort((a, b) => {
			if (a.warehouse === null) return -1;
			if (b.warehouse === null) return 1;
			return a.warehouse.name.localeCompare(b.warehouse.name, 'es');
		});

const heldQuantity = (branchId: number, productId: number): number =>
	inventoryStockHolds
		.filter((hold) => hold.branch_id === branchId && hold.product_id === productId)
		.reduce((total, hold) => total + hold.reserved_quantity, 0);

const statusFor = (available: number, threshold: number | null): TCriticalStockStatus => {
	if (threshold === null) return 'unconfigured';
	return available <= threshold ? 'critical' : 'healthy';
};

const criticalStockFor = (
	branchId: number,
	aggregate: IProductAggregate,
): IInventoryCriticalStock | null => {
	if (aggregate.product.serial_tracking) return null;
	const held = heldQuantity(branchId, aggregate.product.id);
	const available = aggregate.totals.fit_quantity - held;
	const threshold = getInventoryCriticalThreshold(aggregate.product.id);
	return {
		scope: 'branch',
		physical_quantity: aggregate.totals.physical_quantity,
		fit_quantity: aggregate.totals.fit_quantity,
		unfit_quantity: aggregate.totals.unfit_quantity,
		held_quantity: held,
		available_quantity: available,
		threshold,
		status: statusFor(available, threshold),
	};
};

/**
 * Estado visible de la sucursal: `out` (disponible ≤ 0) gana a los tres del
 * §13. Los estados son excluyentes, igual que la etiqueta de la tabla y el
 * orden `stock_status`: un producto sin disponible no cuenta ni se filtra
 * también como «bajo el umbral» o «sin umbral».
 */
const visibleStockStatus = (
	critical: IInventoryCriticalStock | null,
): TInventoryStockStatusFilter | null => {
	if (!critical) return null;
	return critical.available_quantity <= 0 ? 'out' : critical.status;
};

const matchesStockStatus = (
	critical: IInventoryCriticalStock | null,
	filter: TInventoryStockStatusFilter | undefined,
): boolean => {
	if (!filter) return true;
	return visibleStockStatus(critical) === filter;
};

/**
 * Filas de A1 de toda la sucursal con su `critical_stock`, sin filtros ni
 * página. Base del mock de Reportes › Inventario, que compara sucursales.
 */
export const readInventoryBranchRows = (branchId: number): IInventoryOverviewRow[] => {
	const rows: IInventoryOverviewRow[] = [];
	aggregateBranch(branchId).forEach((aggregate) => {
		if (aggregate.totals.physical_quantity === 0) return;
		rows.push({
			product: aggregate.product,
			...quantitiesOf(aggregate.totals),
			warehouses: sortedBreakdown(aggregate),
			critical_stock: criticalStockFor(branchId, aggregate),
		});
	});
	return rows;
};

/* =================================================
   Contexto de ubicación (mismas reglas que §3)
   ================================================= */

const STOCK_STATUS_VALUES: readonly TInventoryStockStatusFilter[] = [
	'critical',
	'healthy',
	'unconfigured',
	'out',
];

const SORT_VALUES: readonly TInventoryStockSort[] = [
	'name',
	'-name',
	'physical_quantity',
	'-physical_quantity',
	'available_quantity',
	'-available_quantity',
	'location',
	'-location',
	'stock_status',
	'-stock_status',
];

const validBranch = (branchId: number): void => {
	if (!Number.isInteger(branchId) || branchId <= 0)
		throw inventoryMockError(422, 'INVALID_FILTER', 'Selecciona una sucursal válida.');
};

const locationContext = (
	branchId: number,
	params: IInventoryStockListParams,
): IInventoryLocationContext => {
	validBranch(branchId);
	if (params.warehouse_id !== undefined && params.unlocated !== undefined)
		throw inventoryMockError(
			422,
			'INVALID_FILTER',
			'Bodega y Sin ubicación son filtros excluyentes.',
		);
	if (params.warehouse_id !== undefined) {
		const warehouse = (inventoryWarehousesByBranch[branchId] ?? []).find(
			(item) => item.id === params.warehouse_id,
		);
		if (!warehouse)
			throw inventoryMockError(
				422,
				'WAREHOUSE_INVALID',
				'La bodega no pertenece a la sucursal.',
			);
		return { scope: 'warehouse', branch_id: branchId, warehouse: { ...warehouse } };
	}
	if (params.unlocated === 1) return { scope: 'unlocated', branch_id: branchId, warehouse: null };
	return { scope: 'branch', branch_id: branchId, warehouse: null };
};

const locationTotals = (
	aggregate: IProductAggregate,
	context: IInventoryLocationContext,
): IInventoryWarehouseBreakdown | undefined => {
	if (context.scope === 'branch') return aggregate.totals;
	const key = context.scope === 'unlocated' ? null : (context.warehouse?.id ?? null);
	return aggregate.byWarehouse.get(key);
};

/** Primera ubicación del reparto, en el mismo orden en que se muestra. */
const compareLocation = (a: IInventoryOverviewRow, b: IInventoryOverviewRow): number => {
	const first = a.warehouses[0];
	const second = b.warehouses[0];
	if (!first || !second) return Number(!first) - Number(!second);
	if (first.warehouse === null || second.warehouse === null)
		return Number(first.warehouse !== null) - Number(second.warehouse !== null);
	return first.warehouse.name.localeCompare(second.warehouse.name, 'es');
};

/** De más a menos urgente; sin estado (series) al final. */
const STOCK_STATUS_RANK: Record<TInventoryStockStatusFilter, number> = {
	out: 0,
	critical: 1,
	unconfigured: 2,
	healthy: 3,
};

const stockStatusRank = (critical: IInventoryCriticalStock | null): number => {
	const status = visibleStockStatus(critical);
	return status === null ? Object.keys(STOCK_STATUS_RANK).length : STOCK_STATUS_RANK[status];
};

const compareRows =
	(sort: TInventoryStockSort) =>
	(a: IInventoryOverviewRow, b: IInventoryOverviewRow): number => {
		const descending = sort.startsWith('-');
		const field = descending ? sort.slice(1) : sort;
		let comparison: number;
		if (field === 'location') comparison = compareLocation(a, b);
		else if (field === 'stock_status')
			comparison = stockStatusRank(a.critical_stock) - stockStatusRank(b.critical_stock);
		else if (field === 'physical_quantity')
			comparison = a.physical_quantity - b.physical_quantity;
		else if (field === 'available_quantity')
			comparison =
				(a.critical_stock?.available_quantity ?? 0) -
				(b.critical_stock?.available_quantity ?? 0);
		else comparison = a.product.name.localeCompare(b.product.name, 'es');
		return (descending ? -comparison : comparison) || a.product.id - b.product.id;
	};

/* =================================================
   A1 · GET B/inventory-stock?include=warehouses
   ================================================= */

export const listInventoryOverview = async (
	branchId: number,
	params: IInventoryOverviewParams,
	signal?: AbortSignal,
): Promise<IInventoryOverviewResponse> => {
	let context: IInventoryLocationContext;
	try {
		context = locationContext(branchId, params);
		if (params.stock_status !== undefined && !STOCK_STATUS_VALUES.includes(params.stock_status))
			throw inventoryMockError(422, 'INVALID_FILTER', 'El estado de stock no es válido.');
		if (params.sort !== undefined && !SORT_VALUES.includes(params.sort))
			throw inventoryMockError(422, 'INVALID_FILTER', 'El orden no es válido.');
	} catch (error) {
		return Promise.reject(error);
	}

	const search = params.search?.trim().toLocaleLowerCase() ?? '';
	const rows: IInventoryOverviewRow[] = [];
	aggregateBranch(branchId).forEach((aggregate) => {
		const totals = locationTotals(aggregate, context);
		if (!totals || totals.physical_quantity === 0) return;
		const { product } = aggregate;
		if (
			search &&
			!product.name.toLocaleLowerCase().includes(search) &&
			!product.sku.toLocaleLowerCase().includes(search)
		)
			return;
		if (params.brand_id !== undefined && product.brand?.id !== params.brand_id) return;
		if (
			params.category_id !== undefined &&
			!product.categories.some((category) => category.id === params.category_id)
		)
			return;
		const critical = criticalStockFor(branchId, aggregate);
		if (!matchesStockStatus(critical, params.stock_status)) return;

		rows.push({
			product,
			...quantitiesOf(totals),
			warehouses: sortedBreakdown(aggregate),
			critical_stock: critical,
		});
	});
	rows.sort(compareRows(params.sort ?? 'name'));

	return inventoryMockDelay(
		{
			...paginateInventoryMock(rows, `/api/branches/${branchId}/inventory-stock`, params),
			context,
		},
		signal,
	);
};

/* =================================================
   A2 · GET B/inventory-stock/summary
   ================================================= */

export const getInventoryStockSummary = async (
	branchId: number,
	signal?: AbortSignal,
): Promise<IInventoryStockSummaryResponse> => {
	try {
		validBranch(branchId);
	} catch (error) {
		return Promise.reject(error);
	}
	const summary = {
		products_count: 0,
		physical_quantity: 0,
		unfit_quantity: 0,
		undocumented_quantity: 0,
		unlocated_quantity: 0,
		critical_count: 0,
		out_count: 0,
		unconfigured_count: 0,
	};
	aggregateBranch(branchId).forEach((aggregate) => {
		if (aggregate.totals.physical_quantity === 0) return;
		const critical = criticalStockFor(branchId, aggregate);
		summary.products_count += 1;
		summary.physical_quantity += aggregate.totals.physical_quantity;
		summary.unfit_quantity += aggregate.totals.unfit_quantity;
		summary.undocumented_quantity += aggregate.totals.undocumented_quantity;
		summary.unlocated_quantity += aggregate.byWarehouse.get(null)?.physical_quantity ?? 0;
		if (matchesStockStatus(critical, 'critical')) summary.critical_count += 1;
		if (matchesStockStatus(critical, 'out')) summary.out_count += 1;
		if (matchesStockStatus(critical, 'unconfigured')) summary.unconfigured_count += 1;
	});
	return inventoryMockDelay(
		{ data: summary, context: { scope: 'branch', branch_id: branchId, warehouse: null } },
		signal,
	);
};

/* =================================================
   A3 · GET B/inventory-stock/warehouses
   ================================================= */

/** Agregado vacío de una bodega con su ficha (o «Sin ubicación» si es `null`). */
const emptyWarehouseAggregate = (
	warehouse: IWarehouseCompact | null,
): IInventoryWarehouseAggregate => {
	const profile = warehouse ? inventoryWarehouseProfiles[warehouse.id] : undefined;
	return {
		warehouse: warehouse && {
			...warehouse,
			code: profile?.code ?? null,
			warehouse_type: profile?.warehouse_type ?? null,
			is_active: profile?.is_active ?? true,
			description: profile?.description ?? null,
			manager_name: profile?.manager_name ?? null,
			address: profile?.address ?? null,
			commune_name: profile?.commune_name ?? null,
			schedule: profile?.schedule ?? null,
			requires_serial_tracking: profile?.requires_serial_tracking ?? false,
		},
		capacity: null,
		maximum_capacity: profile?.maximum_capacity ?? null,
		product_count: 0,
		physical_quantity: 0,
		unfit_quantity: 0,
		undocumented_quantity: 0,
		critical_count: 0,
	};
};

export const listInventoryWarehouseAggregates = async (
	branchId: number,
	signal?: AbortSignal,
): Promise<IInventoryWarehouseAggregatesResponse> => {
	try {
		validBranch(branchId);
	} catch (error) {
		return Promise.reject(error);
	}
	const aggregates = new Map<number | null, IInventoryWarehouseAggregate>();
	(inventoryWarehousesByBranch[branchId] ?? []).forEach((warehouse) => {
		aggregates.set(warehouse.id, emptyWarehouseAggregate(warehouse));
	});

	aggregateBranch(branchId).forEach((aggregate) => {
		const isCritical = matchesStockStatus(criticalStockFor(branchId, aggregate), 'critical');
		aggregate.byWarehouse.forEach((location, warehouseId) => {
			if (location.physical_quantity === 0) return;
			const target =
				aggregates.get(warehouseId) ??
				emptyWarehouseAggregate(warehouseById(branchId, warehouseId));
			target.product_count += 1;
			target.physical_quantity += location.physical_quantity;
			target.unfit_quantity += location.unfit_quantity;
			target.undocumented_quantity += location.undocumented_quantity;
			if (isCritical) target.critical_count += 1;
			aggregates.set(warehouseId, target);
		});
	});

	const data = [...aggregates.values()].sort((a, b) => {
		if (a.warehouse === null) return -1;
		if (b.warehouse === null) return 1;
		return a.warehouse.name.localeCompare(b.warehouse.name, 'es');
	});
	return inventoryMockDelay(
		{ data, context: { scope: 'branch', branch_id: branchId, warehouse: null } },
		signal,
	);
};

/* =================================================
   A4 · GET B/inventory-stock/{product}
   ================================================= */

export const getInventoryStockDetail = async (
	branchId: number,
	productId: number,
	signal?: AbortSignal,
): Promise<IInventoryStockDetailResponse> => {
	try {
		validBranch(branchId);
	} catch (error) {
		return Promise.reject(error);
	}
	const product = resolveInventoryStockProduct(productId);
	if (!product)
		return Promise.reject(
			inventoryMockError(404, 'NOT_FOUND', 'El producto no existe en esta sucursal.'),
		);

	const aggregate = aggregateBranch(branchId).get(productId) ?? {
		product,
		totals: emptyBreakdown(null),
		byWarehouse: new Map<number | null, IInventoryWarehouseBreakdown>(),
	};
	return inventoryMockDelay(
		{
			data: {
				product: {
					...product,
					critical_stock_threshold: product.serial_tracking
						? null
						: getInventoryCriticalThreshold(productId),
				},
				...quantitiesOf(aggregate.totals),
				warehouses: sortedBreakdown(aggregate),
				critical_stock: criticalStockFor(branchId, aggregate),
				// El mock no modela series en esta consulta (§3 excluye serializados).
				series_summary: null,
			},
			context: { scope: 'branch', branch_id: branchId, warehouse: null },
		},
		signal,
	);
};
