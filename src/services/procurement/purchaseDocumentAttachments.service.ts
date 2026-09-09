import { purchaseDocumentAttachmentsSeed } from '@/mocks/db/procurement.db';
import {
	findPurchaseDocumentForAttachments,
	setPurchaseDocumentAttachmentsCount,
	withDocumentLock,
} from '@/services/procurement/purchaseDocuments.service';
import { normalizePageParams } from '@/utils/procurementPagination.util';
import type {
	IApiCollectionEnvelope,
	IPurchaseDocumentAttachment,
	IPurchaseDocumentAttachmentListParams,
	TPurchaseDocumentAttachmentMimeType,
} from '@/interface/procurement.interface';
import {
	PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES,
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT,
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES,
} from '@/interface/procurement.interface';

/**
 * Servicio mock de adjuntos privados de documentos de compra — subsección
 * «Adjuntos privados» de la sección 6 del contrato de abastecimiento
 * (`frontend-guide.md`, PR #67 del backend, rama
 * `docs/procurement-stock-receipts`).
 *
 * **Ninguno de estos endpoints existe todavía.** Simula
 * `/api/subsidiaries/{subsidiary}/procurement/purchase-documents/{document}/
 * attachments` contra un store en memoria particionado por filial y por
 * documento, con la misma disciplina de `Idempotency-Key` que
 * `purchaseDocuments.service` — mismo envoltorio, mismos códigos de la
 * sección 16 donde el contrato los da, mensajes propios donde no.
 *
 * **Sin URL pública, nunca.** Ni el fixture ni este servicio construyen ni
 * guardan una URL de archivo en ningún momento: la descarga es una petición
 * autenticada que devuelve el binario (acá, un `Blob` sintético) junto con su
 * nombre y tipo — nunca un `<img src>` ni un enlace directo.
 *
 * El estado del documento (`draft`/`confirmed`/`cancelled`) decide qué
 * escritura es válida, así que este servicio consulta el store de
 * `purchaseDocuments.service` en vez de mantener su propia copia — dos
 * stores del mismo documento podrían divergir (por ejemplo, un `cancel` que
 * no se refleja acá) y dejar pasar una subida que el contrato prohíbe.
 */

const MOCK_LATENCY_MS = 200;

interface IStoredAttachment extends IPurchaseDocumentAttachment {
	/** Contenido binario simulado. Nunca se expone tal cual: sólo por descarga. */
	content: Blob;
}

/** Adjuntos de un documento, en orden de subida (más antiguo primero). */
type TSubsidiaryAttachmentsStore = Map<number, IStoredAttachment[]>;

const storesBySubsidiary = new Map<number, TSubsidiaryAttachmentsStore>();
const nextIdBySubsidiary = new Map<number, number>();

/**
 * El contrato no da un ejemplo de contenido binario — sólo de metadata. Este
 * mock sintetiza un `Blob` legible en vez de dejarlo vacío, para que
 * descargar un adjunto sembrado en los fixtures produzca un archivo real y
 * no un `0 bytes` que parezca un bug del mock.
 */
const buildMockAttachmentContent = (
	fileName: string,
	mimeType: TPurchaseDocumentAttachmentMimeType,
): Blob => new Blob([`Adjunto simulado del documento de compra: ${fileName}`], { type: mimeType });

const seedAttachmentsFor = (documentId: number): IStoredAttachment[] =>
	(purchaseDocumentAttachmentsSeed[documentId] ?? []).map((attachment) => ({
		...attachment,
		content: buildMockAttachmentContent(attachment.file_name, attachment.mime_type),
	}));

const seedNextId = (): number => {
	const allIds = Object.values(purchaseDocumentAttachmentsSeed).flatMap((attachments) =>
		attachments.map((attachment) => attachment.id),
	);
	return (allIds.length > 0 ? Math.max(...allIds) : 0) + 1;
};

const getStore = (subsidiaryId: number): TSubsidiaryAttachmentsStore => {
	let store = storesBySubsidiary.get(subsidiaryId);
	if (store === undefined) {
		store = new Map(
			Object.keys(purchaseDocumentAttachmentsSeed).map((documentId) => [
				Number(documentId),
				seedAttachmentsFor(Number(documentId)),
			]),
		);
		storesBySubsidiary.set(subsidiaryId, store);
	}
	return store;
};

const getDocumentAttachments = (subsidiaryId: number, documentId: number): IStoredAttachment[] =>
	getStore(subsidiaryId).get(documentId) ?? [];

