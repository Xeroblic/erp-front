import INVENTORY_RECEIPTS_USE_MOCKS from '@/config/inventoryReceipts.config';
import * as stockReceiptsMock from '@/mocks/services/stockReceipts.mock';
import ApiService from '@/services/ApiService';
import listBranchWarehouses from '@/services/procurement/branchWarehouses.service';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import { searchPurchasableProducts } from '@/services/procurement/purchasableProducts.service';
import type { IPurchasableProductsPage } from '@/services/procurement/purchasableProducts.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import { buildProcurementWriteHeaders, readEtagHeader } from '@/utils/procurementWrite.util';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IProcurementActorCompact,
	IProcurementSupplierListParams,
	IProcurementSupplierListRow,
	IStockReceipt,
	IStockReceiptCancelPayload,
	IStockReceiptCreatePayload,
	IStockReceiptLinkPurchaseDocumentPayload,
	IStockReceiptListParams,
	IStockReceiptListRow,
	IStockReceiptReversePayload,
	IStockReceiptUpdatePayload,
	IStockReceiptWarehouse,
} from '@/interface/procurement.interface';

/**
 * Recepciones físicas — sección 7 del contrato de abastecimiento,
 * `/api/subsidiaries/{subsidiary}/procurement/stock-receipts`.
 *
 * Fachada con la firma pública de siempre: slices, hooks y vistas importan
 * sólo de aquí. Con `VITE_INVENTORY_RECEIPTS_USE_MOCKS` encendida delega en el
 * doble (`@/mocks/services/stockReceipts.mock`), que además hace de backend en
 * los efectos cruzados sobre el documento y el stock simulados. Apagada, usa
 * la API real.
 *
 * Contrato verificado contra el backend (tareas 11 y 12, `StockReceipt*`):
 * - Leer exige `view-product`; escribir, `edit-product` y operar en la
 *   sucursal **de la bodega** de la recepción. Con documento, toda acción
 *   exige además `view-purchase-document`.
 * - Toda escritura exige `Idempotency-Key`; sólo el PATCH exige además
 *   `If-Match` (428 sin él, 412 `RESOURCE_VERSION_CONFLICT` con uno viejo).
 * - Vincular un documento a una recepción `posted` que no lo tenía (tarea 13,
 *   `PUT .../purchase-document`) exige además `view-purchase-document`: sin
 *   él, `allowed_actions` no ofrece `link_purchase_document`.
 * - El detalle y cada escritura responden la ficha completa con su `ETag`.
 * - `post` y `retry` responden 202 con la recepción `queued`: la ficha
 *   consulta el detalle hasta `posted` o `failed`. `reverse` es síncrono.
 * - Dónde ingresó el stock lo dice `entered_location` de la ficha y de cada
 *   fila: lo decide la etapa de la filial al contabilizar («Sin ubicación» de
 *   la sucursal en la etapa 1, la bodega de la recepción en la 2), no la de
 *   hoy, así que no se deduce de `multi_location_enabled`.
 *
 * Sin caché de `ApiService`: la ficha cambia con cada escritura y el slice ya
 * descarta respuestas tardías por `requestId`.
 */

/**
 * Recepciones usa los proveedores y documentos de prueba del doble mientras
 * la bandera esté encendida. Quien muestre datos de recepciones junto a un
 * proveedor o documento real (las fichas de Proveedores y Documentos de
 * compra) lo consulta para no cruzar un id real con la semilla.
 */
export const STOCK_RECEIPTS_USE_TEST_SUPPLIERS = INVENTORY_RECEIPTS_USE_MOCKS;

const FORBIDDEN_STATUS = 403;

interface IStockReceiptWriteHeaders {
	idempotencyKey?: string;
	/** `ETag` vigente de la ficha. Sólo lo usa `PATCH`. */
	etag?: string | null;
}

export interface IStockReceiptResponse {
	data: IStockReceipt;
	headers: { etag: string | null };
}

