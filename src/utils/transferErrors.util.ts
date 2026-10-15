import { resolveProcurementError } from '@/utils/procurementErrors.util';
import { isRecord } from '@/utils/isRecord.util';

/**
 * Errores de `POST /branches/{branch}/transfers` (traslado entre sucursales).
 * Desde la tarea 16 del backend:
 * - 403: hace falta acceso a las dos sucursales, también en la etapa 1.
 * - 422 sin `errors`: regla de negocio (stock insuficiente…); su `message` manda.
 * - 422 con `errors`: validación por campo (sucursal de otra filial en `to_branch_id`).
 * - 500: falla inesperada con el cuerpo genérico del servidor; no se muestra.
 */

export type TTransferErrorKind = 'forbidden' | 'validation' | 'business' | 'server' | 'unknown';

/** Campos del formulario de traslado que reciben errores del backend. */
export type TTransferFormField = 'to_branch_id' | 'from_warehouse_id' | 'to_warehouse_id' | 'items';

/** Rechazo tipado de `createTransfer`. */
export interface ITransferError {
	status: number | null;
	kind: TTransferErrorKind;
	message: string;
	/** `errors` por campo de un 422 de validación, tal como los envía Laravel. */
	fieldErrors: Record<string, string[]> | null;
}

const TRANSFER_FALLBACK_MESSAGE = 'No se pudo crear la transferencia.';

export const TRANSFER_FORBIDDEN_MESSAGE =
	'No tienes acceso a la sucursal de destino: el traslado exige alcanzar las dos sucursales. Elige otra sucursal o pide a alguien con acceso a ambas que lo registre.';

export const TRANSFER_SERVER_ERROR_MESSAGE =
	'Ocurrió un error inesperado al registrar la transferencia. Inténtalo de nuevo en unos minutos; si persiste, avisa a soporte.';

export const TRANSFER_VALIDATION_MESSAGE = 'Revisa los campos marcados en el formulario.';

const resolveKind = (status: number | null, hasFieldErrors: boolean): TTransferErrorKind => {
	if (status === 403) return 'forbidden';
	if (status !== null && status >= 500) return 'server';
	if (status === 422) return hasFieldErrors ? 'validation' : 'business';
	return 'unknown';
};

/** Acepta el error de Axios del envío (o el string de un rechazo local). */
export const resolveTransferError = (error: unknown): ITransferError => {
	const resolved = resolveProcurementError(error, TRANSFER_FALLBACK_MESSAGE);
	const kind = resolveKind(resolved.status, resolved.fieldErrors !== null);

	const messageByKind: Partial<Record<TTransferErrorKind, string>> = {
		forbidden: TRANSFER_FORBIDDEN_MESSAGE,
		server: TRANSFER_SERVER_ERROR_MESSAGE,
	};

	return {
		status: resolved.status,
		kind,
		message: messageByKind[kind] ?? resolved.message,
		// En un 500 el cuerpo es del servidor: nada de él llega a la UI.
		fieldErrors: kind === 'server' ? null : resolved.fieldErrors,
	};
};

const isTransferError = (value: unknown): value is ITransferError =>
	isRecord(value) && typeof value.message === 'string' && typeof value.kind === 'string';

/**
 * Normaliza lo que rechaza `createTransfer(...).unwrap()`: el `ITransferError`
 * de `rejectWithValue` o, si el thunk lanzó antes, un `SerializedError`.
 */
export const toTransferError = (error: unknown): ITransferError => {
	if (isTransferError(error)) return error;
	const message = isRecord(error) ? error.message : undefined;
	return resolveTransferError(typeof message === 'string' ? message : error);
};

const toFormField = (apiField: string): TTransferFormField | null => {
	if (
		apiField === 'to_branch_id' ||
		apiField === 'from_warehouse_id' ||
		apiField === 'to_warehouse_id'
	) {
		return apiField;
	}
	if (apiField === 'items' || apiField.startsWith('items.')) return 'items';
	return null;
};

export interface ITransferFieldErrorsSplit {
	/** Mensaje por campo del formulario; los de `items` y `items.N` van juntos. */
	byField: Partial<Record<TTransferFormField, string>>;
	/** Mensajes de campos sin equivalente en el formulario (`notes`, `branch`…). */
	unmapped: string[];
}

/** Reparte los `errors` de un 422 entre los campos del formulario y el aviso general. */
export const splitTransferFieldErrors = (
	fieldErrors: Record<string, string[]> | null,
): ITransferFieldErrorsSplit => {
	const byField: Partial<Record<TTransferFormField, string>> = {};
	const unmapped: string[] = [];

	Object.entries(fieldErrors ?? {}).forEach(([apiField, messages]) => {
		const text = messages.join(' ');
		const formField = toFormField(apiField);
		if (!formField) {
			unmapped.push(text);
			return;
		}
		byField[formField] = byField[formField] ? `${byField[formField]} ${text}` : text;
	});

	return { byField, unmapped };
};
