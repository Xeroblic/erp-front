import type { ISaleStockShortageItem } from '@/interface/sales.interface';
import {
	resolveProcurementError,
	type IProcurementResolvedError,
} from '@/utils/procurementErrors.util';

export const SALE_STOCK_INSUFFICIENT_CODE = 'SALE_STOCK_INSUFFICIENT';

const SALE_CLOSE_FALLBACK_MESSAGE = 'No se pudo cerrar la venta.';

/**
 * El 403 llega con el cuerpo genérico del backend; en el cierre casi siempre
 * significa que el stock sale de una sucursal que el usuario no alcanza.
 */
export const SALE_CLOSE_FORBIDDEN_MESSAGE =
	'No tienes acceso para cerrar esta venta: el cierre exige alcanzar la sucursal de la que sale el stock. Pide a alguien de esa sucursal que la cierre.';

/**
 * Rechazo tipado de `closeSaleThunk`. Conserva `status`, `code` y `context` del
 * backend y agrega lo que la UI del cierre necesita ya parseado.
 */
export interface ISaleCloseError extends IProcurementResolvedError {
	/** Ítems de `context.items` del 409 `SALE_STOCK_INSUFFICIENT`; vacío en otro error. */
	shortages: ISaleStockShortageItem[];
	/** `sale_item_id` del 422 «Debes indicar las series…» (`required`); vacío en otro error. */
	requiredSerialItemIds: number[];
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

const asInteger = (value: unknown): number | undefined =>
	typeof value === 'number' && Number.isInteger(value) ? value : undefined;

const parseShortage = (value: unknown): ISaleStockShortageItem | null => {
	const record = asRecord(value);
	const saleItemId = asInteger(record?.sale_item_id);
	const productId = asInteger(record?.product_id);
	const requested = asInteger(record?.requested);
	const available = asInteger(record?.available);
	if (
		saleItemId === undefined ||
		productId === undefined ||
		requested === undefined ||
		available === undefined
	) {
		return null;
	}
	return {
		sale_item_id: saleItemId,
		product_id: productId,
		branch_id: asInteger(record?.branch_id) ?? null,
		requested,
		available,
	};
};

const parseShortages = (
	code: string,
	context: Record<string, unknown> | null,
): ISaleStockShortageItem[] => {
	if (code !== SALE_STOCK_INSUFFICIENT_CODE || !Array.isArray(context?.items)) return [];
	return context.items
		.map(parseShortage)
		.filter((item): item is ISaleStockShortageItem => item !== null);
};

/** `required` va en la raíz del cuerpo, fuera del envoltorio común. */
const parseRequiredSerialItemIds = (error: unknown): number[] => {
	const data = asRecord(asRecord(asRecord(error)?.response)?.data);
	if (!Array.isArray(data?.required)) return [];
	return data.required
		.map((entry) => asInteger(asRecord(entry)?.sale_item_id))
		.filter((id): id is number => id !== undefined);
};

/** Acepta el error de Axios del cierre (o el string de un rechazo legado). */
export const resolveSaleCloseError = (error: unknown): ISaleCloseError => {
	const resolved = resolveProcurementError(error, SALE_CLOSE_FALLBACK_MESSAGE);
	return {
		...resolved,
		message: resolved.status === 403 ? SALE_CLOSE_FORBIDDEN_MESSAGE : resolved.message,
		shortages: parseShortages(resolved.code, resolved.context),
		requiredSerialItemIds: parseRequiredSerialItemIds(error),
	};
};

const isSaleCloseError = (value: unknown): value is ISaleCloseError => {
	const record = asRecord(value);
	return (
		typeof record?.message === 'string' &&
		Array.isArray(record.shortages) &&
		Array.isArray(record.requiredSerialItemIds)
	);
};

/**
 * Normaliza lo que rechaza `closeSaleThunk(...).unwrap()`: el `ISaleCloseError`
 * de `rejectWithValue` o, si el thunk lanzó antes, un `SerializedError`.
 */
export const toSaleCloseError = (error: unknown): ISaleCloseError =>
	isSaleCloseError(error) ? error : resolveSaleCloseError(asRecord(error)?.message ?? error);

/** Sólo este error justifica abrir el formulario de series. */
export const isSerialsRequiredError = (error: ISaleCloseError): boolean =>
	error.status === 422 && error.requiredSerialItemIds.length > 0;
