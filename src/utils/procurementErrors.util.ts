import type { IProcurementSupplierRutConflict } from '@/interface/procurement.interface';

/**
 * Mapa de errores estables del contrato de abastecimiento (sección 16 del
 * `frontend-guide.md`, PR #67).
 *
 * El backend responde `{"message":"Texto en español","code":"CODIGO_ESTABLE"}`.
 * El `message` es el texto de autoridad; este mapa aporta la **acción** que
 * corresponde ofrecer y un texto de respaldo para cuando la respuesta no traiga
 * mensaje (timeout, error de red, respuesta truncada).
 */

/**
 * Qué debe hacer la UI ante el error, no cómo se ve.
 * - `retry_same_key`: reintentar reusando la misma `Idempotency-Key`.
 * - `reload_resource`: recargar el recurso antes de volver a editar.
 * - `reload_selection`: recargar la selección/preview con los saldos vigentes.
 * - `fix_input`: corregir el formulario; la escritura necesita clave nueva.
 * - `blocked`: el estado no permite la acción; no hay reintento útil.
 */
export type TProcurementErrorAction =
	| 'retry_same_key'
	| 'reload_resource'
	| 'reload_selection'
	| 'fix_input'
	| 'blocked';

export interface IProcurementErrorDefinition {
	/** Código estable del contrato. */
	code: string;
	/** Estado HTTP con el que el contrato lo emite. */
	status: number;
	/** Texto de respaldo, sólo si la respuesta no trae `message`. */
	fallbackMessage: string;
	action: TProcurementErrorAction;
}

const define = (
	code: string,
	status: number,
	fallbackMessage: string,
	action: TProcurementErrorAction,
): IProcurementErrorDefinition => ({ code, status, fallbackMessage, action });

