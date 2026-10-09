import INVENTORY_ADJUSTMENTS_USE_MOCKS from '@/config/inventoryAdjustments.config';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import INVENTORY_TRANSFERS_USE_MOCKS from '@/config/inventoryTransfers.config';
import * as inventoryStockMock from '@/mocks/services/inventoryStock.mock';
import ApiService from '@/services/ApiService';
import { buildProcurementWriteHeaders } from '@/utils/procurementWrite.util';
import {
	rejectEndpointNotPublished,
	throwEndpointNotPublished,
} from '@/utils/procurementEndpoint.util';
import type {
	IApiResourceEnvelope,
	IInventoryAdjustableProductsPage,
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryOriginsParams,
	IInventoryOriginsResponse,
	IInventoryProductRef,
	IInventoryStockAvailability,
	IInventoryStockListParams,
	IInventoryStockResponse,
	ITransferWarehouse,
	IWarehouseStockMovement,
	IWarehouseStockMovementPayload,
} from '@/interface/procurement.interface';

export type { IInventoryStockAvailability } from '@/interface/procurement.interface';

/**
 * Stock por ubicación, traslados, ajustes y documentación posterior —
 * secciones 3, 8, 9 y 11 del contrato de abastecimiento.
 *
 * Fachada con la firma pública de siempre: slices, hooks y vistas importan
 * sólo de aquí. Con `VITE_INVENTORY_STOCK_USE_MOCKS` encendida delega en el
 * doble (`@/mocks/services/inventoryStock.mock`), que guarda las procedencias
 * simuladas que también escriben las recepciones. Apagada, usa la API real.
 *
 * **Publicadas** (backend `feat/procurement-stock-read-adjust`, sólo productos
 * no serializados), verificadas contra sus FormRequests y Resources:
 * - `GET B/inventory-stock` y `GET B/inventory-stock/{product}/origins`:
 *   `view-product` y acceso a la sucursal; los `*-member` también leen.
 *   `origins` responde 404 si el producto es serializado o de otra filial.
 * - `POST B/inventory-adjustments` y `POST B/warehouse-stock-movements`
 *   (backend `feat/procurement-warehouse-stock-movements`): `edit-product` y
 *   además **operar** en la sucursal (los `subsidiary-member`/`company-member`
 *   reciben 403 aunque tengan el permiso). Exigen `Idempotency-Key`: sin ella,
 *   428.
 *
 * **Sin publicar** (rechazan con `ProcurementEndpointNotPublishedError` en vez
 * de inventar datos): documentación posterior (`document-allocations`) y la
 * lectura auxiliar de filtros de procedencia.
 *
 * Sin caché de `ApiService`: el saldo cambia con cada ajuste, recepción o
 * venta, y el slice ya descarta respuestas tardías por `requestId`.
 */

const RESOURCE = 'el inventario por ubicación';
const B = '/branches/{branch}';
const P = '/subsidiaries/{subsidiary}/procurement';

const rejectNotPublished = (endpoint: string): Promise<never> =>
	rejectEndpointNotPublished(RESOURCE, endpoint);

const throwNotPublished = (endpoint: string): never =>
	throwEndpointNotPublished(RESOURCE, endpoint);

interface IInventoryWriteHeaders {
	idempotencyKey?: string;
}

type TInventoryStockService = Pick<
	typeof inventoryStockMock,
	| 'listInventoryStock'
	| 'listInventoryOrigins'
	| 'searchInventoryAdjustableProducts'
	| 'getInventoryAdjustableProduct'
	| 'createInventoryDocumentAllocation'
	| 'listInitialStockAllocationsForPurchaseDocument'
	| 'getInventoryWarehouses'
	| 'getInventoryOriginFilterOptions'
