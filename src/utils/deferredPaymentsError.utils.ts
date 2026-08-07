const FORBIDDEN_STATUS = 403;

const FORBIDDEN_MESSAGE =
	'No puedes realizar esta acción: puede deberse a que no tienes el permiso necesario o a que no tienes acceso a esta subsidiaria. Revisa tu rol y el alcance organizacional asignado.';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/**
 * Mensaje de error para el módulo de Pagos Diferidos. Un 403 aquí puede significar
 * "no tienes el permiso" o "no tienes acceso a esta subsidiaria" (ZF-15) — el backend
 * no distingue el caso en el mensaje, así que lo cubrimos ambos en el front.
 */
const getDeferredPaymentErrorMessage = (error: unknown, fallback: string): string => {
	const responseRecord = asRecord(asRecord(error)?.response);
	const dataRecord = asRecord(responseRecord?.data);
	if (typeof dataRecord?.message === 'string' && dataRecord.message.trim())
		return dataRecord.message;

	if (responseRecord?.status === FORBIDDEN_STATUS) return FORBIDDEN_MESSAGE;

	if (error instanceof Error && error.message.trim()) return error.message;
	return fallback;
};

export default getDeferredPaymentErrorMessage;