/** Tabla completa de la sección 16, en el mismo orden del contrato. */
export const PROCUREMENT_ERROR_DEFINITIONS: Record<string, IProcurementErrorDefinition> = {
	SUPPLIER_RUT_ALREADY_EXISTS: define(
		'SUPPLIER_RUT_ALREADY_EXISTS',
		409,
		'Ya existe un proveedor con este RUT en esta filial.',
		'fix_input',
	),
	SUPPLIER_NAME_REQUIRED: define(
		'SUPPLIER_NAME_REQUIRED',
		422,
		'Indica la razón social o el nombre de contacto del proveedor.',
		'fix_input',
	),
	INVALID_CHILEAN_RUT: define('INVALID_CHILEAN_RUT', 422, 'El RUT no es válido.', 'fix_input'),
	INVOICE_SUPPLIER_REQUIRED: define(
		'INVOICE_SUPPLIER_REQUIRED',
		422,
		'Una factura requiere proveedor.',
		'fix_input',
	),
	INVOICE_SUPPLIER_INCOMPLETE: define(
		'INVOICE_SUPPLIER_INCOMPLETE',
		422,
		'El proveedor necesita giro y ambas direcciones para confirmar una factura.',
		'fix_input',
	),
	UNIT_COST_REQUIRED: define('UNIT_COST_REQUIRED', 422, 'Indica el costo unitario.', 'fix_input'),
	UNIT_COST_BASIS_REQUIRED: define(
		'UNIT_COST_BASIS_REQUIRED',
		422,
		'Indica si el costo ingresado es neto o bruto.',
		'fix_input',
	),
	DOCUMENT_NOT_CONFIRMED: define(
		'DOCUMENT_NOT_CONFIRMED',
		422,
		'El documento de compra debe estar confirmado.',
		'blocked',
	),
	RECEIPT_EXCEEDS_DOCUMENT: define(
		'RECEIPT_EXCEEDS_DOCUMENT',
		422,
		'La recepción supera lo pendiente del documento.',
		'reload_resource',
	),
	DOCUMENT_LINE_MISMATCH: define(
		'DOCUMENT_LINE_MISMATCH',
		422,
		'Las líneas no corresponden al documento indicado.',
		'reload_resource',
	),
	PURCHASE_DOCUMENT_IMMUTABLE: define(
		'PURCHASE_DOCUMENT_IMMUTABLE',
		409,
		'El documento ya no admite cambios.',
		'blocked',
	),
	RECEIPT_DOCUMENT_ALREADY_LINKED: define(
		'RECEIPT_DOCUMENT_ALREADY_LINKED',
		409,
		'La recepción ya tiene un documento vinculado.',
		'blocked',
	),
	RECEIPT_ALREADY_POSTED: define(
		'RECEIPT_ALREADY_POSTED',
		409,
		'La recepción ya fue contabilizada.',
		'reload_resource',
	),
	RECEIPT_NOT_POSTED: define(
		'RECEIPT_NOT_POSTED',
		409,
		'La recepción todavía no está contabilizada.',
		'reload_resource',
	),
	RECEIPT_ALREADY_CONSUMED: define(
		'RECEIPT_ALREADY_CONSUMED',
		409,
		'La recepción ya fue consumida: corrige con un ajuste explícito.',
		'blocked',
	),
	INSUFFICIENT_UNDOCUMENTED_STOCK: define(
		'INSUFFICIENT_UNDOCUMENTED_STOCK',
		409,
		'No hay suficiente stock sin respaldo documental.',
		'reload_selection',
	),
	LOCATION_SELECTION_REQUIRED: define(
		'LOCATION_SELECTION_REQUIRED',
		422,
		'Selecciona desde qué ubicación sale el stock.',
		'fix_input',
	),
	ALLOCATION_QUANTITY_MISMATCH: define(
		'ALLOCATION_QUANTITY_MISMATCH',
		422,
		'Las cantidades asignadas no cuadran con lo requerido.',
		'fix_input',
	),
	INSUFFICIENT_LOCATION_STOCK: define(
		'INSUFFICIENT_LOCATION_STOCK',
		409,
		'La ubicación no tiene stock suficiente.',
		'reload_selection',
	),
	INSUFFICIENT_BRANCH_STOCK: define(
		'INSUFFICIENT_BRANCH_STOCK',
		409,
		'La sucursal no tiene stock suficiente.',
		'reload_selection',
	),
	SALE_ALREADY_CLOSED: define('SALE_ALREADY_CLOSED', 409, 'La venta ya fue cerrada.', 'blocked'),
	RETURN_QUANTITY_MISMATCH: define(
		'RETURN_QUANTITY_MISMATCH',
		422,
		'Las cantidades devueltas no cuadran con el ciclo de venta.',
		'fix_input',
	),
	UNFIT_REASON_REQUIRED: define(
		'UNFIT_REASON_REQUIRED',
		422,
		'Indica el motivo de las unidades no aptas.',
		'fix_input',
	),
	RETURN_ALREADY_RECEIVED: define(
		'RETURN_ALREADY_RECEIVED',
		409,
		'La devolución ya fue recibida.',
		'reload_resource',
	),
	CRITICAL_THRESHOLD_NOT_ALLOWED: define(
		'CRITICAL_THRESHOLD_NOT_ALLOWED',
		422,
		'No puedes definir un umbral crítico para este producto.',
		'blocked',
	),
	IDEMPOTENCY_KEY_REUSED: define(
		'IDEMPOTENCY_KEY_REUSED',
		409,
		'La clave de la operación ya se usó con otros datos. Vuelve a intentarlo desde cero.',
		'fix_input',
	),
	OPERATION_IN_PROGRESS: define(
		'OPERATION_IN_PROGRESS',
		409,
		'La operación aún está en curso. Reintenta en unos segundos.',
		'retry_same_key',
	),
	RESOURCE_VERSION_CONFLICT: define(
		'RESOURCE_VERSION_CONFLICT',
		412,
		'Alguien más editó este registro. Recarga antes de volver a editar.',
		'reload_resource',
	),
};

/**
 * `428` no trae código estable: el contrato lo emite cuando falta la precondición
 * `If-Match`. Se trata como recarga porque el ETag vigente es lo que falta.
 */
export const PRECONDITION_REQUIRED_STATUS = 428;

const PRECONDITION_REQUIRED_DEFINITION: IProcurementErrorDefinition = define(
	'PRECONDITION_REQUIRED',
	PRECONDITION_REQUIRED_STATUS,
	'Falta la versión del registro. Recarga y vuelve a intentarlo.',
	'reload_resource',
);

const GENERIC_DEFINITION: IProcurementErrorDefinition = define(
	'UNKNOWN',
	0,
	'No pudimos completar la operación.',
	'fix_input',
);

/**
 * Fallo de transporte: la petición salió y no volvió respuesta (timeout, red
 * caída, petición abortada). **No prueba que la escritura no haya llegado**, así
 * que la única recuperación segura es reintentar con la misma
 * `Idempotency-Key`; generar otra convierte el reintento en una segunda
 * operación.
 */
const TRANSPORT_DEFINITION: IProcurementErrorDefinition = define(
	'TRANSPORT_FAILURE',
	0,
	'No pudimos confirmar si la operación llegó al servidor. Reintenta sin cambiar los datos.',
	'retry_same_key',
);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/**
 * Detecta el fallo de transporte. Vive acá, junto al resto de la clasificación,
 * para que `action` y los helpers de reintento no puedan discrepar: cuando cada
 * uno decidía por su cuenta, un timeout devolvía `fix_input` («corrige los
 * datos», que implica clave nueva) y a la vez «reintenta con la misma clave».
 */
