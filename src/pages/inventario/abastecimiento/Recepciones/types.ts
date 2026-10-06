import * as Yup from 'yup';
import { optionalCostEntrySchema } from '@/components/procurement';
import {
	LIST_MAX_PER_PAGE,
	parseBusinessDateParam,
	parseIdParam,
	parseOptionParam,
	parsePageParam,
} from '@/utils/listSearchParams.util';
import type { TCostEntryBasis, TStockReceiptStatus } from '@/interface/procurement.interface';
import { withinPendingPerDocumentLine } from './utils/pendingPerDocumentLine';

/**
 * Tipos y validación de la pantalla de recepciones físicas (card 05,
 * sección 7 del contrato de abastecimiento). Los tipos de dominio —
 * `IStockReceipt`, `IStockReceiptCreatePayload`, etc.— viven en
 * `@/interface/procurement.interface.ts`; acá sólo lo propio de esta
 * pantalla: filtros con «Todos» y el formulario de alta con sus dos modos.
 */

/* =================================================
   Filtros del listado
   ================================================= */

export type TStockReceiptStatusFilter = TStockReceiptStatus | 'all';

export const STOCK_RECEIPT_STATUS_FILTER_OPTIONS: {
	value: TStockReceiptStatusFilter;
	label: string;
}[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'draft', label: 'Borrador' },
	{ value: 'queued', label: 'Ingresando' },
	{ value: 'posted', label: 'En stock' },
	{ value: 'failed', label: 'Con error' },
	{ value: 'reversed', label: 'Revertida' },
	{ value: 'cancelled', label: 'Anulada' },
];

export const STOCK_RECEIPT_STATUS_LABELS: Record<TStockReceiptStatus, string> = {
	draft: 'Borrador',
	queued: 'Ingresando',
	posted: 'En stock',
	failed: 'Con error',
	reversed: 'Revertida',
	cancelled: 'Anulada',
};

/**
 * El contrato usa 15 por defecto, pero el paginador estándar sólo ofrece 5,
 * 10, 20, 30, 40 y 50: con 15 el selector mostraba «Mostrar 5» mientras la
 * tabla listaba 15. Se pide 20, una de sus opciones.
 */
export const RECEPCIONES_PER_PAGE_DEFAULT = 20;

/**
 * Filtros y paginación del listado, tal como viven en la URL, con las claves
 * del contrato (`?status=posted&warehouse_id=8`). `purchase_document_id` no es
 * uno de ellos: en esta pantalla abre el alta con ese documento, no filtra.
 */
export interface IRecepcionesFilters {
	search: string;
	status: TStockReceiptStatusFilter;
	warehouseId: number | '';
	/** Rango de recepción `AAAA-MM-DD`; vacío = sin límite. */
	receivedFrom: string;
	receivedTo: string;
	page: number;
	perPage: number;
}

export const DEFAULT_RECEPCIONES_FILTERS: IRecepcionesFilters = {
	search: '',
	status: 'all',
	warehouseId: '',
	receivedFrom: '',
	receivedTo: '',
	page: 1,
	perPage: RECEPCIONES_PER_PAGE_DEFAULT,
};

/** Claves de la query que son del listado; cualquier otra se deja intacta. */
export const RECEPCIONES_FILTER_KEYS = [
	'search',
	'status',
	'warehouse_id',
	'received_from',
	'received_to',
	'page',
	'per_page',
] as const;

const STATUS_FILTER_VALUES = STOCK_RECEIPT_STATUS_FILTER_OPTIONS.map((option) => option.value);

