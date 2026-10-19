import * as Yup from 'yup';
import { costEntrySchema, normalizeCostInput } from '@/components/procurement';
import { parseDecimalString } from '@/utils/procurementDecimal.util';
import {
	LIST_MAX_PER_PAGE,
	parseBusinessDateParam,
	parseIdParam,
	parseOptionParam,
	parsePageParam,
} from '@/utils/listSearchParams.util';
import { PRODUCT_TYPES } from '@/pages/catalogos/productos/constants/products.constant';
import type {
	TCostEntryBasis,
	TPurchaseDocumentReceptionStatus,
	TPurchaseDocumentStatus,
	TPurchaseDocumentType,
} from '@/interface/procurement.interface';

/**
 * Sólo lo propio de esta pantalla (filtros con «Todos» y formularios); los
 * tipos de dominio viven en `@/interface/procurement.interface.ts`.
 */

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

/**
 * El contrato usa 15 por defecto, pero el paginador estándar no ofrece 15 y
 * mostraría un tamaño distinto al listado. Se pide 20, una de sus opciones.
 */
export const DOCUMENTOS_COMPRA_PER_PAGE_DEFAULT = 20;

/**
 * Filtros y paginación del listado, tal como viven en la URL. Las claves de la
 * query son las mismas del contrato (`?status=draft&supplier_id=3`), así un
 * enlace se lee igual que la petición que dispara.
 */
export interface IDocumentosCompraFilters {
	search: string;
	documentType: TDocumentTypeFilter;
	status: TDocumentStatusFilter;
	receptionStatus: TDocumentReceptionStatusFilter;
	supplierId: number | null;
	/** Rango de emisión `AAAA-MM-DD`; vacío = sin límite. */
	issuedFrom: string;
	issuedTo: string;
	page: number;
	perPage: number;
}

/** Claves de la query que son del listado; cualquier otra se deja intacta. */
export const DOCUMENTOS_COMPRA_FILTER_KEYS = [
	'search',
	'document_type',
	'status',
	'reception_status',
	'supplier_id',
	'issued_from',
	'issued_to',
	'page',
	'per_page',
] as const;

const optionValues = <TValue extends string>(options: { value: TValue }[]): TValue[] =>
	options.map((option) => option.value);

/** Lee los filtros de la URL; un valor desconocido cae a su valor por defecto. */
export const parseDocumentosCompraFilters = (
	params: URLSearchParams,
): IDocumentosCompraFilters => ({
	search: params.get('search') ?? '',
	documentType: parseOptionParam(
		params.get('document_type'),
		optionValues(DOCUMENT_TYPE_FILTER_OPTIONS),
		'all',
	),
	status: parseOptionParam(
		params.get('status'),
		optionValues(DOCUMENT_STATUS_FILTER_OPTIONS),
		'all',
	),
	receptionStatus: parseOptionParam(
		params.get('reception_status'),
		optionValues(DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS),
		'all',
	),
	supplierId: parseIdParam(params.get('supplier_id')),
	issuedFrom: parseBusinessDateParam(params.get('issued_from')),
	issuedTo: parseBusinessDateParam(params.get('issued_to')),
	page: parsePageParam(params.get('page'), 1),
	perPage: parsePageParam(
		params.get('per_page'),
		DOCUMENTOS_COMPRA_PER_PAGE_DEFAULT,
		LIST_MAX_PER_PAGE,
	),
});

/** Escribe sólo lo que difiere del valor por defecto, para URLs cortas y compartibles. */
export const serializeDocumentosCompraFilters = (
	filters: IDocumentosCompraFilters,
): URLSearchParams => {
	const params = new URLSearchParams();
	if (filters.search.trim()) params.set('search', filters.search);
	if (filters.documentType !== 'all') params.set('document_type', filters.documentType);
	if (filters.status !== 'all') params.set('status', filters.status);
	if (filters.receptionStatus !== 'all') params.set('reception_status', filters.receptionStatus);
	if (filters.supplierId !== null) params.set('supplier_id', String(filters.supplierId));
	if (filters.issuedFrom) params.set('issued_from', filters.issuedFrom);
	if (filters.issuedTo) params.set('issued_to', filters.issuedTo);
	if (filters.page !== 1) params.set('page', String(filters.page));
	if (filters.perPage !== DOCUMENTOS_COMPRA_PER_PAGE_DEFAULT)
		params.set('per_page', String(filters.perPage));
	return params;
};

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