> & {
	createInventoryAdjustment: (
		branchId: number,
		payload: IInventoryAdjustmentPayload,
		headers?: IInventoryWriteHeaders,
	) => Promise<{ data: IInventoryAdjustment }>;
	createWarehouseStockMovement: (
		branchId: number,
		payload: IWarehouseStockMovementPayload,
		headers?: IInventoryWriteHeaders,
	) => Promise<{ data: IWarehouseStockMovement }>;
	/** Bodegas de la sucursal con su estado, para el origen y el destino del traslado. */
	listTransferWarehouses: (
		branchId: number,
		signal?: AbortSignal,
	) => Promise<ITransferWarehouse[]>;
	/** `null`: el entorno no publica reservas, así que el disponible no se conoce. */
	getInventoryStockAvailability: (
		branchId: number,
		productId: number,
	) => IInventoryStockAvailability | null;
};

const branchUrl = (branchId: number): string => `/branches/${branchId}`;

/** Sin clave el backend responde 428: no se inventa una acá, porque sólo quien reintenta sabe si la tentativa es la misma. */
const writeHeaders = (headers: IInventoryWriteHeaders) =>
	headers.idempotencyKey
		? buildProcurementWriteHeaders({ idempotencyKey: headers.idempotencyKey })
		: undefined;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const NOT_FOUND_STATUS = 404;

const WAREHOUSES_PER_PAGE = 100;

/** Una fila sin `id`, `name` o `is_active` legibles no se ofrece: no se podría nombrar ni validar. */
const toTransferWarehouse = (value: unknown): ITransferWarehouse[] => {
	const record = asRecord(value);
	const { id, name, is_active: isActive } = record ?? {};
	if (typeof id !== 'number' || typeof name !== 'string' || typeof isActive !== 'boolean')
		return [];
	return [{ id, name, is_active: isActive }];
};

/** `GET B/warehouses` (`view-warehouse`): una página del listado de bodegas de la sucursal. */
const fetchWarehousePage = async (
	branchId: number,
	page: number,
	signal?: AbortSignal,
): Promise<{ warehouses: ITransferWarehouse[]; lastPage: number }> => {
	const response = await ApiService.fetchData<unknown>({
		url: `${branchUrl(branchId)}/warehouses`,
		method: 'get',
		params: { page, per_page: WAREHOUSES_PER_PAGE },
		signal,
	});
	const body = asRecord(response.data);
	const rows = Array.isArray(body?.data) ? body.data : [];
	const lastPage = asRecord(body?.meta)?.last_page;
	return {
		warehouses: rows.flatMap(toTransferWarehouse),
		lastPage: typeof lastPage === 'number' && lastPage > 0 ? lastPage : 1,
	};
};

/**
 * `ProductResource` (envuelto en `data`) es mucho más ancho que lo que nombra
 * una línea. `null` si es serializado: el ajuste lo rechazaría igual. Un cuerpo
 * que no se puede leer no prueba que el producto no sea elegible: se lanza, y
 * el llamador lo trata como resultado incierto.
 */
const toAdjustableProductRef = (body: unknown): IInventoryProductRef | null => {
	const record = asRecord(asRecord(body)?.data ?? body);
	const id = record?.id;
	const name = record?.name;
	if (!record || typeof id !== 'number' || typeof name !== 'string')
		throw new Error('Respuesta de producto ilegible.');
	if (record.serial_tracking === true) return null;
	return { id, name, sku: typeof record.sku === 'string' ? record.sku : '' };
};

/** Coincidencias por búsqueda del ajuste: el selector muestra una página corta. */
const ADJUSTABLE_SEARCH_PER_PAGE = inventoryStockMock.INVENTORY_ADJUSTABLE_SEARCH_LIMIT;
const ADJUSTABLE_SEARCH_MAX_LENGTH = 100;

const listInventoryStockApi = async (
	branchId: number,
	params: IInventoryStockListParams = {},
	signal?: AbortSignal,
): Promise<IInventoryStockResponse> => {
	const response = await ApiService.fetchData<IInventoryStockResponse>({
		url: `${branchUrl(branchId)}/inventory-stock`,
		method: 'get',
		params,
		signal,
	});
	return response.data;
};