interface IStockReceiptsService {
	listStockReceipts: (
		subsidiaryId: number,
		params?: IStockReceiptListParams,
	) => Promise<IApiCollectionEnvelope<IStockReceiptListRow>>;
	listStockReceiptsForPurchaseDocument: (
		subsidiaryId: number,
		documentId: number,
		params?: { page?: number; per_page?: number },
	) => Promise<IApiCollectionEnvelope<IStockReceiptListRow>>;
	getStockReceipt: (subsidiaryId: number, id: number) => Promise<IStockReceiptResponse>;
	createStockReceipt: (
		subsidiaryId: number,
		payload: IStockReceiptCreatePayload,
		headers?: IStockReceiptWriteHeaders,
		/** Sólo el doble lo usa: el backend autoriza por la sucursal de la bodega. */
		authorizedBranchIds?: readonly number[] | null,
	) => Promise<IStockReceiptResponse>;
	updateStockReceipt: (
		subsidiaryId: number,
		id: number,
		payload: IStockReceiptUpdatePayload,
		headers?: IStockReceiptWriteHeaders,
		authorizedBranchIds?: readonly number[] | null,
	) => Promise<IStockReceiptResponse>;
	cancelStockReceipt: (
		subsidiaryId: number,
		id: number,
		payload: IStockReceiptCancelPayload,
		headers?: IStockReceiptWriteHeaders,
	) => Promise<IStockReceiptResponse>;
	/** `actor` sólo lo usa el doble: el backend toma al solicitante del token. */
	postStockReceipt: (
		subsidiaryId: number,
		id: number,
		actor: IProcurementActorCompact,
		headers?: IStockReceiptWriteHeaders,
	) => Promise<IStockReceiptResponse>;
	retryStockReceipt: (
		subsidiaryId: number,
		id: number,
		actor: IProcurementActorCompact,
		headers?: IStockReceiptWriteHeaders,
	) => Promise<IStockReceiptResponse>;
	reverseStockReceipt: (
		subsidiaryId: number,
		id: number,
		payload: IStockReceiptReversePayload,
		headers?: IStockReceiptWriteHeaders,
	) => Promise<IStockReceiptResponse>;
	linkStockReceiptPurchaseDocument: (
		subsidiaryId: number,
		id: number,
		payload: IStockReceiptLinkPurchaseDocumentPayload,
		headers?: IStockReceiptWriteHeaders,
	) => Promise<IStockReceiptResponse>;
	listWarehousesForStockReceipts: (
		branchIds: readonly number[],
		signal?: AbortSignal,
	) => Promise<IStockReceiptWarehouse[]>;
	listStockReceiptSuppliers: (
		subsidiaryId: number,
		params: IProcurementSupplierListParams,
	) => Promise<IApiCollectionEnvelope<IProcurementSupplierListRow>>;
	searchStockReceiptProducts: (
		subsidiaryId: number,
		search: string,
	) => Promise<IPurchasableProductsPage>;
}

const receiptsUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/procurement/stock-receipts`;

const receiptUrl = (subsidiaryId: number, id: number): string =>
	`${receiptsUrl(subsidiaryId)}/${id}`;

/**
 * Sin clave el backend responde 428 `IDEMPOTENCY_KEY_REQUIRED`: no se inventa
 * una acá, porque sólo quien reintenta sabe si la tentativa es la misma.
 */
const writeHeaders = ({ idempotencyKey, etag }: IStockReceiptWriteHeaders = {}):
	| Record<string, string>
	| undefined =>
	idempotencyKey ? buildProcurementWriteHeaders({ idempotencyKey, etag }) : undefined;

/**
 * Rechazo local del PATCH sin versión: misma forma que un 428 del backend
 * para que la UI lo resuelva igual («recarga»), con un mensaje que nombra la
 * causa real. `If-Match: *` pasaría la precondición y pisaría una edición ajena.
 */
export const MISSING_RECEIPT_ETAG_MESSAGE =
	'No se pudo leer la versión de la recepción, así que no se puede corregir sin arriesgar cambios ajenos. Recarga la ficha.';

const missingEtagError = (): Error =>
	Object.assign(new Error(MISSING_RECEIPT_ETAG_MESSAGE), {
		isAxiosError: true,
		response: { status: 428, data: { message: MISSING_RECEIPT_ETAG_MESSAGE } },
	});

const toReceiptResponse = (response: {
	data: IApiResourceEnvelope<IStockReceipt>;
	headers: unknown;
}): IStockReceiptResponse => ({
	data: response.data.data,
	headers: { etag: readEtagHeader(response.headers) },
});

const postReceiptAction = async (
	subsidiaryId: number,
	id: number,
	action: 'cancel' | 'post' | 'retry' | 'reverse',
	payload: IStockReceiptCancelPayload | IStockReceiptReversePayload | undefined,
	headers: IStockReceiptWriteHeaders | undefined,
): Promise<IStockReceiptResponse> => {
	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IStockReceipt>,
		IStockReceiptCancelPayload | IStockReceiptReversePayload | undefined
	>({
		url: `${receiptUrl(subsidiaryId, id)}/${action}`,
		method: 'post',
		data: payload,
		headers: writeHeaders(headers),
	});
	return toReceiptResponse(response);
};

const apiStockReceipts: IStockReceiptsService = {
	listStockReceipts: async (subsidiaryId, params = {}) => {
		const response = await ApiService.fetchData<IApiCollectionEnvelope<IStockReceiptListRow>>({
			url: receiptsUrl(subsidiaryId),
			method: 'get',
			params,
		});
		return response.data;
	},
	// No hay ruta propia: el listado filtra por documento con la misma
	// autorización por sucursal que el resto.
	listStockReceiptsForPurchaseDocument: (subsidiaryId, documentId, params = {}) =>
		apiStockReceipts.listStockReceipts(subsidiaryId, {
			...params,
			purchase_document_id: documentId,
		}),
	getStockReceipt: async (subsidiaryId, id) => {
		const response = await ApiService.fetchData<IApiResourceEnvelope<IStockReceipt>>({
			url: receiptUrl(subsidiaryId, id),
			method: 'get',
		});
		return toReceiptResponse(response);
	},
	createStockReceipt: async (subsidiaryId, payload, headers) => {
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IStockReceipt>,
			IStockReceiptCreatePayload
		>({
			url: receiptsUrl(subsidiaryId),
			method: 'post',
			data: payload,
			headers: writeHeaders(headers),
		});
		return toReceiptResponse(response);
	},
	updateStockReceipt: async (subsidiaryId, id, payload, headers) => {
		if (!headers?.etag) throw missingEtagError();
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IStockReceipt>,
			IStockReceiptUpdatePayload
		>({
			url: receiptUrl(subsidiaryId, id),
			method: 'patch',
			data: payload,
			headers: writeHeaders(headers),
		});
		return toReceiptResponse(response);
	},
	cancelStockReceipt: (subsidiaryId, id, payload, headers) =>
		postReceiptAction(subsidiaryId, id, 'cancel', payload, headers),
	postStockReceipt: (subsidiaryId, id, _actor, headers) =>
		postReceiptAction(subsidiaryId, id, 'post', undefined, headers),
	retryStockReceipt: (subsidiaryId, id, _actor, headers) =>
		postReceiptAction(subsidiaryId, id, 'retry', undefined, headers),
	reverseStockReceipt: (subsidiaryId, id, payload, headers) =>
		postReceiptAction(subsidiaryId, id, 'reverse', payload, headers),
	// `PUT` sin `If-Match`: el backend valida el estado bajo bloqueo. Responde
	// el detalle con su `ETag`, igual que un GET: no hace falta releer.
	linkStockReceiptPurchaseDocument: async (subsidiaryId, id, payload, headers) => {
		const response = await ApiService.fetchData<
			IApiResourceEnvelope<IStockReceipt>,
			IStockReceiptLinkPurchaseDocumentPayload
		>({
			url: `${receiptUrl(subsidiaryId, id)}/purchase-document`,
			method: 'put',
			data: payload,
			headers: writeHeaders({ idempotencyKey: headers?.idempotencyKey }),
		});
		return toReceiptResponse(response);
	},
	// Sólo activas: el backend rechaza una bodega inactiva salvo la que la
	// recepción ya tenía, y esa la agrega el formulario al corregir.
	// Una sucursal que responde 403 no tumba a las demás: sin acceso a ella
	// tampoco se podría recibir ahí. Cualquier otro fallo sí se informa, porque
	// escondería bodegas en las que el usuario sí opera.
	listWarehousesForStockReceipts: async (branchIds, signal) => {
		const perBranch = await Promise.allSettled(
			branchIds.map((branchId) => listBranchWarehouses(branchId, signal)),
		);
		const failure = perBranch.find(
			(result): result is PromiseRejectedResult =>
				result.status === 'rejected' &&
				resolveProcurementError(result.reason).status !== FORBIDDEN_STATUS,
		);
		if (failure) throw failure.reason;
		return perBranch
			.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
			.filter((warehouse) => warehouse.is_active);
	},
	// Envoltorios y no la referencia: el servicio de proveedores carga
	// `ApiService`, que carga el store, que carga el slice de recepciones, que
	// carga esta fachada. Leer la referencia al evaluar el módulo la vería sin
	// inicializar.
	listStockReceiptSuppliers: (subsidiaryId, params) =>
		listProcurementSuppliers(subsidiaryId, params),
	// El catálogo real que ya usa Documentos de compra: activos y sin serie,
	// la regla con que el backend valida `items.*.product_id`.
	searchStockReceiptProducts: (subsidiaryId, search) =>
		searchPurchasableProducts(subsidiaryId, search),
};

const stockReceipts: IStockReceiptsService = INVENTORY_RECEIPTS_USE_MOCKS
	? stockReceiptsMock
	: apiStockReceipts;

/** `GET /stock-receipts`. Orden `received_on` DESC, ID DESC. */
export const { listStockReceipts } = stockReceipts;

/** `GET /stock-receipts?purchase_document_id=`: recepciones de un documento. */
export const { listStockReceiptsForPurchaseDocument } = stockReceipts;

/** `GET /stock-receipts/{receipt}`: detalle con `ETag`. */
export const { getStockReceipt } = stockReceipts;

/** `POST /stock-receipts`: 201 `draft`, con o sin documento. */
export const { createStockReceipt } = stockReceipts;

/** `PATCH /stock-receipts/{receipt}`: `draft`, también corrige `failed`. Exige `If-Match`. */
export const { updateStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/cancel`: `draft`/`failed` → `cancelled`. */
export const { cancelStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/post`: 202 `queued`; la UI consulta el detalle. */
export const { postStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/retry`: `failed` → `queued` sin tocar el payload. */
export const { retryStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/reverse`: `posted` → `reversed`. */
export const { reverseStockReceipt } = stockReceipts;

/** `PUT /stock-receipts/{receipt}/purchase-document`: vínculo posterior, único. */
export const { linkStockReceiptPurchaseDocument } = stockReceipts;

/** Bodegas activas de esas sucursales, cada una con la suya. */
export const { listWarehousesForStockReceipts } = stockReceipts;

/** Proveedores del selector del alta sin documento. */
export const { listStockReceiptSuppliers } = stockReceipts;

/** Productos activos y no serializados de la filial que coinciden con el término. */
export const { searchStockReceiptProducts } = stockReceipts;
