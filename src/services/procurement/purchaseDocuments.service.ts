import ApiService from '@/services/ApiService';
import { buildProcurementWriteHeaders, readEtagHeader } from '@/utils/procurementWrite.util';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IPurchaseDocument,
	IPurchaseDocumentCancelPayload,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentListParams,
	IPurchaseDocumentListRow,
	IPurchaseDocumentUpdatePayload,
} from '@/interface/procurement.interface';

/**
 * Documentos de compra — sección 6 del contrato,
 * `/api/subsidiaries/{subsidiary}/procurement/purchase-documents` (backend
 * PR #84 y #92).
 *
 * Contrato verificado contra el backend:
 * - Permisos por ruta: `view-`, `create-`, `edit-`, `confirm-` y
 *   `cancel-purchase-document`, además del acceso a la filial. No hay DELETE:
 *   un documento se anula.
 * - Toda escritura exige `Idempotency-Key`. Sólo el PATCH exige además
 *   `If-Match`: sin él responde 428 y con una versión vieja, 412
 *   `RESOURCE_VERSION_CONFLICT`. Confirmar y anular validan el estado bajo
 *   bloqueo y no piden versión.
 * - El detalle y cada escritura responden la ficha completa con su `ETag`.
 *   El navegador sólo lo deja leer si el backend lo publica en
 *   `Access-Control-Expose-Headers`; cuando no llega, `etag` es `null` y el
 *   PATCH no se envía (ver `updatePurchaseDocument`).
 * - Conflictos sin `code`: folio repetido para el mismo proveedor y tipo (409
 *   con `context.existing_document`), documento ya anulado, documento con
 *   recepciones o stock inicial al anular, y proveedor desactivado al
 *   confirmar. La UI muestra el `message` del backend.
 *
 * Sin caché de `ApiService`: la ficha cambia con cada escritura y el slice ya
 * descarta respuestas tardías por `requestId`.
 */

interface IPurchaseDocumentWriteHeaders {
	idempotencyKey: string;
}

interface IPurchaseDocumentUpdateHeaders extends IPurchaseDocumentWriteHeaders {
	/** `ETag` vigente de la ficha que se está editando. */
	etag: string | null;
}

export interface IPurchaseDocumentResponse {
	data: IPurchaseDocument;
	headers: { etag: string | null };
}

/**
 * Rechazo local del PATCH sin versión: misma forma que un 428 del backend
 * para que la UI lo resuelva igual («Falta la versión del registro»), pero
 * con un mensaje que nombra la causa real.
 */
export const MISSING_ETAG_MESSAGE =
	'No se pudo leer la versión del documento, así que no se puede editar sin arriesgar cambios ajenos. Recarga la página; si persiste, el servidor no está publicando el encabezado ETag.';

const missingEtagError = (): Error =>
	Object.assign(new Error(MISSING_ETAG_MESSAGE), {
		isAxiosError: true,
		response: { status: 428, data: { message: MISSING_ETAG_MESSAGE } },
	});

const documentsUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/procurement/purchase-documents`;

const documentUrl = (subsidiaryId: number, id: number): string =>
	`${documentsUrl(subsidiaryId)}/${id}`;

const toDocumentResponse = (response: {
	data: IApiResourceEnvelope<IPurchaseDocument>;
	headers: unknown;
}): IPurchaseDocumentResponse => ({
	data: response.data.data,
	headers: { etag: readEtagHeader(response.headers) },
});

/**
 * `GET /purchase-documents`: filas sin `items` ni `supplier_snapshot`.
 * `search` corre sobre folio, proveedor y RUT; orden `issue_date` DESC, ID DESC.
 */
export const listPurchaseDocuments = async (
	subsidiaryId: number,
	params: IPurchaseDocumentListParams = {},
): Promise<IApiCollectionEnvelope<IPurchaseDocumentListRow>> => {
	const response = await ApiService.fetchData<IApiCollectionEnvelope<IPurchaseDocumentListRow>>({
		url: documentsUrl(subsidiaryId),
		method: 'get',
		params,
	});
	return response.data;
};

/** `GET /purchase-documents/{document}`: ficha completa con cobertura y `ETag`. */
export const getPurchaseDocument = async (
	subsidiaryId: number,
	id: number,
): Promise<IPurchaseDocumentResponse> => {
	const response = await ApiService.fetchData<IApiResourceEnvelope<IPurchaseDocument>>({
		url: documentUrl(subsidiaryId, id),
		method: 'get',
	});
	return toDocumentResponse(response);
};

/** `POST /purchase-documents`: 201 con el borrador, 409 por folio repetido o 422. */
export const createPurchaseDocument = async (
	subsidiaryId: number,
	payload: IPurchaseDocumentCreatePayload,
	headers: IPurchaseDocumentWriteHeaders,
): Promise<IPurchaseDocumentResponse> => {
	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IPurchaseDocument>,
		IPurchaseDocumentCreatePayload
	>({
		url: documentsUrl(subsidiaryId),
		method: 'post',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return toDocumentResponse(response);
};

/**
 * `PATCH /purchase-documents/{document}`: sólo `draft`. Un campo ausente se
 * conserva; `items` presente reemplaza la colección (con `id` actualiza, sin
 * `id` crea, omitida elimina).
 *
 * Sin `ETag` no se envía: `If-Match: *` pasaría la precondición y el backend
 * guardaría encima de una edición ajena sin avisar.
 */
export const updatePurchaseDocument = async (
	subsidiaryId: number,
	id: number,
	payload: IPurchaseDocumentUpdatePayload,
	headers: IPurchaseDocumentUpdateHeaders,
): Promise<IPurchaseDocumentResponse> => {
	if (!headers.etag) throw missingEtagError();

	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IPurchaseDocument>,
		IPurchaseDocumentUpdatePayload
	>({
		url: documentUrl(subsidiaryId, id),
		method: 'patch',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return toDocumentResponse(response);
};

/**
 * `POST /purchase-documents/{document}/confirm`: fija `supplier_snapshot` y los
 * snapshots de cada línea. 422 `INVOICE_SUPPLIER_INCOMPLETE` si la factura no
 * tiene giro y direcciones; 409 si el proveedor está desactivado.
 */
export const confirmPurchaseDocument = async (
	subsidiaryId: number,
	id: number,
	headers: IPurchaseDocumentWriteHeaders,
): Promise<IPurchaseDocumentResponse> => {
	const response = await ApiService.fetchData<IApiResourceEnvelope<IPurchaseDocument>>({
		url: `${documentUrl(subsidiaryId, id)}/confirm`,
		method: 'post',
		headers: buildProcurementWriteHeaders(headers),
	});
	return toDocumentResponse(response);
};

/**
 * `POST /purchase-documents/{document}/cancel`: motivo obligatorio (máx. 500).
 * Libera el folio. 409 si ya estaba anulado o si respalda recepciones o
 * asignaciones de stock inicial.
 */
export const cancelPurchaseDocument = async (
	subsidiaryId: number,
	id: number,
	payload: IPurchaseDocumentCancelPayload,
	headers: IPurchaseDocumentWriteHeaders,
): Promise<IPurchaseDocumentResponse> => {
	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IPurchaseDocument>,
		IPurchaseDocumentCancelPayload
	>({
		url: `${documentUrl(subsidiaryId, id)}/cancel`,
		method: 'post',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return toDocumentResponse(response);
};