/** Lee los filtros de la URL; un valor desconocido cae a su valor por defecto. */
export const parseRecepcionesFilters = (params: URLSearchParams): IRecepcionesFilters => ({
	search: params.get('search') ?? '',
	status: parseOptionParam(params.get('status'), STATUS_FILTER_VALUES, 'all'),
	warehouseId: parseIdParam(params.get('warehouse_id')) ?? '',
	receivedFrom: parseBusinessDateParam(params.get('received_from')),
	receivedTo: parseBusinessDateParam(params.get('received_to')),
	page: parsePageParam(params.get('page'), 1),
	perPage: parsePageParam(
		params.get('per_page'),
		RECEPCIONES_PER_PAGE_DEFAULT,
		LIST_MAX_PER_PAGE,
	),
});

/** Escribe sólo lo que difiere del valor por defecto, para URLs cortas y compartibles. */
export const serializeRecepcionesFilters = (filters: IRecepcionesFilters): URLSearchParams => {
	const params = new URLSearchParams();
	if (filters.search.trim()) params.set('search', filters.search);
	if (filters.status !== 'all') params.set('status', filters.status);
	if (filters.warehouseId !== '') params.set('warehouse_id', String(filters.warehouseId));
	if (filters.receivedFrom) params.set('received_from', filters.receivedFrom);
	if (filters.receivedTo) params.set('received_to', filters.receivedTo);
	if (filters.page !== 1) params.set('page', String(filters.page));
	if (filters.perPage !== RECEPCIONES_PER_PAGE_DEFAULT)
		params.set('per_page', String(filters.perPage));
	return params;
};

/* =================================================
   Formulario de alta (y corrección de `draft`/`failed`)
   ================================================= */

/** Dos caminos de alta (sección 7): con documento confirmado, o sin él. */
export type TStockReceiptFormMode = 'with_document' | 'manual';

/**
 * Qué hace el formulario después de guardar: dejar la recepción en borrador,
 * o además pedir su ingreso al stock (`POST /{id}/post`). El contrato no ofrece
 * un alta atómica que ingrese stock, así que la segunda es una llamada aparte.
 */
export type TStockReceiptSubmitIntent = 'save' | 'save_and_post';

/**
 * Una sola forma de línea para los dos modos: Formik no soporta bien un
 * `items` con forma distinta según otro campo del mismo formulario, así que
 * cada línea trae ambos grupos de campos y sólo se envían los que
 * corresponden al `mode` vigente (`toStockReceiptCreatePayload`).
 */
export interface IRecepcionLineFormValues {
	/** Presente sólo al reemplazar una línea existente (edición/corrección). */
	id?: number;
	/** Modo `with_document`. */
	purchase_document_line_id: number | '';
	/**
	 * Modo `with_document`: saldo pendiente de la línea del documento al
	 * cargarlo. Sólo de apoyo (tope de «Recibido»); nunca se envía.
	 */
	pending_quantity?: number;
	/** Modo `manual`. */
	product_id: number | '';
	quantity: string;
	unit_cost: string;
	unit_cost_basis: TCostEntryBasis | '';
}

export interface IStockReceiptFormValues {
	mode: TStockReceiptFormMode;
	purchase_document_id: number | '';
	warehouse_id: number | '';
	/** Modo `manual`: proveedor conocido, opcional. */
	supplier_id: number | '';
	received_on: string;
	/** Obligatorio sólo en modo `manual`. */
	reason: string;
	notes: string;
	items: IRecepcionLineFormValues[];
}

export const EMPTY_RECEPCION_LINE: IRecepcionLineFormValues = {
	purchase_document_line_id: '',
	product_id: '',
	quantity: '1',
	unit_cost: '',
	unit_cost_basis: '',
};

/**
 * El alta abre «con documento»: es el caso habitual (llega una factura o guía)
 * y sus líneas se precargan. Sin documento es la excepción.
 */
export const EMPTY_RECEPCION_VALUES: IStockReceiptFormValues = {
	mode: 'with_document',
	purchase_document_id: '',
	warehouse_id: '',
	supplier_id: '',
	received_on: '',
	reason: '',
	notes: '',
	items: [{ ...EMPTY_RECEPCION_LINE }],
};