const setDocumentAttachments = (
	subsidiaryId: number,
	documentId: number,
	attachments: IStoredAttachment[],
): void => {
	getStore(subsidiaryId).set(documentId, attachments);
	setPurchaseDocumentAttachmentsCount(subsidiaryId, documentId, attachments.length);
};

const nextIdFor = (subsidiaryId: number): number => {
	const current = nextIdBySubsidiary.get(subsidiaryId) ?? seedNextId();
	nextIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

const delay = <T>(value: T): Promise<T> =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});

interface IMockWriteHeaders {
	idempotencyKey?: string;
}

const apiError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

const fail = (status: number, data: Record<string, unknown>): Promise<never> =>
	Promise.reject(apiError(status, data));

const buildFieldError = (
	code: string,
	message: string,
	field: string,
): Record<string, unknown> => ({ message, code, errors: { [field]: [message] } });

const DOCUMENT_NOT_FOUND_ERROR = {
	message: 'El documento de compra no existe.',
	code: 'PURCHASE_DOCUMENT_NOT_FOUND',
};

const ATTACHMENT_NOT_FOUND_ERROR = {
	message: 'El adjunto no existe en este documento.',
	code: 'PURCHASE_DOCUMENT_ATTACHMENT_NOT_FOUND',
};

/**
 * Mensajes propios del mock de adjuntos, sin código estable en la sección 16
 * del contrato — misma licencia que `PURCHASE_DOCUMENT_ITEMS_EMPTY_MESSAGE`
 * en `purchaseDocuments.service`: la sección 16 no lista un código para «no
 * se puede adjuntar en este estado», así que este servicio define el suyo en
 * vez de forzar uno que no existe en el contrato.
 */
const ATTACHMENT_NOT_ALLOWED_MESSAGE = 'El documento anulado no admite adjuntos.';
const ATTACHMENT_DELETE_NOT_DRAFT_MESSAGE =
	'Sólo se pueden eliminar adjuntos mientras el documento está en borrador.';
const ATTACHMENT_QUOTA_EXCEEDED_MESSAGE = `Este documento ya tiene ${PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT} adjuntos, el máximo permitido.`;

/**
 * Reserva la clave de idempotencia **antes** del primer `await`, igual que
 * `purchaseDocuments.service`: sin esto, dos subidas concurrentes con la
 * misma clave llegarían las dos con la reserva vacía y ejecutarían `run()` en
 * paralelo — el contrato exige `409 OPERATION_IN_PROGRESS` para la segunda
 * mientras la primera sigue en curso.
 */
const idempotencyLog = new Map<string, { payloadHash: string; result?: unknown }>();
const idempotencyLogKey = (subsidiaryId: number, key: string): string => `${subsidiaryId}:${key}`;

/**
 * Huella del contenido binario, para que la comparación de idempotencia no se
 * quede sólo en nombre/tamaño/tipo: dos archivos distintos que coincidan en
 * esos tres campos (por ejemplo, el usuario corrigió el PDF y volvió a
 * seleccionar un archivo con el mismo nombre) deben tratarse como payloads
 * distintos, no como el mismo reintento. No es criptográfico — este mock no
 * necesita resistencia a colisión adversarial, sólo distinguir contenido
 * distinto bajo la misma clave — así que un hash polinomial (base 31, mismo
 * esquema que `String.hashCode` de Java) alcanza, sin operadores bit a bit
 * (`no-bitwise` de este repo): el módulo mantiene el acumulador dentro de un
 * entero seguro para `number` en vez de desbordar con `^`/`>>>`. Se lee con
 * `FileReader` en vez de `Blob.prototype.arrayBuffer`: jsdom (entorno de
 * pruebas) no implementa ese método sobre `File`, y `FileReader` sí está
 * soportado tanto ahí como en el navegador real.
 */
const computeContentFingerprint = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'));
		reader.onload = () => {
			const bytes = new Uint8Array(reader.result as ArrayBuffer);
			let hash = 0;
			for (let index = 0; index < bytes.length; index += 1) {
				hash = (hash * 31 + bytes[index]) % 4294967296;
			}
			resolve(hash.toString(16).padStart(8, '0'));
		};
		reader.readAsArrayBuffer(file);
	});

