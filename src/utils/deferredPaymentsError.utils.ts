const FORBIDDEN_STATUS = 403;

const FORBIDDEN_MESSAGE =
	'No puedes realizar esta acción: puede deberse a que no tienes el permiso necesario o a que no tienes acceso a esta subsidiaria. Revisa tu rol y el alcance organizacional asignado.';

/**
 * Textos que Laravel devuelve en los `abort_unless(..., 403)` y en las policies sin
 * mensaje propio. No aportan nada al usuario, así que los reemplazamos por el mensaje
 * contextual de ZF-15 en lugar de mostrarlos tal cual.
 */
const GENERIC_FORBIDDEN_MESSAGES = new Set([
	'forbidden',
	'unauthorized',
	'unauthenticated',
	'access denied',
	'this action is unauthorized.',
	'this action is unauthorized',
	'user does not have the right permissions.',
	'user does not have the right permissions',
	'user does not have the right roles.',
	'user does not have the right roles',
	'no autorizado',
	'acceso denegado',
	'accion no autorizada',
	'esta accion no esta autorizada',
	'no tienes permiso',
	'no tiene permiso',
	'no tienes permisos',
	'no tiene permisos',
]);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/** Normaliza para comparar sin depender de acentos, mayúsculas ni puntuación final. */
const normalizeMessage = (message: string): string =>
	message
		.trim()
		.toLocaleLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

const isGenericForbiddenMessage = (message: string): boolean =>
	GENERIC_FORBIDDEN_MESSAGES.has(normalizeMessage(message).replace(/[.!¡]+$/, ''));

/**
 * Mensaje de error para el módulo de Pagos Diferidos. Un 403 aquí puede significar
 * "no tienes el permiso" o "no tienes acceso a esta subsidiaria" (ZF-15) — el backend
 * no distingue el caso en el mensaje, así que lo cubrimos ambos en el front.
 */
const getDeferredPaymentErrorMessage = (error: unknown, fallback: string): string => {
	// Un thunk rechazado con `rejectWithValue('mensaje')` llega aquí como string plano,
	// no como error de Axios: en ese caso el mensaje ya viene normalizado.
	if (typeof error === 'string' && error.trim()) return error;

	const responseRecord = asRecord(asRecord(error)?.response);
	const dataRecord = asRecord(responseRecord?.data);
	const backendMessage =
		typeof dataRecord?.message === 'string' && dataRecord.message.trim()
			? dataRecord.message
			: null;

	// En un 403 el mensaje del backend sólo se conserva si dice algo de negocio: los
	// `abort_unless` genéricos ("Forbidden", "This action is unauthorized.") taparían
	// el texto que distingue falta de permiso de falta de acceso a la subsidiaria.
	if (responseRecord?.status === FORBIDDEN_STATUS)
		return backendMessage && !isGenericForbiddenMessage(backendMessage)
			? backendMessage
			: FORBIDDEN_MESSAGE;

	if (backendMessage) return backendMessage;

	// Cubre tanto un `Error` como un rejectValue plano `{ message, errors? }`. Para un
	// AxiosError nunca llega aquí con su `message` técnico: los casos con respuesta ya
	// se resolvieron arriba.
	const errorMessage = asRecord(error)?.message;
	if (typeof errorMessage === 'string' && errorMessage.trim()) return errorMessage;
	return fallback;
};

export default getDeferredPaymentErrorMessage;