const apiInventoryStock: TInventoryStockService = {
	listInventoryStock: listInventoryStockApi,
	listInventoryOrigins: async (
		branchId: number,
		productId: number,
		params: IInventoryOriginsParams = {},
		signal?: AbortSignal,
	) => {
		const response = await ApiService.fetchData<IInventoryOriginsResponse>({
			url: `${branchUrl(branchId)}/inventory-stock/${productId}/origins`,
			method: 'get',
			params,
			signal,
		});
		return response.data;
	},
	// `include_empty=1` es la lectura que el contrato reserva a las pantallas
	// de conteo: trae los productos asignados a la sucursal aunque estén en
	// cero en la ubicación, con su saldo ahí. `search` ya cubre nombre, `sku` y
	// `commercial_sku`. La filial la resuelve el backend desde la sucursal.
	searchInventoryAdjustableProducts: async (
		branchId: number,
		_subsidiaryId: number | null,
		location: IInventoryStockListParams,
		search: string,
		signal?: AbortSignal,
	): Promise<IInventoryAdjustableProductsPage> => {
		// `search` admite hasta 100 caracteres: más largo sería un 422 que el
		// selector mostraría como «sin resultados» de un término imposible.
		const term = search.trim().slice(0, ADJUSTABLE_SEARCH_MAX_LENGTH);
		const response = await listInventoryStockApi(
			branchId,
			{
				...location,
				...(term ? { search: term } : {}),
				include_empty: 1,
				page: 1,
				per_page: ADJUSTABLE_SEARCH_PER_PAGE,
			},
			signal,
		);
		return {
			data: response.data,
			has_more: response.meta.total > response.data.length,
		};
	},
	// `GET /subsidiaries/{subsidiary}/products/{product}` (`view-product`):
	// responde 404 si el producto es de otra filial. Es la regla con que el
	// backend valida `items.*.product_id` (de la filial y no serializado), sin
	// depender del saldo: un conteo puede nombrar un producto en cero.
	getInventoryAdjustableProduct: async (subsidiaryId, productId, signal) => {
		try {
			const response = await ApiService.fetchData<unknown>({
				url: `/subsidiaries/${subsidiaryId}/products/${productId}`,
				method: 'get',
				signal,
			});
			return toAdjustableProductRef(response.data);
		} catch (error: unknown) {
			const status = asRecord(asRecord(error)?.response)?.status;
			if (status === NOT_FOUND_STATUS) return null;
			throw error;
		}
	},
	createInventoryAdjustment: async (branchId, payload, headers = {}) => {
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IInventoryAdjustment>,
			IInventoryAdjustmentPayload
		>({
			url: `${branchUrl(branchId)}/inventory-adjustments`,
			method: 'post',
			data: payload,
			headers: writeHeaders(headers),
		});
		return { data: response.data.data };
	},
	createWarehouseStockMovement: async (branchId, payload, headers = {}) => {
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IWarehouseStockMovement>,
			IWarehouseStockMovementPayload
		>({
			url: `${branchUrl(branchId)}/warehouse-stock-movements`,
			method: 'post',
			data: payload,
			headers: writeHeaders(headers),
		});
		return { data: response.data.data };
	},
	// El listado de bodegas pagina: se recorren todas, porque una que falte no
	// se podría elegir ni como origen ni como destino.
	listTransferWarehouses: async (branchId, signal) => {
		const first = await fetchWarehousePage(branchId, 1, signal);
		const rest = await Promise.all(
			Array.from({ length: Math.max(first.lastPage - 1, 0) }, (_, index) =>
				fetchWarehousePage(branchId, index + 2, signal),
			),
		);
		return [first, ...rest].flatMap((page) => page.warehouses);
	},
	createInventoryDocumentAllocation: () =>
		rejectNotPublished(`POST ${B}/inventory-stock/{product}/document-allocations`),
	listInitialStockAllocationsForPurchaseDocument: () =>
		rejectNotPublished(`GET ${P}/purchase-documents/{document}/initial-stock-allocations`),
	// Etapa 1 del contrato: el ajuste real sólo se ofrece sobre «Sin
	// ubicación» (`warehouse_id: null`). Sin bodegas que listar, su selector de
	// ubicación queda con esa única opción. El traslado lee las suyas aparte
	// (`listTransferWarehouses`): necesita dos ubicaciones distintas.
	getInventoryWarehouses: () => [],
	// El contrato no publica reservas: sin ellas el disponible no se conoce, y
	// mostrar el apto como «disponible» sería afirmar que no hay faltante.
	getInventoryStockAvailability: () => null,
	// Síncrona: el backend no publica las opciones de filtro de procedencias.
	// Sólo la llama la ficha de producto, que no se monta con la bandera apagada.
	getInventoryOriginFilterOptions: () =>
		throwNotPublished(`GET ${B}/inventory-stock/{product}/origins`),
};

