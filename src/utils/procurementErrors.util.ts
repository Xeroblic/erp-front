import type { IProcurementSupplierRutConflict } from '@/interface/procurement.interface';

/**
 * El backend responde `{"message","code"}` y su `message` manda; este mapa aporta
 * la acción a ofrecer y un texto de respaldo para cuando no llega mensaje.
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
	code: string;
	status: number;
	/** Sólo se usa si la respuesta no trae `message`. */
	fallbackMessage: string;
	action: TProcurementErrorAction;
}

const define = (
	code: string,
	status: number,
	fallbackMessage: string,
	action: TProcurementErrorAction,
): IProcurementErrorDefinition => ({ code, status, fallbackMessage, action });

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
		'La recepción ya fue ingresada al stock.',
		'reload_resource',
	),
	RECEIPT_NOT_POSTED: define(
		'RECEIPT_NOT_POSTED',
		409,
		'La recepción todavía no ingresa al stock.',
		'reload_resource',
	),
	RECEIPT_ALREADY_CONSUMED: define(
		'RECEIPT_ALREADY_CONSUMED',
		409,
		'La recepción ya fue consumida: corrige con un ajuste explícito.',
		'blocked',
	),
	RECEIPT_STOCK_RESERVED: define(
		'RECEIPT_STOCK_RESERVED',
		409,
		'Revertir dejaría menos stock disponible que el ya reservado: libera las reservas primero.',
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
	// Etapa 1 del despliegue: no hay reintento útil hasta que la filial pase a la etapa 2.
	MULTI_LOCATION_NOT_ENABLED: define(
		'MULTI_LOCATION_NOT_ENABLED',
		409,
		'La sucursal todavía opera con una sola ubicación: no se puede trasladar entre bodegas ni ajustar una bodega.',
		'blocked',
	),
	// El mismo cierre responde lo mismo hasta que cambie el stock: no se reintenta.
	SALE_STOCK_INSUFFICIENT: define(
		'SALE_STOCK_INSUFFICIENT',
		409,
		'No hay stock suficiente para cerrar la venta.',
		'blocked',
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
	// Trae `code`, así que no cae en el 428 de `If-Match`: recargar no lo arregla.
	IDEMPOTENCY_KEY_REQUIRED: define(
		'IDEMPOTENCY_KEY_REQUIRED',
		428,
		'Falta la clave de la operación. Vuelve a intentarlo; si persiste, avisa a soporte.',
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
 * Motivo del `409 MULTI_LOCATION_NOT_ENABLED`. El `message` del backend dice qué
 * no se puede hacer; esto explica por qué, para que no parezca una falla.
 */
export const MULTI_LOCATION_NOT_ENABLED_REASON =
	'Mientras la sucursal opera con una sola ubicación, el stock vive en «Sin ubicación», que es de donde salen las ventas.';

// Rechazos del mock sin código estable en el contrato: se usan en el `fail(...)`
// del servicio y quedan fuera de `PROCUREMENT_ERROR_DEFINITIONS`.
export const PURCHASE_DOCUMENT_ITEMS_EMPTY_MESSAGE = 'El documento necesita al menos una línea.';
export const PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS_MESSAGE =
	'No se puede anular: el documento ya tiene recepciones o asignaciones de stock inicial.';
export const PURCHASE_DOCUMENT_NOT_DRAFT_MESSAGE = 'El documento ya no está en borrador.';

export const RECEIPT_DOCUMENT_SUPPLIER_MISMATCH_MESSAGE =
	'El proveedor del documento no coincide con el proveedor ya conocido de la recepción.';

/** `428` (falta `If-Match`) no trae código: se recarga para obtener el ETag vigente. */
const PRECONDITION_REQUIRED_STATUS = 428;

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
 * Sin respuesta no se sabe si la escritura llegó: sólo es seguro reintentar con
 * la misma `Idempotency-Key`, porque una nueva duplicaría la operación.
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

/** Vive junto a la clasificación para que `action` y los helpers de reintento no discrepen. */
/**
 * Sin respuesta del servidor: timeout, red caída o petición cancelada
 * (`ERR_CANCELED`). La cancelación cuenta igual a propósito: una escritura
 * abortada pudo haber llegado, y reintentarla con la misma clave es lo que
 * evita duplicarla. Las lecturas canceladas las descartan los slices por
 * `meta.aborted` antes de mostrar nada.
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
	message: string;
	action: TProcurementErrorAction;
	/** `errors` por campo de un 422, tal como los envía Laravel. */
	fieldErrors: Record<string, string[]> | null;
	/** `context` que un 409 puede traer con IDs/saldos para refrescar. */
	context: Record<string, unknown> | null;
	/**
	 * Del 409 `SUPPLIER_RUT_ALREADY_EXISTS`, la única respuesta que no usa el
	 * envoltorio común: se lee al nivel de `message`, no de `context`.
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
 * Acepta el error de Axios, el `data` de la respuesta ya extraído o el string
 * con el que un thunk rechaza vía `rejectWithValue`.
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

	// Sin respuesta, el `code` del error es el de Axios (`ECONNABORTED`), no uno del contrato.
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
	// Con respuesta, el cuerpo es lo único que vale: si no es un objeto (428 vacío,
	// HTML de un proxy), caer al error de Axios mostraría su `code` y su `message`
	// en inglés como si fueran del contrato.
	const dataRecord = responseRecord ? asRecord(responseRecord.data) : errorRecord;
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

/**
 * Pinta el primer mensaje de cada campo de un 422 sobre el formulario.
 * `toFormField` traduce el nombre del backend al del formulario; los campos
 * sin equivalente se omiten (el mensaje general ya se muestra aparte).
 */
export const applyProcurementFieldErrors = (
	fieldErrors: Record<string, string[]> | null,
	toFormField: (apiField: string) => string | null | undefined,
	setFieldError: (field: string, message: string) => void,
): void => {
	Object.entries(fieldErrors ?? {}).forEach(([apiField, messages]) => {
		const formField = toFormField(apiField);
		if (formField && messages[0]) setFieldError(formField, messages[0]);
	});
};

/** Atajo para los slices, que solo necesitan el texto. */
export const getProcurementErrorMessage = (error: unknown, fallbackMessage?: string): string =>
	resolveProcurementError(error, fallbackMessage).message;
