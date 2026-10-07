import ApiService from '@/services/ApiService';
import { buildProcurementWriteHeaders } from '@/utils/procurementWrite.util';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IPurchaseDocumentAttachment,
	IPurchaseDocumentAttachmentListParams,
} from '@/interface/procurement.interface';

/**
 * Adjuntos privados de documentos de compra — sección 6 del contrato,
 * `/api/subsidiaries/{subsidiary}/procurement/purchase-documents/{document}/attachments`.
 *
 * Contrato verificado contra el backend:
 * - Leer y descargar exigen `view-purchase-document`; subir y eliminar,
 *   `edit-purchase-document`. Además, el acceso a la filial.
 * - Subir: multipart con el campo `file`, PDF/JPG/PNG de hasta 10 MB y 10 por
 *   documento. Válido en `draft` y `confirmed`; en `cancelled` responde 409
 *   `PURCHASE_DOCUMENT_IMMUTABLE`. El cupo lleno es un 422 del campo `file`.
 * - Eliminar: 204, sólo en `draft` (409 `PURCHASE_DOCUMENT_IMMUTABLE` fuera).
 * - Subir y eliminar exigen `Idempotency-Key`; ninguno pide `If-Match`, porque
 *   un adjunto no forma parte del cuerpo versionado del documento.
 * - **Sin URL pública**: el archivo sólo viaja por la descarga autenticada.
 */

interface IAttachmentWriteHeaders {
	idempotencyKey: string;
}

export interface IPurchaseDocumentAttachmentDownload {
	blob: Blob;
	fileName: string;
	mimeType: string;
}

const attachmentsUrl = (subsidiaryId: number, documentId: number): string =>
	`/subsidiaries/${subsidiaryId}/procurement/purchase-documents/${documentId}/attachments`;

/**
 * Nombre del archivo desde `Content-Disposition` (el backend lo publica en
 * CORS). Prefiere la forma `filename*` codificada, que conserva tildes.
 */
const readDownloadFileName = (disposition: unknown): string | null => {
	if (typeof disposition !== 'string') return null;
	const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
	const quotedName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
	try {
		return encodedName ? decodeURIComponent(encodedName) : (quotedName ?? null);
	} catch {
		return encodedName ?? quotedName ?? null;
	}
};

const readHeader = (headers: unknown, name: string): unknown =>
	headers !== null && typeof headers === 'object'
		? (headers as Record<string, unknown>)[name]
		: undefined;

/** `GET .../attachments`: más reciente primero. */
export const listPurchaseDocumentAttachments = async (
	subsidiaryId: number,
	documentId: number,
	params: IPurchaseDocumentAttachmentListParams = {},
): Promise<IApiCollectionEnvelope<IPurchaseDocumentAttachment>> => {
	const response = await ApiService.fetchData<
		IApiCollectionEnvelope<IPurchaseDocumentAttachment>
	>({
		url: attachmentsUrl(subsidiaryId, documentId),
		method: 'get',
		params,
	});
	return response.data;
};

/** `POST .../attachments`: 201 con la metadata del adjunto. */
export const uploadPurchaseDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	file: File,
	headers: IAttachmentWriteHeaders,
): Promise<{ data: IPurchaseDocumentAttachment }> => {
	const payload = new FormData();
	payload.append('file', file);

	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IPurchaseDocumentAttachment>,
		FormData
	>({
		url: attachmentsUrl(subsidiaryId, documentId),
		method: 'post',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return { data: response.data.data };
};

/**
 * `GET .../attachments/{media}`: el binario con el nombre original. Si el
 * `Content-Disposition` no llega, se usa un nombre neutro con el id.
 */
export const downloadPurchaseDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
): Promise<IPurchaseDocumentAttachmentDownload> => {
	const response = await ApiService.fetchData<Blob>({
		url: `${attachmentsUrl(subsidiaryId, documentId)}/${attachmentId}`,
		method: 'get',
		responseType: 'blob',
	});
	return {
		blob: response.data,
		fileName:
			readDownloadFileName(readHeader(response.headers, 'content-disposition')) ??
			`adjunto-${attachmentId}`,
		mimeType: response.data.type,
	};
};

/** `DELETE .../attachments/{media}`: 204 sin cuerpo, sólo en `draft`. */
export const deletePurchaseDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
	headers: IAttachmentWriteHeaders,
): Promise<void> => {
	await ApiService.fetchData({
		url: `${attachmentsUrl(subsidiaryId, documentId)}/${attachmentId}`,
		method: 'delete',
		headers: buildProcurementWriteHeaders(headers),
	});
};
