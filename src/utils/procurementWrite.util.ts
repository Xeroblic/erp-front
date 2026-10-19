import { resolveProcurementError } from '@/utils/procurementErrors.util';

/**
 * - `Idempotency-Key` evita **duplicar** una escritura: un reintento por timeout
 *   reusa la clave. Sólo tras un error definitivo y corregir el payload se usa
 *   una nueva; con la anterior el backend responde `409 IDEMPOTENCY_KEY_REUSED`.
 * - `If-Match` evita **pisar** la edición de otro: sin él el PATCH recibe 428 y
 *   con un ETag viejo, `412 RESOURCE_VERSION_CONFLICT`.
 */

const HEX = '0123456789abcdef';

/** UUID v4; cae a `getRandomValues` donde no existe `crypto.randomUUID`. */
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
	idempotencyKey: string;
	etag?: string | null;
}

/** `If-Match` vacío produce el mismo 428 que omitirlo, pero oculta la causa. */
export const buildProcurementWriteHeaders = (
	input: IProcurementWriteHeadersInput,
): Record<string, string> => {
	const headers: Record<string, string> = {
		'Idempotency-Key': input.idempotencyKey,
	};

	if (input.etag) headers['If-Match'] = input.etag;

	return headers;
};

/** Sin asumir capitalización de la cabecera. */
export const readEtagHeader = (headers: unknown): string | null => {
	if (headers === null || typeof headers !== 'object') return null;

	const record = headers as Record<string, unknown>;
	const value = record.etag ?? record.ETag ?? record.Etag;

	return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export { isTransportError } from '@/utils/procurementErrors.util';

/** Rechazo de los thunks de abastecimiento cuando todavía no hay filial activa. */
export const MISSING_SUBSIDIARY_MESSAGE = 'No se pudo determinar la filial activa.';

interface ISubsidiaryOwnedState {
	listSubsidiaryId: number | null;
	currentSubsidiaryId: number | null;
	current: { id: number } | null;
}

/**
 * Una escritura resuelta después de cambiar de filial no puede pisar la lista
 * ni la ficha de la nueva sólo porque el ID coincide (el mock siembra los
 * mismos IDs en cada filial): `subsidiaryId` es el de la propia mutación.
 */
export const mutationBelongsToList = (
	state: Pick<ISubsidiaryOwnedState, 'listSubsidiaryId'>,
	subsidiaryId: number | null,
): boolean => subsidiaryId !== null && subsidiaryId === state.listSubsidiaryId;

export const mutationBelongsToCurrent = (
	state: Pick<ISubsidiaryOwnedState, 'currentSubsidiaryId' | 'current'>,
	subsidiaryId: number | null,
	id: number,
): boolean =>
	state.current?.id === id && subsidiaryId !== null && subsidiaryId === state.currentSubsidiaryId;

/** Lee la misma `action` que ve la pantalla, así mensaje y reintento no se contradicen. */
export const shouldRetryWithSameKey = (error: unknown): boolean =>
	resolveProcurementError(error).action === 'retry_same_key';