export const isTransportError = (error: unknown): boolean => {
	const record = asRecord(error);
	if (!record) return false;

	if (asRecord(record.response)) return false;

	return record.isAxiosError === true || record.request !== undefined;
};

const asString = (value: unknown): string | undefined =>
	typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined =>
	typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export interface IProcurementResolvedError {
	code: string;
	status: number | null;
	/** Mensaje a mostrar: el del backend si vino, si no el de respaldo. */
	message: string;
	action: TProcurementErrorAction;
	/** `errors` por campo de un 422, tal como los envía Laravel. */
	fieldErrors: Record<string, string[]> | null;
	/** `context` que un 409 puede traer con IDs/saldos para refrescar. */
	context: Record<string, unknown> | null;
	/**
	 * `existing_supplier` del 409 `SUPPLIER_RUT_ALREADY_EXISTS` (sección 5 del
	 * contrato). Esa respuesta es la única excepción de compatibilidad que **no**
	 * usa el envoltorio común, así que se lee del mismo nivel que `message` y
	 * `code`, no de `context`. `null` fuera de ese error.
	 */
	existingSupplier: IProcurementSupplierRutConflict | null;
}

const parseSupplierConflict = (value: unknown): IProcurementSupplierRutConflict | null => {
	const record = asRecord(value);
	if (!record) return null;

	const id = asNumber(record.id);
	const displayName = asString(record.display_name);
	if (id === undefined || displayName === undefined) return null;

	return { id, display_name: displayName, is_active: record.is_active === true };
};

const parseFieldErrors = (value: unknown): Record<string, string[]> | null => {
	const record = asRecord(value);
	if (!record) return null;

	const parsed: Record<string, string[]> = {};
	Object.entries(record).forEach(([field, messages]) => {
		if (Array.isArray(messages)) {
			const texts = messages.filter((item): item is string => typeof item === 'string');
			if (texts.length > 0) parsed[field] = texts;
		} else {
			const single = asString(messages);
			if (single) parsed[field] = [single];
		}
	});

	return Object.keys(parsed).length > 0 ? parsed : null;
};

/**
 * Traduce cualquier error del módulo a `{code, message, action}`.
 *
 * Acepta el error de Axios completo, el `data` de la respuesta ya extraído, o el
 * string plano con el que un thunk rechaza vía `rejectWithValue`.
 */
export const resolveProcurementError = (
	error: unknown,
	fallbackMessage?: string,
): IProcurementResolvedError => {
	if (typeof error === 'string' && error.trim()) {
		return {
			code: GENERIC_DEFINITION.code,
			status: null,
			message: error.trim(),
			action: GENERIC_DEFINITION.action,
			fieldErrors: null,
			context: null,
			existingSupplier: null,
		};
	}

	// Antes de leer `code`: sin respuesta, el `code` que trae el error es el de
	// Axios (`ECONNABORTED`, `ERR_NETWORK`), no un código estable del contrato.
	// Presentarlo como tal haría pasar un fallo de red por un error de negocio.
	if (isTransportError(error)) {
		return {
			code: TRANSPORT_DEFINITION.code,
			status: null,
			message: TRANSPORT_DEFINITION.fallbackMessage,
			action: TRANSPORT_DEFINITION.action,
			fieldErrors: null,
			context: null,
			existingSupplier: null,
		};
	}

	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	// El error de Axios trae `response.data`; un `data` ya desempaquetado llega plano.
	const dataRecord = asRecord(responseRecord?.data) ?? errorRecord;
	const status = asNumber(responseRecord?.status) ?? asNumber(dataRecord?.status) ?? null;
	const code = asString(dataRecord?.code);

	let definition = code ? PROCUREMENT_ERROR_DEFINITIONS[code] : undefined;
	if (!definition && status === PRECONDITION_REQUIRED_STATUS) {
		definition = PRECONDITION_REQUIRED_DEFINITION;
	}
	const resolved = definition ?? GENERIC_DEFINITION;

	const backendMessage = asString(dataRecord?.message);

	return {
		code: code ?? resolved.code,
		status,
		message:
			backendMessage ??
			(definition ? resolved.fallbackMessage : (fallbackMessage ?? resolved.fallbackMessage)),
		action: resolved.action,
		fieldErrors: parseFieldErrors(dataRecord?.errors),
		context: asRecord(dataRecord?.context) ?? null,
		existingSupplier: parseSupplierConflict(dataRecord?.existing_supplier),
	};
};

/** Atajo para los slices, que solo necesitan el texto. */
export const getProcurementErrorMessage = (error: unknown, fallbackMessage?: string): string =>
	resolveProcurementError(error, fallbackMessage).message;
