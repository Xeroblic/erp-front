import * as Yup from 'yup';
import { optionalCostEntrySchema } from '@/components/procurement';
import type { TCostEntryBasis, TStockReceiptStatus } from '@/interface/procurement.interface';

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
	{ value: 'queued', label: 'Procesando' },
	{ value: 'posted', label: 'Contabilizada' },
	{ value: 'failed', label: 'Con error' },
	{ value: 'reversed', label: 'Revertida' },
	{ value: 'cancelled', label: 'Anulada' },
];

export const STOCK_RECEIPT_STATUS_LABELS: Record<TStockReceiptStatus, string> = {
	draft: 'Borrador',
	queued: 'Procesando',
	posted: 'Contabilizada',
	failed: 'Con error',
	reversed: 'Revertida',
	cancelled: 'Anulada',
};

/* =================================================
   Formulario de alta (y corrección de `draft`/`failed`)
   ================================================= */

/** Dos caminos de alta (sección 7): con documento confirmado, o sin él. */
export type TRecepcionFormMode = 'with_document' | 'manual';

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
	/** Modo `manual`. */
	product_id: number | '';
	quantity: string;
	unit_cost: string;
	unit_cost_basis: TCostEntryBasis | '';
}

export interface IRecepcionFormValues {
	mode: TRecepcionFormMode;
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

export const EMPTY_RECEPCION_VALUES: IRecepcionFormValues = {
	mode: 'manual',
	purchase_document_id: '',
	warehouse_id: '',
	supplier_id: '',
	received_on: '',
	reason: '',
	notes: '',
	items: [{ ...EMPTY_RECEPCION_LINE }],
};

const withDocumentLineSchema = Yup.object({
	id: Yup.number().optional(),
	purchase_document_line_id: Yup.number()
		.typeError('Selecciona una línea del documento.')
		.required('Selecciona una línea del documento.'),
	quantity: Yup.number()
		.typeError('Indica una cantidad válida.')
		.integer('La cantidad debe ser un entero.')
		.positive('La cantidad debe ser mayor que cero.')
		.required('Indica la cantidad.'),
});

/**
 * Reusa `optionalCostEntrySchema` (`@/components/procurement`): monto y base
 * viajan juntos o ambos ausentes. Que el costo sea **obligatorio** cuando el
 * proveedor es conocido lo valida el servicio mock (`UNIT_COST_REQUIRED`),
 * no este schema — el campo que lo decide (`supplier_id`) vive en la raíz
 * del formulario, no en cada línea, mismo criterio que
 * `documentoCompraFormSchema` deja los errores de línea sólo para el toast.
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

export const recepcionFormSchema = Yup.object({
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
	received_on: Yup.string().required('Indica la fecha de recepción.'),
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
		then: () => Yup.array().of(withDocumentLineSchema).min(1, 'Agrega al menos una línea.'),
		otherwise: () => Yup.array().of(manualLineSchema).min(1, 'Agrega al menos una línea.'),
	}),
});
