import { resolveProcurementError } from '@/utils/procurementErrors.util';

/**
 * Errores de `routes/apis/lockers.php` (rama `integration-freescout` del backend):
 * - 429: límite de intentos de los endpoints públicos. El handler global del backend
 *   reconstruye el 429 sin `Retry-After` y con el mensaje de Laravel en inglés, así que
 *   el mensaje se fija aquí y no se puede decir cuánto esperar.
 * - 403: sin permiso o sobre otra filial; un id inexistente responde igual.
 * - 404: casillero no encontrado (QR inválido).
 * - 400/422: regla de negocio; su `message` en español manda.
 */

export type TLockerErrorKind =
	| 'rate_limited'
	| 'forbidden'
	| 'not_found'
	| 'business'
	| 'server'
	| 'unknown';

export interface ILockerError {
	status: number | null;
	kind: TLockerErrorKind;
	message: string;
}

export const LOCKER_RATE_LIMITED_MESSAGE =
	'Demasiados intentos seguidos. Espera unos minutos antes de volver a intentarlo.';

export const LOCKER_FORBIDDEN_MESSAGE =
	'No tienes permiso para operar este casillero o pertenece a otra filial.';

export const LOCKER_SERVER_ERROR_MESSAGE =
	'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos; si persiste, avisa a soporte.';

const resolveKind = (status: number | null): TLockerErrorKind => {
	if (status === 429) return 'rate_limited';
	if (status === 403) return 'forbidden';
	if (status === 404) return 'not_found';
	if (status === 400 || status === 422) return 'business';
	if (status !== null && status >= 500) return 'server';
	return 'unknown';
};

/** Acepta el error de Axios de cualquier endpoint de lockers. */
export const resolveLockerError = (error: unknown, fallbackMessage: string): ILockerError => {
	const resolved = resolveProcurementError(error, fallbackMessage);
	const kind = resolveKind(resolved.status);

	const messageByKind: Partial<Record<TLockerErrorKind, string>> = {
		rate_limited: LOCKER_RATE_LIMITED_MESSAGE,
		forbidden: LOCKER_FORBIDDEN_MESSAGE,
		// En un 500 el cuerpo es del servidor: nada de él llega a la UI.
		server: LOCKER_SERVER_ERROR_MESSAGE,
	};

	return { status: resolved.status, kind, message: messageByKind[kind] ?? resolved.message };
};