/** El doble no distingue bodegas inactivas: todas las que lista están activas. */
const mockInventoryStock: TInventoryStockService = {
	...inventoryStockMock,
	listTransferWarehouses: (branchId) =>
		Promise.resolve(
			inventoryStockMock
				.getInventoryWarehouses(branchId)
				.map((warehouse) => ({ ...warehouse, is_active: true })),
		),
};

const inventoryStock: TInventoryStockService = INVENTORY_STOCK_USE_MOCKS
	? mockInventoryStock
	: apiInventoryStock;

/**
 * El ajuste tiene bandera propia (`VITE_INVENTORY_ADJUSTMENTS_USE_MOCKS`): en
 * desarrollo usa el backend mientras el resto de Inventario sigue simulado.
 * Todo lo que lee o escribe el ajuste sale de acá.
 */
const adjustmentStock: TInventoryStockService = INVENTORY_ADJUSTMENTS_USE_MOCKS
	? mockInventoryStock
	: apiInventoryStock;

/**
 * El traslado también tiene bandera propia (`VITE_INVENTORY_TRANSFERS_USE_MOCKS`).
 * Todo lo que lee o escribe el traslado sale de acá.
 */
const transferStock: TInventoryStockService = INVENTORY_TRANSFERS_USE_MOCKS
	? mockInventoryStock
	: apiInventoryStock;

/** Stock de la ubicación de origen del traslado. */
export const listTransferStock = transferStock.listInventoryStock;

/** Bodegas que el traslado ofrece como origen y destino. */
export const { listTransferWarehouses } = transferStock;

/** Stock de la ubicación que corrige el ajuste. */
export const listAdjustmentStock = adjustmentStock.listInventoryStock;

/** Ubicaciones que ofrece el ajuste. */
export const getAdjustmentWarehouses = adjustmentStock.getInventoryWarehouses;

/** Disponible tras el ajuste, o `null` si no se conoce. */
export const getAdjustmentStockAvailability = adjustmentStock.getInventoryStockAvailability;

/** `GET B/inventory-stock` (§3): stock actual por producto, nombre ASC e id ASC. */
export const { listInventoryStock } = inventoryStock;

/** `GET B/inventory-stock/{product}/origins` (§3): procedencias FIFO de un producto. */
export const { listInventoryOrigins } = inventoryStock;

/** Productos que un ajuste puede nombrar en una ubicación, con su saldo ahí. */
export const { searchInventoryAdjustableProducts } = adjustmentStock;

/** Si un producto puede nombrarse en un ajuste, sin mirar su saldo; `null` si no. */
export const { getInventoryAdjustableProduct } = adjustmentStock;

/** `POST B/inventory-stock/{product}/document-allocations` (§8): documentar stock inicial. */
export const { createInventoryDocumentAllocation } = inventoryStock;

/** `GET P/purchase-documents/{document}/initial-stock-allocations` (§6). */
export const { listInitialStockAllocationsForPurchaseDocument } = inventoryStock;

/** `POST B/warehouse-stock-movements` (§9): traslado entre ubicaciones, todo o nada. */
export const { createWarehouseStockMovement } = transferStock;

/** `POST B/inventory-adjustments` (§11): ajuste por conteo, todo o nada. */
export const { createInventoryAdjustment } = adjustmentStock;

/** Disponible de un producto en la sucursal tras un ajuste, o `null` si no se conoce. */
export const { getInventoryStockAvailability } = inventoryStock;

/** Proveedores y documentos con los que filtrar las procedencias de un producto. */
export const { getInventoryOriginFilterOptions } = inventoryStock;
