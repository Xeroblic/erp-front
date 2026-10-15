import INVENTORY_ADJUSTMENTS_USE_MOCKS from '@/config/inventoryAdjustments.config';
import INVENTORY_OVERVIEW_USE_MOCKS from '@/config/inventoryOverview.config';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import INVENTORY_TRANSFERS_USE_MOCKS from '@/config/inventoryTransfers.config';
import * as inventoryStockMock from '@/mocks/services/inventoryStock.mock';
import ApiService from '@/services/ApiService';
import listBranchWarehouses from '@/services/procurement/branchWarehouses.service';
import { buildProcurementWriteHeaders } from '@/utils/procurementWrite.util';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IInventoryAdjustableProductsPage,
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryDocumentAllocation,
	IInventoryDocumentAllocationPayload,
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
 * - Documentación posterior (tarea 13): `POST B/inventory-stock/{product}/
 *   document-allocations` exige `edit-product`, `view-purchase-document` e
 *   `Idempotency-Key`; responde 201 con el respaldo y **no mueve stock**.
 *   `GET P/purchase-documents/{document}/initial-stock-allocations` exige
 *   `view-purchase-document`, pagina (15 por omisión, máximo 100) y sólo trae
 *   las sucursales a las que el usuario accede.
 *
 * Las opciones de filtro de procedencia no existen: la rama real responde
 * `null`.
 *
 * Sin caché de `ApiService`: el saldo cambia con cada ajuste, recepción o
 * venta, y el slice ya descarta respuestas tardías por `requestId`.
 */

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
> & {
	/**
	 * Proveedores y documentos con los que filtrar las procedencias. `null`: el
	 * backend no publica las opciones (los filtros existen en la ruta, pero no
	 * hay cómo listar sus valores sin recorrer todas las páginas).
	 */
	getInventoryOriginFilterOptions: (
		...args: Parameters<typeof inventoryStockMock.getInventoryOriginFilterOptions>
	) => ReturnType<typeof inventoryStockMock.getInventoryOriginFilterOptions> | null;
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

/**
 * `GET B/inventory-stock` contra la API real, sin pasar por ninguna bandera.
 * La vista de Inventario la reutiliza para armar lo que el backend no publica
 * como ruta propia (conteos por ubicación, la fila de un producto).
 */
export const fetchInventoryStockPage = async (
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

/** `GET B/inventory-stock/{product}/origins` contra la API real, sin pasar por ninguna bandera. */
export const fetchInventoryOriginsPage = async (
	branchId: number,
	productId: number,
	params: IInventoryOriginsParams = {},
	signal?: AbortSignal,
): Promise<IInventoryOriginsResponse> => {
	const response = await ApiService.fetchData<IInventoryOriginsResponse>({
		url: `${branchUrl(branchId)}/inventory-stock/${productId}/origins`,
		method: 'get',
		params,
		signal,
	});
	return response.data;
};

const apiInventoryStock: TInventoryStockService = {
	listInventoryStock: fetchInventoryStockPage,
	listInventoryOrigins: fetchInventoryOriginsPage,
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
		const response = await fetchInventoryStockPage(
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
	// Una bodega que falte no se podría elegir ni como origen ni como destino:
	// `listBranchWarehouses` recorre todas las páginas.
	listTransferWarehouses: async (branchId, signal) =>
		(await listBranchWarehouses(branchId, signal)).map(({ id, name, is_active }) => ({
			id,
			name,
			is_active,
		})),
	// La filial la resuelve el backend desde la sucursal: `subsidiaryId` sólo
	// lo usa el doble.
	createInventoryDocumentAllocation: async (
		_subsidiaryId: number,
		branchId: number,
		productId: number,
		payload: IInventoryDocumentAllocationPayload,
		headers: IInventoryWriteHeaders = {},
	) => {
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IInventoryDocumentAllocation>,
			IInventoryDocumentAllocationPayload
		>({
			url: `${branchUrl(branchId)}/inventory-stock/${productId}/document-allocations`,
			method: 'post',
			data: payload,
			headers: writeHeaders(headers),
		});
		return { data: response.data.data };
	},
	listInitialStockAllocationsForPurchaseDocument: async (
		subsidiaryId: number,
		documentId: number,
		params: { page?: number; per_page?: number } = {},
	) => {
		const response = await ApiService.fetchData<
			IApiCollectionEnvelope<IInventoryDocumentAllocation>
		>({
			url: `/subsidiaries/${subsidiaryId}/procurement/purchase-documents/${documentId}/initial-stock-allocations`,
			method: 'get',
			params,
		});
		return response.data;
	},
	// Etapa 1 del contrato: el ajuste real sólo se ofrece sobre «Sin
	// ubicación» (`warehouse_id: null`). Sin bodegas que listar, su selector de
	// ubicación queda con esa única opción. El traslado lee las suyas aparte
	// (`listTransferWarehouses`): necesita dos ubicaciones distintas.
	getInventoryWarehouses: () => [],
	// El contrato no publica reservas: sin ellas el disponible no se conoce, y
	// mostrar el apto como «disponible» sería afirmar que no hay faltante.
	getInventoryStockAvailability: () => null,
	// Síncrona: el backend no publica las opciones de filtro de procedencias, y
	// sacarlas de una página las dejaría incompletas. La ficha oculta los filtros.
	getInventoryOriginFilterOptions: () => null,
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

/**
 * Las pantallas de Inventario (resumen y fichas) tienen bandera propia
 * (`VITE_INVENTORY_OVERVIEW_USE_MOCKS`): leen stock y procedencias de la misma
 * fuente que su resumen, para no mezclar la semilla con saldos reales.
 */
const overviewStock: TInventoryStockService = INVENTORY_OVERVIEW_USE_MOCKS
	? mockInventoryStock
	: apiInventoryStock;

/** `GET B/inventory-stock` (§3): stock actual por producto, nombre ASC e id ASC. */
export const { listInventoryStock } = overviewStock;

/** `GET B/inventory-stock/{product}/origins` (§3): procedencias FIFO de un producto. */
export const { listInventoryOrigins } = overviewStock;

/** Productos que un ajuste puede nombrar en una ubicación, con su saldo ahí. */
export const { searchInventoryAdjustableProducts } = adjustmentStock;

/** Si un producto puede nombrarse en un ajuste, sin mirar su saldo; `null` si no. */
export const { getInventoryAdjustableProduct } = adjustmentStock;

/**
 * `POST B/inventory-stock/{product}/document-allocations` (§8): documentar stock
 * inicial. Sigue a la ficha de producto, que es la que lo ofrece: el origen que
 * se respalda sale de sus procedencias, y escribir en otra fuente rechazaría
 * un `origin_id` que esa fuente no conoce.
 */
export const { createInventoryDocumentAllocation } = overviewStock;

/**
 * `GET P/purchase-documents/{document}/initial-stock-allocations` (§6). Siempre
 * la API real: la ficha del documento de compra que la muestra no tiene doble,
 * y el doble sólo conoce los documentos de su semilla.
 */
export const { listInitialStockAllocationsForPurchaseDocument } = apiInventoryStock;

/** `POST B/warehouse-stock-movements` (§9): traslado entre ubicaciones, todo o nada. */
export const { createWarehouseStockMovement } = transferStock;

/** `POST B/inventory-adjustments` (§11): ajuste por conteo, todo o nada. */
export const { createInventoryAdjustment } = adjustmentStock;

/** Disponible de un producto en la sucursal tras un ajuste, o `null` si no se conoce. */
export const { getInventoryStockAvailability } = inventoryStock;

/**
 * Proveedores y documentos con los que filtrar las procedencias de un
 * producto; `null` si la fuente no los publica.
 */
export const { getInventoryOriginFilterOptions } = overviewStock;