async function withIdempotency<T>(
	subsidiaryId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) return run();

	const logKey = idempotencyLogKey(subsidiaryId, idempotencyKey);
	const payloadHash = JSON.stringify(payloadForHash);
	const logged = idempotencyLog.get(logKey);
	if (logged) {
		if (logged.payloadHash !== payloadHash) {
			return fail(409, {
				message:
					'La clave de la operación ya se usó con otros datos. Vuelve a intentarlo desde cero.',
				code: 'IDEMPOTENCY_KEY_REUSED',
			});
		}
		if (!('result' in logged)) {
			return fail(409, {
				message: 'La operación aún está en curso. Reintenta en unos segundos.',
				code: 'OPERATION_IN_PROGRESS',
			});
		}
		return logged.result as T;
	}

	idempotencyLog.set(logKey, { payloadHash });
	try {
		const result = await run();
		idempotencyLog.set(logKey, { payloadHash, result });
		return result;
	} catch (error) {
		idempotencyLog.delete(logKey);
		throw error;
	}
}

/**
 * `withDocumentLock` se **reutiliza** de `purchaseDocuments.service`, no se
 * declara una cola propia acá: el cupo de 10, el conteo de
 * `related_counts.attachments` y el resto de campos del documento (que
 * `updatePurchaseDocument`/`confirmPurchaseDocument`/`cancelPurchaseDocument`
 * escriben con su propia lectura-modificación-escritura) viven en el mismo
 * `store.documents`. Dos colas separadas para el mismo documento no se
 * excluyen mutuamente entre sí — subir un adjunto mientras se edita el
 * documento podía perder el conteo nuevo o la edición, según cuál de las dos
 * colas terminara de escribir último.
 */

const toPublicAttachment = (attachment: IStoredAttachment): IPurchaseDocumentAttachment => ({
	id: attachment.id,
	file_name: attachment.file_name,
	mime_type: attachment.mime_type,
	size: attachment.size,
	created_at: attachment.created_at,
});

const requireDocument = (subsidiaryId: number, documentId: number) => {
	const document = findPurchaseDocumentForAttachments(subsidiaryId, documentId);
	if (!document) return null;
	return document;
};

/**
 * `GET /purchase-documents/{document}/attachments`: lista paginada, en orden
 * de subida (más antiguo primero) — el contrato no fija un orden para este
 * listado, y la subida es el único evento temporal que tiene.
 */
export const listPurchaseDocumentAttachments = async (
	subsidiaryId: number,
	documentId: number,
	params: IPurchaseDocumentAttachmentListParams = {},
): Promise<IApiCollectionEnvelope<IPurchaseDocumentAttachment>> => {
	if (!requireDocument(subsidiaryId, documentId)) return fail(404, DOCUMENT_NOT_FOUND_ERROR);

	const attachments = getDocumentAttachments(subsidiaryId, documentId);
	const { page, per_page: perPage } = normalizePageParams(params);
	const total = attachments.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(page, lastPage);
	const start = (currentPage - 1) * perPage;
	const pageItems = attachments.slice(start, start + perPage).map(toPublicAttachment);

	return delay({
		data: pageItems,
		links: {
			first: '?page=1',
			last: `?page=${lastPage}`,
			prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
			next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
		},
		meta: {
			current_page: currentPage,
			from: total === 0 ? null : start + 1,
			last_page: lastPage,
			links: [],
			path: `/api/subsidiaries/${subsidiaryId}/procurement/purchase-documents/${documentId}/attachments`,
			per_page: perPage,
			to: total === 0 ? null : Math.min(start + perPage, total),
			total,
		},
	});
};

/**
 * `POST /purchase-documents/{document}/attachments`: multipart `file`, 201.
 * Válido en `draft`/`confirmed`, nunca en `cancelled`. Valida tipo, tamaño y
 * cupo **antes** de aceptar el archivo — los mismos límites que la UI
 * muestra de antemano, para que el 422 del mock nunca sea una sorpresa que
 * el cliente no haya podido prevenir.
 */