/**
 * Con documento, todas sus líneas pendientes se precargan: una cantidad `0`
 * significa «no llegó» y esa línea no se envía (`hasReceivedQuantity`). El
 * tope es el pendiente de la línea; el backend lo vuelve a validar al ingresar.
 */
const withDocumentLineSchema = Yup.object({
	id: Yup.number().optional(),
	purchase_document_line_id: Yup.number()
		.typeError('Selecciona una línea del documento.')
		.required('Selecciona una línea del documento.'),
	pending_quantity: Yup.number().optional(),
	quantity: Yup.number()
		.typeError('Indica una cantidad válida.')
		.integer('La cantidad debe ser un entero.')
		.min(0, 'La cantidad no puede ser negativa.')
		.required('Indica la cantidad.')
		.test('max-pending', 'Supera lo pendiente del documento.', function maxPending(value) {
			const { parent }: { parent: unknown } = this;
			const pending =
				typeof parent === 'object' && parent !== null && 'pending_quantity' in parent
					? parent.pending_quantity
					: undefined;
			return typeof pending !== 'number' || value === undefined || value <= pending;
		}),
});

/** Una línea con documento sólo viaja si se recibió algo de ella. */
export const hasReceivedQuantity = (line: IRecepcionLineFormValues): boolean =>
	Number(line.quantity) > 0;

/**
 * Reusa `optionalCostEntrySchema` (`@/components/procurement`): monto y base
 * viajan juntos o ambos ausentes. Que el costo sea **obligatorio** cuando el
 * proveedor es conocido lo valida el servicio mock (`UNIT_COST_REQUIRED`),
 * no este schema — el campo que lo decide (`supplier_id`) vive en la raíz
 * del formulario, no en cada línea, mismo criterio que
 * `purchaseDocumentFormSchema` deja los errores de línea sólo para el toast.
 */
const manualLineSchema = Yup.object({
	id: Yup.number().optional(),
	product_id: Yup.number()
		.typeError('Selecciona un producto.')
		.required('Selecciona un producto.'),
	quantity: Yup.number()
		.typeError('Indica una cantidad válida.')
		.integer('La cantidad debe ser un entero.')
		.positive('La cantidad debe ser mayor que cero.')
		.required('Indica la cantidad.'),
	...optionalCostEntrySchema.fields,
});

const numberOrUndefined = (value: number, originalValue: unknown) =>
	originalValue === '' ? undefined : value;

export const stockReceiptFormSchema = Yup.object({
	mode: Yup.string().oneOf(['with_document', 'manual']).required(),
	purchase_document_id: Yup.number()
		.transform(numberOrUndefined)
		.nullable()
		.when('mode', {
			is: 'with_document',
			then: (schema) => schema.required('Selecciona un documento confirmado.'),
		}),
	warehouse_id: Yup.number().transform(numberOrUndefined).required('Selecciona una bodega.'),
	supplier_id: Yup.number().transform(numberOrUndefined).nullable(),
	received_on: Yup.string().required('Indica la fecha de llegada.'),
	reason: Yup.string().when('mode', {
		is: 'manual',
		then: (schema) =>
			schema
				.required('Indica el motivo del ingreso sin documento.')
				.max(500, 'Máximo 500 caracteres.'),
	}),
	notes: Yup.string().max(1000, 'Máximo 1000 caracteres.'),
	items: Yup.array().when('mode', {
		is: 'with_document',
		then: () =>
			Yup.array()
				.of(withDocumentLineSchema)
				.test(
					'some-received',
					'Indica la cantidad recibida de al menos una línea.',
					(items) =>
						(items ?? []).some(
							(line) => typeof line.quantity === 'number' && line.quantity > 0,
						),
				)
				.test(
					'lines-within-pending',
					'Varias filas de la misma línea del documento suman más que lo pendiente.',
					(items) => withinPendingPerDocumentLine(items ?? []),
				),
		otherwise: () => Yup.array().of(manualLineSchema).min(1, 'Agrega al menos una línea.'),
	}),
});
