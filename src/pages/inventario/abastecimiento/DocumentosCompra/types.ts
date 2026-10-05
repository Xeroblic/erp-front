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

/**
 * El contrato usa 15 por defecto, pero el paginador estándar sólo ofrece 5,
 * 10, 20, 30, 40 y 50: con 15 el selector mostraba «Mostrar 5» mientras la
 * tabla listaba 15. Se pide 20, una de sus opciones.
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

export const DEFAULT_DOCUMENTOS_COMPRA_FILTERS: IDocumentosCompraFilters = {
	search: '',
	documentType: 'all',
	status: 'all',
	receptionStatus: 'all',
	supplierId: null,
	issuedFrom: '',
	issuedTo: '',
	page: 1,
	perPage: DOCUMENTOS_COMPRA_PER_PAGE_DEFAULT,
};

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
export const purchaseDocumentFormSchema = Yup.object({
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
	// Informativo y opcional (sección 6), pero si se escribe algo tiene que ser
	// un decimal real: sin esta prueba, un texto no numérico se serializaba
	// como `null` en silencio (`toOptionalDecimal` en `usePurchaseDocumentForm`)
	// y el usuario nunca se enteraba de que lo que escribió no se guardó.
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

/* =================================================
   Alta en línea de producto
   ================================================= */

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