export const uploadPurchaseDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	file: File,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IPurchaseDocumentAttachment }> => {
	// Se calcula **antes** de reservar la clave: `withIdempotency` sigue
	// reservando de forma síncrona apenas entra (sin `await` de por medio
	// hasta `run()`), así que adelantar este cómputo no reabre la ventana de
	// carrera entre dos subidas concurrentes con la misma clave — sólo cambia
	// qué contenido queda plasmado en el hash comparado.
	const contentFingerprint = await computeContentFingerprint(file);

	return withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{
			action: 'upload',
			documentId,
			name: file.name,
			size: file.size,
			type: file.type,
			contentFingerprint,
		},
		() =>
			withDocumentLock(subsidiaryId, documentId, async () => {
				const document = requireDocument(subsidiaryId, documentId);
				if (!document) return fail(404, DOCUMENT_NOT_FOUND_ERROR);
				if (document.status === 'cancelled') {
					return fail(409, {
						message: ATTACHMENT_NOT_ALLOWED_MESSAGE,
						code: 'PURCHASE_DOCUMENT_ATTACHMENT_NOT_ALLOWED',
					});
				}

				const allowedMimeTypes: readonly string[] =
					PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES;
				if (!allowedMimeTypes.includes(file.type)) {
					return fail(
						422,
						buildFieldError(
							'PURCHASE_DOCUMENT_ATTACHMENT_TYPE_INVALID',
							'El archivo debe ser PDF, JPG o PNG.',
							'file',
						),
					);
				}
				if (file.size > PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES) {
					return fail(
						422,
						buildFieldError(
							'PURCHASE_DOCUMENT_ATTACHMENT_TOO_LARGE',
							'El archivo no puede superar los 10 MB.',
							'file',
						),
					);
				}

				const existing = getDocumentAttachments(subsidiaryId, documentId);
				if (existing.length >= PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT) {
					return fail(422, {
						message: ATTACHMENT_QUOTA_EXCEEDED_MESSAGE,
						code: 'PURCHASE_DOCUMENT_ATTACHMENT_QUOTA_EXCEEDED',
					});
				}

				const attachment: IStoredAttachment = {
					id: nextIdFor(subsidiaryId),
					file_name: file.name,
					mime_type: file.type as TPurchaseDocumentAttachmentMimeType,
					size: file.size,
					created_at: new Date().toISOString(),
					content: file,
				};

				setDocumentAttachments(subsidiaryId, documentId, [...existing, attachment]);

				return delay({ data: toPublicAttachment(attachment) });
			}),
	);
};

/**
 * `GET /purchase-documents/{document}/attachments/{media}`: descarga
 * autenticada. Sin restricción de estado — leer/descargar no está limitado a
 * `draft`/`confirmed` en el contrato, sólo subir y eliminar lo están.
 */
export const downloadPurchaseDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
): Promise<{ blob: Blob; fileName: string; mimeType: string }> => {
	if (!requireDocument(subsidiaryId, documentId)) return fail(404, DOCUMENT_NOT_FOUND_ERROR);

	const attachment = getDocumentAttachments(subsidiaryId, documentId).find(
		(item) => item.id === attachmentId,
	);
	if (!attachment) return fail(404, ATTACHMENT_NOT_FOUND_ERROR);

	return delay({
		blob: attachment.content,
		fileName: attachment.file_name,
		mimeType: attachment.mime_type,
	});
};

/**
 * `DELETE /purchase-documents/{document}/attachments/{media}`: 204, sólo en
 * `draft`. El archivo debe pertenecer al documento indicado (sección 6).
 */
export const deletePurchaseDocumentAttachment = (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
	headers: IMockWriteHeaders = {},
): Promise<void> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'delete', documentId, attachmentId },
		() =>
			withDocumentLock(subsidiaryId, documentId, async () => {
				const document = requireDocument(subsidiaryId, documentId);
				if (!document) return fail(404, DOCUMENT_NOT_FOUND_ERROR);

				const existing = getDocumentAttachments(subsidiaryId, documentId);
				if (!existing.some((item) => item.id === attachmentId)) {
					return fail(404, ATTACHMENT_NOT_FOUND_ERROR);
				}
				if (document.status !== 'draft') {
					return fail(409, {
						message: ATTACHMENT_DELETE_NOT_DRAFT_MESSAGE,
						code: 'PURCHASE_DOCUMENT_ATTACHMENT_DELETE_NOT_DRAFT',
					});
				}

				setDocumentAttachments(
					subsidiaryId,
					documentId,
					existing.filter((item) => item.id !== attachmentId),
				);

				return delay(undefined);
			}),
	);

/** Sólo para pruebas: reinicia el store en memoria a la semilla de fixtures. */
export const resetPurchaseDocumentAttachmentsStoreForTests = (): void => {
	storesBySubsidiary.clear();
	nextIdBySubsidiary.clear();
	idempotencyLog.clear();
};
