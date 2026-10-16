import INVENTORY_OVERVIEW_USE_MOCKS from '@/config/inventoryOverview.config';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import * as inventoryOverviewMock from '@/mocks/services/inventoryOverview.mock';
import ApiService from '@/services/ApiService';
import {
	listBranchWarehouseProfiles,
	type IBranchWarehouseProfile,
} from '@/services/procurement/branchWarehouses.service';
import {
	fetchInventoryOriginsPage,
	fetchInventoryStockPage,
} from '@/services/procurement/inventoryStock.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type {
	IInventoryCriticalStock,
	IInventoryOverviewParams,
	IInventoryOverviewResponse,
	IInventoryStockDetail,
	IInventoryStockDetailResponse,
	IInventoryStockSummaryResponse,
	IInventoryWarehouseAggregate,
	IInventoryWarehouseAggregatesResponse,
	IInventoryWarehouseBreakdown,
} from '@/interface/inventoryOverview.interface';
import type {
	IInventoryLocationParams,
	IInventoryStockRow,
	IProcurementProduct,
} from '@/interface/procurement.interface';

/**
 * Vista unificada de Inventario — A1–A4 de
 * `Docs/inventario-unificado-contrato.md` y el umbral crítico del §13 del
 * contrato de abastecimiento (tarea 19 del backend).
 *
 * Fachada con la firma pública de siempre: el slice importa sólo de aquí. Con
 * `VITE_INVENTORY_OVERVIEW_USE_MOCKS` encendida delega en el doble
 * (`@/mocks/services/inventoryOverview.mock`), que agrega las procedencias del
 * stock simulado. Apagada, arma cada pieza con lo único que el backend publica
 * para leer stock (verificado en Laravel Boost y en sus FormRequests):
 * `GET B/inventory-stock` (productos sin serie, orden nombre e id, filtros
 * `warehouse_id`/`unlocated`/`search`) y `GET B/inventory-stock/{product}/origins`.
 * Permiso: `view-product` y acceso a la sucursal. Las bodegas salen de
 * `GET B/warehouses`, con su propio permiso.
 *
 * El umbral §13 vive en el producto: la ficha lo lee de `GET B/products/{product}`
 * (`critical_stock_threshold` y el bloque `critical_stock` de la filial) y se
 * edita con `updateProduct` de `productsSlice` (`PATCH B/products/{product}`),
 * en las dos etapas del despliegue. `inventory-stock` no lo trae por fila.
 *
 * Lo que no sale de ahí llega `null` en vez de inventarse (ver
 * `INVENTORY_OVERVIEW_FEATURES`): reparto por bodega en la lista, totales de
 * unidades, y umbral, reservas y disponible por fila.
 *
 * Sin caché de `ApiService`: el saldo cambia con cada ajuste, recepción o venta.
 */

/**
 * Qué puede ofrecer la vista según su fuente. El doble lo simula todo; la API
 * real no publica estas piezas, así que la UI las oculta en vez de mostrarlas
 * vacías o en cero.
 */
export interface IInventoryOverviewFeatures {
	/** Ordenar por algo distinto de nombre (la ruta real ordena por nombre e id). */
	sort: boolean;
	/** Estado de stock (umbral §13 + reservas) y su filtro. */
	stockStatus: boolean;
	/** Disponible para vender y unidades reservadas. */
	availability: boolean;
	/** Ver y editar el umbral crítico en la ficha del producto. */
	threshold: boolean;
	/** Umbral y estado en las filas de la lista (`inventory-stock` no los trae). */
	rowThreshold: boolean;
	/**
	 * Unidades y alertas por bodega o de la sucursal: desde la API real exigirían
	 * recorrer todas las páginas de cada ubicación.
	 */
	unitTotals: boolean;
}

export const INVENTORY_OVERVIEW_FEATURES: IInventoryOverviewFeatures = {
	sort: INVENTORY_OVERVIEW_USE_MOCKS,
	stockStatus: INVENTORY_OVERVIEW_USE_MOCKS,
	availability: INVENTORY_OVERVIEW_USE_MOCKS,
	// La API real publica el umbral en el producto. El simulado lo comparten la
	// ficha y Reportes (bandera de stock): la ficha sólo lo ofrece si lee del
	// mismo doble que lo guarda.
	threshold: !INVENTORY_OVERVIEW_USE_MOCKS || INVENTORY_STOCK_USE_MOCKS,
	rowThreshold: INVENTORY_OVERVIEW_USE_MOCKS && INVENTORY_STOCK_USE_MOCKS,
	unitTotals: INVENTORY_OVERVIEW_USE_MOCKS,
};

