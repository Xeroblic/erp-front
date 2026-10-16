import { isRecord } from '@/utils/isRecord.util';

/**
 * Errores al mover stock serializado entre la filial y sus sucursales
 * (`assign-stock`, `unassign-stock`, `transfer-stock`, `bulk-transfer-stock`).
 * Desde la QA de la etapa 2 del backend (#127, F1–F3):
 * - 403: falta acceso a una de las sucursales que toca la operación. Llega con el
 *   cuerpo genérico «No tienes permiso para realizar esta acción.», sin código, así
 *   que la causa se nombra acá según la operación.
 * - 422: su mensaje manda. `assign-stock` manda los motivos por línea en `errors`
 *   como lista de strings («La línea nombra el producto #N, que no es '…'.»).
 */

/** Rechazo tipado de los thunks que mueven stock. */
export interface IStockRequestError {
	status: number | null;
	message: string;
}

const readStatus = (error: unknown): number | null => {
	if (!isRecord(error) || !isRecord(error.response)) return null;
	const { status } = error.response;
	return typeof status === 'number' ? status : null;
};

const toValidationValues = (errors: unknown): unknown[] => {
	// Laravel los manda por campo (`{ campo: [msg] }`); `assign-stock`, como lista.
	if (Array.isArray(errors)) return errors as unknown[];
	return isRecord(errors) ? Object.values(errors) : [];
};

const readValidationMessages = (errors: unknown): string[] => {
	const messages = toValidationValues(errors)
		.flatMap((value: unknown): unknown[] => (Array.isArray(value) ? value : [value]))
		.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
	return Array.from(new Set(messages));
};

/** Mensaje del backend: los motivos de un 422, su `message` o el del error de Axios. */
export const getStockApiMessage = (error: unknown, fallback: string): string => {
	if (!isRecord(error)) return fallback;

	const data = isRecord(error.response) ? error.response.data : undefined;
	if (isRecord(data)) {
		const messages = readValidationMessages(data.errors);
		if (messages.length === 1) return messages[0];
		if (messages.length > 1) return `${messages[0]} (y ${messages.length - 1} más)`;
		if (typeof data.message === 'string' && data.message.trim()) return data.message;
	}

	return typeof error.message === 'string' && error.message.trim() ? error.message : fallback;
};

/** Acepta el error de Axios del envío. */
export const toStockRequestError = (error: unknown, fallback: string): IStockRequestError => ({
	status: readStatus(error),
	message: getStockApiMessage(error, fallback),
});

const isStockRequestError = (value: unknown): value is IStockRequestError =>
	isRecord(value) &&
	typeof value.message === 'string' &&
	(value.status === null || typeof value.status === 'number');

/**
 * Normaliza lo que rechaza `thunk(...).unwrap()`: el `IStockRequestError` de
 * `rejectWithValue` o, si el thunk lanzó antes, un `SerializedError`.
 */
export const asStockRequestError = (error: unknown, fallback: string): IStockRequestError => {
	if (isStockRequestError(error)) return error;
	return { status: null, message: getStockApiMessage(error, fallback) };
};

/** Qué sucursales exige el backend según la operación. */
export type TStockForbiddenContext =
	| {
			operation: 'assign';
			destinationBranchName?: string | null;
			/**
			 * Un producto no serializado saca el stock de su propia sucursal, que también
			 * se exige; uno serializado lo saca del pool de la filial.
			 */
			takesFromProductBranch: boolean;
	  }
	| { operation: 'unassign'; sourceBranchName?: string | null }
	| {
			operation: 'transfer';
			sourceBranchName?: string | null;
			destinationBranchName?: string | null;
	  };

const named = (label: string, name?: string | null): string =>
	name?.trim() ? `${label} (${name.trim()})` : label;

export const stockForbiddenMessage = (context: TStockForbiddenContext): string => {
	if (context.operation === 'assign') {
		const destination = named('la sucursal de destino', context.destinationBranchName);
		return context.takesFromProductBranch
			? `No tienes permiso para asignar este stock: necesitas acceso a ${destination} y a la sucursal del producto, de la que sale el stock.`
			: `No tienes permiso para asignar este stock: necesitas acceso a ${destination}.`;
	}
	if (context.operation === 'unassign') {
		return `No tienes permiso para devolver estas series a la filial: necesitas acceso a ${named('la sucursal de la que salen', context.sourceBranchName)}.`;
	}
	return `No tienes permiso para trasladar estas series: necesitas acceso a ${named('la sucursal de origen', context.sourceBranchName)} y a ${named('la de destino', context.destinationBranchName)}.`;
};

/** El 403 se explica según la operación; cualquier otro rechazo conserva su mensaje. */
export const describeStockRequestError = (
	error: IStockRequestError,
	context: TStockForbiddenContext,
): string => (error.status === 403 ? stockForbiddenMessage(context) : error.message);
