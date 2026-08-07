/**
 * Traducción de los fallos del flujo de activación de cuenta
 * (`GET/POST /usuarios/activar`) a mensajes legibles en español.
 */

export const GENERIC_ACTIVATION_ERROR = 'No se pudo activar la cuenta. Inténtalo nuevamente.';

export const NETWORK_ACTIVATION_ERROR =
	'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';

export const SERVER_ACTIVATION_ERROR =
	'El servidor no pudo procesar tu invitación en este momento. Inténtalo nuevamente en unos minutos.';

/**
 * Mensajes por estado HTTP. Se decide por `status` y no por el texto de la
 * respuesta: el backend responde en inglés y, ante un fallo interno, su
 * `message` puede traer detalle técnico que no debe llegar al usuario final.
 */
const ACTIVATION_ERROR_BY_STATUS: Record<number, string> = {
	404: 'Este enlace de activación no es válido. Verifica que hayas copiado la URL completa del correo.',
	410: 'Esta invitación ya fue utilizada o expiró. Solicita una nueva a quien te invitó.',
	422: 'Los datos enviados no son válidos. Revisa la contraseña e inténtalo nuevamente.',
};

interface ActivationApiError {
	response?: {
		status?: number;
		data?: {
			detail?: string;
			message?: string;
			errors?: Record<string, string[]>;
		};
	};
	message?: string;
}

/** Devuelve el primer mensaje de un mapa de errores de validación de Laravel. */
const firstValidationMessage = (errors?: Record<string, string[]>): string | null => {
	if (!errors) return null;

	for (const key of Object.keys(errors)) {
		const messages = errors[key];
		if (Array.isArray(messages) && messages.length > 0) {
			return messages[0];
		}
	}

	return null;
};

export const resolveActivationError = (error: unknown): string => {
	if (!error || typeof error !== 'object') {
		return GENERIC_ACTIVATION_ERROR;
	}

	const { response } = error as ActivationApiError;

	// Sin respuesta del servidor: red caída, CORS o timeout.
	if (!response) {
		return NETWORK_ACTIVATION_ERROR;
	}

	const status = response.status ?? 0;
	const mapped = ACTIVATION_ERROR_BY_STATUS[status];

	if (mapped) {
		// En 422 preferimos el detalle de validación del campo, que sí es accionable.
		if (status === 422) {
			const validationMessage = firstValidationMessage(response.data?.errors);
			if (validationMessage) return validationMessage;
		}
		return mapped;
	}

	// 5xx: nunca exponer el mensaje crudo del servidor al usuario final.
	if (status >= 500) {
		return SERVER_ACTIVATION_ERROR;
	}

	const detail = response.data?.detail ?? response.data?.message;
	if (detail) return detail;

	return firstValidationMessage(response.data?.errors) ?? GENERIC_ACTIVATION_ERROR;
};

export default resolveActivationError;
