import { resolveProcurementError } from '@/utils/procurementErrors.util';

/**
 * Cabeceras de escritura del contrato de abastecimiento (sección 1 del
 * `frontend-guide.md`, PR #67).
 *
 * Dos garantías distintas que se confunden con facilidad:
 *
 * - `Idempotency-Key` protege contra **duplicar** una escritura. Un reintento
 *   por timeout **reusa la misma clave**; generar otra convierte el reintento en
 *   una segunda recepción. Sólo tras un error definitivo y corregir el payload se
 *   usa clave nueva — con la anterior el backend responde
 *   `409 IDEMPOTENCY_KEY_REUSED`.
 * - `If-Match` protege contra **pisar** la edición de otro. Los documentos y las
 *   recepciones editables entregan `ETag`; el PATCH sin `If-Match` recibe 428 y
 *   con un ETag viejo recibe `412 RESOURCE_VERSION_CONFLICT`.
 */

const HEX = '0123456789abcdef';

/**
 * UUID v4. Usa `crypto.randomUUID` cuando existe y cae a `getRandomValues` en
 * entornos que exponen WebCrypto sin ese atajo.
 */
export const createIdempotencyKey = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	// Versión 4 y variante RFC 4122, en aritmética entera: la máscara de bits
	// equivale a quedarse con el resto y sumar el prefijo.
	bytes[6] = 0x40 + (bytes[6] % 16);
	bytes[8] = 0x80 + (bytes[8] % 64);

	const hex = Array.from(bytes, (byte) => HEX[Math.floor(byte / 16)] + HEX[byte % 16]).join('');

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export interface IProcurementWriteHeadersInput {
	/** UUID de la operación. Se reusa en los reintentos por timeout. */
	idempotencyKey: string;
	/** `ETag` vigente del recurso. Obligatorio en los PATCH que lo declaran. */
	etag?: string | null;
}

/**
 * Construye las cabeceras de una escritura. `If-Match` sólo se agrega cuando hay
 * ETag: mandarlo vacío produce el mismo 428 que omitirlo, pero oculta la causa.
 */
export const buildProcurementWriteHeaders = (
	input: IProcurementWriteHeadersInput,
): Record<string, string> => {
	const headers: Record<string, string> = {
		'Idempotency-Key': input.idempotencyKey,
	};

	if (input.etag) headers['If-Match'] = input.etag;

	return headers;
};

/** Lee el `ETag` de las cabeceras de una respuesta, sin asumir capitalización. */
export const readEtagHeader = (headers: unknown): string | null => {
	if (headers === null || typeof headers !== 'object') return null;

	const record = headers as Record<string, unknown>;
	const value = record.etag ?? record.ETag ?? record.Etag;

	return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/**
 * Error de transporte: la petición salió pero no volvió respuesta (timeout, red
 * caída, petición abortada). No prueba que la escritura no haya llegado.
 */
export const isTransportError = (error: unknown): boolean => {
	const record = asRecord(error);
	if (!record) return false;

	if (asRecord(record.response)) return false;

	return record.isAxiosError === true || record.request !== undefined;
};

/**
 * `true` cuando el reintento debe conservar la misma `Idempotency-Key`: la
 * operación sigue en curso, o nunca supimos si llegó. Reusar la clave es lo
 * único que impide duplicar una recepción por reintentar un timeout.
 */
export const shouldRetryWithSameKey = (error: unknown): boolean =>
	resolveProcurementError(error).action === 'retry_same_key' || isTransportError(error);

/** `true` cuando hay que recargar el recurso antes de reintentar la edición. */
export const requiresResourceReload = (error: unknown): boolean =>
	resolveProcurementError(error).action === 'reload_resource';