/**
 * La ficha guarda el umbral en la API real (`updateProduct`) en vez del doble.
 * Reportes sigue simulado y usa siempre el doble.
 */
export const INVENTORY_THRESHOLD_USES_API = !INVENTORY_OVERVIEW_USE_MOCKS;

const NOT_FOUND_STATUS = 404;
const FORBIDDEN_STATUS = 403;
/** Máximo de `per_page` que acepta `IndexInventoryStockRequest`. */
const MAX_PER_PAGE = 100;
/** Máximo de `search` que acepta `IndexInventoryStockRequest`. */
const SEARCH_MAX_LENGTH = 100;

type TInventoryOverviewService = Pick<
	typeof inventoryOverviewMock,
	| 'listInventoryOverview'
	| 'getInventoryStockSummary'
	| 'listInventoryWarehouseAggregates'
	| 'getInventoryStockDetail'
>;

/** Ubicación como filtro de la ruta: `unlocated` sólo encendido, nunca junto a una bodega. */
const locationQuery = (warehouseId: number | null): IInventoryLocationParams =>
	warehouseId === null ? { unlocated: 1 } : { warehouse_id: warehouseId };

/** Productos con stock en el alcance: sólo hace falta `meta.total`. */
const countProducts = async (
	branchId: number,
	location: IInventoryLocationParams,
	signal?: AbortSignal,
): Promise<number> => {
	const response = await fetchInventoryStockPage(
		branchId,
		{ ...location, page: 1, per_page: 1 },
		signal,
	);
	return response.meta.total;
};

/**
 * Bodegas de la sucursal. Sin permiso para el catálogo (403) devuelve `null`:
 * se conocen sólo «Sin ubicación» y el total, no qué bodegas hay, y quien lo
 * consume lo declara (`warehouses_complete: false`) en vez de presentar un
 * reparto incompleto como vacío. Cualquier otro fallo se informa.
 */
const warehouseProfiles = async (
	branchId: number,
	signal?: AbortSignal,
): Promise<IBranchWarehouseProfile[] | null> => {
	try {
		return await listBranchWarehouseProfiles(branchId, signal);
	} catch (error: unknown) {
		if (resolveProcurementError(error).status === FORBIDDEN_STATUS) return null;
		throw error;
	}
};

/**
 * La fila de un producto en un alcance. La ruta no filtra por producto: busca
 * por su SKU (o su nombre) y recorre las páginas hasta dar con su id. Sin fila,
 * el producto no tiene stock ahí (la ruta omite los saldos en cero).
 */