export interface IPurchaseDocumentFormValues {
	document_type: TPurchaseDocumentType;
	supplier_id: number | '';
	document_number: string;
	issue_date: string;
	total_amount: string;
	include_shipping: boolean;
	shipping_cost: string;
	shipping_cost_basis: TCostEntryBasis | '';
	notes: string;
	items: IDocumentoCompraLineFormValues[];
}

export const EMPTY_DOCUMENTO_LINE: IDocumentoCompraLineFormValues = {
	product_id: '',
	quantity: '1',
	unit_cost: '',
	unit_cost_basis: 'net',
	notes: '',
};

export const EMPTY_DOCUMENTO_VALUES: IPurchaseDocumentFormValues = {
	document_type: 'invoice',
	supplier_id: '',
	document_number: '',
	issue_date: '',
	total_amount: '',
	include_shipping: false,
	shipping_cost: '',
	shipping_cost_basis: 'net',
	notes: '',
	items: [{ ...EMPTY_DOCUMENTO_LINE }],
};

/** Monto y base de costo obligatorios en toda línea, factura o boleta. */
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

/** `supplier_id` es obligatorio sólo para factura; la boleta lo permite `null`. */
export const purchaseDocumentFormSchema = Yup.object({
	document_type: Yup.string().oneOf(['invoice', 'receipt']).required(),
	supplier_id: Yup.number()
		// `''` (sin seleccionar) castea a `NaN`: sin esto, la boleta sin proveedor
		// fallaría con el error de tipo de Yup.
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
	// Opcional, pero si se escribe tiene que ser un decimal: el envío convierte
	// en `null` lo que no lo es, y lo escrito se perdería en silencio.
	total_amount: Yup.string()
		.max(20, 'Monto demasiado largo.')
		.test('decimal-valido', 'Usa un monto con hasta dos decimales.', (value) => {
			if (!value || !value.trim()) return true;
			return parseDecimalString(normalizeCostInput(value)) !== null;
		}),
	include_shipping: Yup.boolean().required(),
	shipping_cost: Yup.string().when('include_shipping', {
		is: true,
		then: (schema) =>
			schema
				.required('Indica el costo de envío.')
				.test('decimal-envio-valido', 'Usa un monto con hasta dos decimales.', (value) => {
					if (!value) return false;
					const cents = parseDecimalString(normalizeCostInput(value));
					return cents !== null && cents > 0n;
				}),
		otherwise: (schema) => schema.optional(),
	}),
	shipping_cost_basis: Yup.string().when('include_shipping', {
		is: true,
		then: (schema) =>
			schema
				.oneOf(['net', 'gross'], 'Indica si el envío es neto o bruto.')
				.required('Indica si el envío es neto o bruto.'),
		otherwise: (schema) => schema.optional(),
	}),
	notes: Yup.string().max(1000, 'Máximo 1000 caracteres.'),
	items: Yup.array().of(lineSchema).min(1, 'Agrega al menos una línea.'),
});

/**
 * Mismas reglas que el alta de producto por filial (`StoreSubsidiaryProductRequest`):
 * nombre y marca obligatorios, categorías opcionales. El SKU no es un campo del
 * formulario: se genera a partir del nombre y la marca (ver `useProcurementProductForm`).
 */
export interface IProcurementProductFormValues {
	name: string;
	brand_id: string;
	/** Tipo de dispositivo del catálogo (`PRODUCT_TYPES`); también da el código de tipo del SKU. */
	product_type: string;
	serial_tracking: boolean;
	is_active: boolean;
	category_ids: string[];
}

export const EMPTY_PRODUCTO_COMPRA_VALUES: IProcurementProductFormValues = {
	name: '',
	brand_id: '',
	product_type: 'general',
	serial_tracking: false,
	is_active: true,
	category_ids: [],
};

export const procurementProductFormSchema = Yup.object({
	name: Yup.string()
		.trim()
		.required('Indica el nombre del producto.')
		.max(255, 'Máximo 255 caracteres.'),
	brand_id: Yup.string().required('Selecciona la marca del producto.'),
	product_type: Yup.string()
		.required('Selecciona el tipo de dispositivo.')
		.oneOf([...PRODUCT_TYPES], 'Selecciona un tipo de dispositivo válido.'),
	serial_tracking: Yup.boolean().required(),
	is_active: Yup.boolean().required(),
	category_ids: Yup.array().of(Yup.string().required()),
});
