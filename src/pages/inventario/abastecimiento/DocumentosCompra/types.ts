import * as Yup from 'yup';
import { costEntrySchema } from '@/components/procurement';
import type {
	TCostEntryBasis,
	TPurchaseDocumentReceptionStatus,
	TPurchaseDocumentStatus,
	TPurchaseDocumentType,
} from '@/interface/procurement.interface';

/**
 * Tipos y validación de la pantalla de documentos de compra (card 03,
 * sección 6 del contrato de abastecimiento). Los tipos de dominio —
 * `IPurchaseDocument`, `IPurchaseDocumentCreatePayload`, etc.— viven en
 * `@/interface/procurement.interface.ts`; acá sólo lo propio de esta
 * pantalla: filtros con «Todos» y el formulario de alta/edición.
 */

/* =================================================
   Filtros del listado
   ================================================= */

export type TDocumentTypeFilter = TPurchaseDocumentType | 'all';
export type TDocumentStatusFilter = TPurchaseDocumentStatus | 'all';
export type TDocumentReceptionStatusFilter = TPurchaseDocumentReceptionStatus | 'all';

export const DOCUMENT_TYPE_FILTER_OPTIONS: { value: TDocumentTypeFilter; label: string }[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'invoice', label: 'Factura' },
	{ value: 'receipt', label: 'Boleta' },
];

export const DOCUMENT_STATUS_FILTER_OPTIONS: { value: TDocumentStatusFilter; label: string }[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'draft', label: 'Borrador' },
	{ value: 'confirmed', label: 'Confirmado' },
	{ value: 'cancelled', label: 'Anulado' },
];

export const DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS: {
	value: TDocumentReceptionStatusFilter;
	label: string;
}[] = [
	{ value: 'all', label: 'Todas' },
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'partially_received', label: 'Parcialmente recibida' },
	{ value: 'received', label: 'Recibida' },
];

export const DOCUMENT_TYPE_LABELS: Record<TPurchaseDocumentType, string> = {
	invoice: 'Factura',
	receipt: 'Boleta',
};

export const DOCUMENT_STATUS_LABELS: Record<TPurchaseDocumentStatus, string> = {
	draft: 'Borrador',
	confirmed: 'Confirmado',
	cancelled: 'Anulado',
};

export const DOCUMENT_RECEPTION_STATUS_LABELS: Record<TPurchaseDocumentReceptionStatus, string> = {
	pending: 'Pendiente',
	partially_received: 'Parcialmente recibida',
	received: 'Recibida',
};

/* =================================================
   Formulario de alta/edición
   ================================================= */

/** Todo string/'' para que Formik e `Input`/`SelectReact` no controlen a medias. */
export interface IDocumentoCompraLineFormValues {
	/** Presente sólo al editar una línea existente: la distingue de una nueva. */
	id?: number;
	product_id: number | '';
	quantity: string;
	unit_cost: string;
	unit_cost_basis: TCostEntryBasis | '';
	notes: string;
}

export interface IDocumentoCompraFormValues {
	document_type: TPurchaseDocumentType;
	supplier_id: number | '';
	document_number: string;
	issue_date: string;
	total_amount: string;
	notes: string;
	items: IDocumentoCompraLineFormValues[];
}

export const EMPTY_DOCUMENTO_LINE: IDocumentoCompraLineFormValues = {
	product_id: '',
	quantity: '1',
	unit_cost: '',
	unit_cost_basis: '',
	notes: '',
};

export const EMPTY_DOCUMENTO_VALUES: IDocumentoCompraFormValues = {
	document_type: 'invoice',
	supplier_id: '',
	document_number: '',
	issue_date: '',
	total_amount: '',
	notes: '',
	items: [{ ...EMPTY_DOCUMENTO_LINE }],
};

/**
 * Reusa los campos de `costEntrySchema` (`@/components/procurement`) en vez
 * de repetir la validación del costo unitario: monto y base obligatorios en
 * toda línea, factura o boleta (sección 6).
 */
const lineSchema = Yup.object({
	id: Yup.number().optional(),
	product_id: Yup.number()
		.typeError('Selecciona un producto.')
		.required('Selecciona un producto.'),
	quantity: Yup.number()
		.typeError('Indica una cantidad válida.')
		.integer('La cantidad debe ser un entero.')
		.positive('La cantidad debe ser mayor que cero.')
		.required('Indica la cantidad.'),
	...costEntrySchema.fields,
	notes: Yup.string().max(500, 'Máximo 500 caracteres.'),
});

/**
 * `supplier_id` es obligatorio sólo para factura — «la boleta lo permite
 * null» (sección 6). El resto de los obligatorios del contrato: folio, fecha
 * de emisión y al menos una línea.
 */
export const documentoCompraFormSchema = Yup.object({
	document_type: Yup.string().oneOf(['invoice', 'receipt']).required(),
	supplier_id: Yup.number()
		// `''` (sin seleccionar) castea a `NaN`, no a `null`/`undefined`: sin este
		// transform, la boleta —que permite proveedor sin especificar— rechazaba
		// igual que si fuera obligatorio, con el mensaje genérico de Yup en vez
		// del propio. Mismo defecto que `absentToUndefined` resuelve en
		// `costEntry.schema.ts` para el costo opcional.
		.transform((value: number, originalValue: unknown) =>
			originalValue === '' ? undefined : value,
		)
		.nullable()
		.when('document_type', {
			is: 'invoice',
			then: (schema) => schema.required('La factura requiere proveedor.'),
		}),
	document_number: Yup.string().required('Indica el folio.').max(50, 'Máximo 50 caracteres.'),
	issue_date: Yup.string().required('Indica la fecha de emisión.'),
	total_amount: Yup.string().max(20, 'Monto demasiado largo.'),
	notes: Yup.string().max(1000, 'Máximo 1000 caracteres.'),
	items: Yup.array().of(lineSchema).min(1, 'Agrega al menos una línea.'),
});