const findProductRow = async (
	branchId: number,
	product: IProcurementProduct,
	location: IInventoryLocationParams,
	signal?: AbortSignal,
): Promise<IInventoryStockRow | null> => {
	const search = (product.sku.trim() || product.name.trim()).slice(0, SEARCH_MAX_LENGTH);
	let page = 1;
	let lastPage = 1;
	do {
		// eslint-disable-next-line no-await-in-loop -- se corta en cuanto aparece el producto
		const response = await fetchInventoryStockPage(
			branchId,
			{ ...location, search, page, per_page: MAX_PER_PAGE },
			signal,
		);
		const row = response.data.find((candidate) => candidate.product.id === product.id);
		if (row) return row;
		lastPage = response.meta.last_page;
		page += 1;
	} while (page <= lastPage);
	return null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: null;

const asInteger = (value: unknown): number | null =>
	typeof value === 'number' && Number.isInteger(value) ? value : null;

const CRITICAL_STATUSES: readonly IInventoryCriticalStock['status'][] = [
	'critical',
	'healthy',
	'unconfigured',
];

/**
 * Bloque `critical_stock` de `ProductResource` tal como llega: de la filial y
 * con el estado ya calculado, que no se recalcula. Un bloque que no calce con
 * la forma publicada es `null`: no se afirma un estado que no se puede leer.
 */
const toCriticalStock = (value: unknown): IInventoryCriticalStock | null => {
	const block = asRecord(value);
	if (!block) return null;
	const status = CRITICAL_STATUSES.find((candidate) => candidate === block.status);
	const physical = asInteger(block.physical_quantity);
	const fit = asInteger(block.fit_quantity);
	const unfit = asInteger(block.unfit_quantity);
	const held = asInteger(block.held_quantity);
	// Puede ser negativo tras un faltante real: se muestra como llega.
	const available = asInteger(block.available_quantity);
	const threshold = asInteger(block.threshold);
	if (
		!status ||
		physical === null ||
		fit === null ||
		unfit === null ||
		held === null ||
		available === null ||
		(threshold === null && block.threshold !== null)
	)
		return null;
	const subsidiaryId = asInteger(block.subsidiary_id);
	return {
		scope: 'subsidiary',
		...(subsidiaryId === null ? {} : { subsidiary_id: subsidiaryId }),
		physical_quantity: physical,
		fit_quantity: fit,
		unfit_quantity: unfit,
		held_quantity: held,
		available_quantity: available,
		threshold,
		status,
	};
};

interface IProductThreshold {
	threshold: number | null;
	critical_stock: IInventoryCriticalStock | null;
	threshold_branch_id: number | null;
}

const UNKNOWN_THRESHOLD: IProductThreshold = {
	threshold: null,
	critical_stock: null,
	threshold_branch_id: null,
};

/**
 * Umbral §13 del producto, de `GET B/products/{product}` (`view-product`).
 * `origin_branch_id` es la sucursal dueña, la única cuya ruta lo edita. Un
 * producto con serie no lleva umbral. Si la ruta no muestra el producto
 * (403/404) la ficha sigue, sin umbral ni edición.
 */
const fetchProductThreshold = async (
	branchId: number,
	productId: number,
	signal?: AbortSignal,
): Promise<IProductThreshold> => {
	try {
		const response = await ApiService.fetchData<unknown>({
			url: `/branches/${branchId}/products/${productId}`,
			method: 'get',
			signal,
		});
		const envelope = asRecord(response.data);
		const resource = asRecord(envelope?.data) ?? envelope;
		if (!resource || resource.serial_tracking === true) return UNKNOWN_THRESHOLD;
		const critical = toCriticalStock(resource.critical_stock);
		return {
			threshold: critical ? critical.threshold : null,
			critical_stock: critical,
			threshold_branch_id: asInteger(resource.origin_branch_id),
		};
	} catch (error: unknown) {
		const { status } = resolveProcurementError(error);
		if (status === FORBIDDEN_STATUS || status === NOT_FOUND_STATUS) return UNKNOWN_THRESHOLD;
		throw error;
	}
};

const toBreakdown = (
	row: IInventoryStockRow,
	warehouse: IBranchWarehouseProfile | null,
): IInventoryWarehouseBreakdown => ({
	warehouse: warehouse ? { id: warehouse.id, name: warehouse.name } : null,
	physical_quantity: row.physical_quantity,
	fit_quantity: row.fit_quantity,
	unfit_quantity: row.unfit_quantity,
	documented_quantity: row.documented_quantity,
	undocumented_quantity: row.undocumented_quantity,
});

const toAggregate = (
	warehouse: IBranchWarehouseProfile | null,
	productCount: number,
): IInventoryWarehouseAggregate => {
	if (!warehouse)
		return {
			warehouse: null,
			capacity: null,
			maximum_capacity: null,
			product_count: productCount,
			physical_quantity: null,
			unfit_quantity: null,
			undocumented_quantity: null,
			critical_count: null,
		};
	const { capacity, maximum_capacity: maximumCapacity, ...info } = warehouse;
	return {
		warehouse: info,
		capacity,
		maximum_capacity: maximumCapacity,
		product_count: productCount,
		physical_quantity: null,
		unfit_quantity: null,
		undocumented_quantity: null,
		critical_count: null,
	};
};

const apiInventoryOverview: TInventoryOverviewService = {
	// `include`, `sort`, `stock_status`, `brand_id` y `category_id` no existen en
	// la ruta real: se omiten en vez de mandarlos (serían ignorados o 422).
	listInventoryOverview: async (
		branchId: number,
		params: IInventoryOverviewParams,
		signal?: AbortSignal,
	): Promise<IInventoryOverviewResponse> => {
		const { warehouse_id: warehouseId, unlocated, search, page, per_page: perPage } = params;
		const term = search?.trim().slice(0, SEARCH_MAX_LENGTH);
		let location: IInventoryLocationParams = {};
		if (typeof warehouseId === 'number') location = locationQuery(warehouseId);
		else if (unlocated === 1) location = locationQuery(null);
		const response = await fetchInventoryStockPage(
			branchId,
			{ ...location, ...(term ? { search: term } : {}), page, per_page: perPage },
			signal,
		);
		return {
			...response,
			data: response.data.map((row) => ({ ...row, warehouses: null, critical_stock: null })),
		};
	},
	getInventoryStockSummary: async (
		branchId: number,
		signal?: AbortSignal,
	): Promise<IInventoryStockSummaryResponse> => {
		const [branch, unlocated] = await Promise.all([
			fetchInventoryStockPage(branchId, { page: 1, per_page: 1 }, signal),
			countProducts(branchId, locationQuery(null), signal),
		]);
		return {
			data: {
				products_count: branch.meta.total,
				unlocated_products_count: unlocated,
				physical_quantity: null,
				unfit_quantity: null,
				undocumented_quantity: null,
				unlocated_quantity: null,
				critical_count: null,
				out_count: null,
				unconfigured_count: null,
			},
			context: branch.context,
		};
	},
	// «Sin ubicación» primero y las bodegas en el orden del catálogo. Una bodega
	// inactiva sólo aparece si todavía guarda productos.
	listInventoryWarehouseAggregates: async (
		branchId: number,
		signal?: AbortSignal,
	): Promise<IInventoryWarehouseAggregatesResponse> => {
		const warehouses = await warehouseProfiles(branchId, signal);
		const locations: (IBranchWarehouseProfile | null)[] = [null, ...(warehouses ?? [])];
		const counts = await Promise.all(
			locations.map((warehouse) =>
				countProducts(branchId, locationQuery(warehouse?.id ?? null), signal),
			),
		);
		return {
			data: locations
				.map((warehouse, index) => toAggregate(warehouse, counts[index]))
				.filter(
					(aggregate) =>
						aggregate.warehouse === null ||
						aggregate.warehouse.is_active ||
						aggregate.product_count > 0,
				),
			context: { scope: 'branch', branch_id: branchId, warehouse: null },
			warehouses_complete: warehouses !== null,
		};
	},
	// La ficha del producto sale de `origins` (también responde 404 si tiene
	// serie o es de otra filial); las cifras, de su fila en la sucursal y en cada
	// ubicación; el umbral y su bloque de la filial, del producto. Sin resumen
	// de series: no está publicado.
	getInventoryStockDetail: async (
		branchId: number,
		productId: number,
		signal?: AbortSignal,
	): Promise<IInventoryStockDetailResponse> => {
		const [origins, warehouses, productThreshold] = await Promise.all([
			fetchInventoryOriginsPage(branchId, productId, { page: 1, per_page: 1 }, signal),
			warehouseProfiles(branchId, signal),
			fetchProductThreshold(branchId, productId, signal),
		]);
		const { product } = origins.context;
		const locations: (IBranchWarehouseProfile | null)[] = [null, ...(warehouses ?? [])];
		const [branchRow, ...locationRows] = await Promise.all([
			findProductRow(branchId, product, {}, signal),
			...locations.map((warehouse) =>
				findProductRow(branchId, product, locationQuery(warehouse?.id ?? null), signal),
			),
		]);
		const detail: IInventoryStockDetail = {
			product: { ...product, critical_stock_threshold: productThreshold.threshold },
			physical_quantity: branchRow?.physical_quantity ?? 0,
			fit_quantity: branchRow?.fit_quantity ?? 0,
			unfit_quantity: branchRow?.unfit_quantity ?? 0,
			documented_quantity: branchRow?.documented_quantity ?? 0,
			undocumented_quantity: branchRow?.undocumented_quantity ?? 0,
			warehouses: locations.flatMap((warehouse, index) => {
				const row = locationRows[index];
				return row ? [toBreakdown(row, warehouse)] : [];
			}),
			warehouses_complete: warehouses !== null,
			critical_stock: productThreshold.critical_stock,
			threshold_branch_id: productThreshold.threshold_branch_id,
			series_summary: null,
		};
		return {
			data: detail,
			context: { scope: 'branch', branch_id: branchId, warehouse: null },
		};
	},
};

/** 404 de la ficha: producto con serie o de otra filial (lo decide `origins`). */
export const isInventoryDetailNotFound = (error: unknown): boolean =>
	resolveProcurementError(error).status === NOT_FOUND_STATUS;

const inventoryOverview: TInventoryOverviewService = INVENTORY_OVERVIEW_USE_MOCKS
	? inventoryOverviewMock
	: apiInventoryOverview;

/** A1 · una fila por producto; en la API real, `GET B/inventory-stock`. */
export const { listInventoryOverview } = inventoryOverview;

/** A2 · totales de la sucursal; en la API real, sólo los conteos de productos. */
export const { getInventoryStockSummary } = inventoryOverview;

/** A3 · una fila por ubicación; en la API real, bodegas y productos por ubicación. */
export const { listInventoryWarehouseAggregates } = inventoryOverview;

/** A4 · ficha de un producto; en la API real, `origins` y su fila por ubicación. */
export const { getInventoryStockDetail } = inventoryOverview;

/**
 * §13 en el doble: umbral crítico del producto, entero ≥ 0 o `null` para
 * desactivarlo. Lo usan Reportes (simulado con `VITE_INVENTORY_STOCK_USE_MOCKS`)
 * y la ficha simulada. Contra la API real la ficha usa `updateProduct` (ver
 * `INVENTORY_THRESHOLD_USES_API`).
 */
export const { updateInventoryCriticalThreshold } = inventoryOverviewMock;
