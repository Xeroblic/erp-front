import * as Yup from 'yup';
import type { DeferredPaymentDocumentType } from '@/interface/deferredPayments.interface';

export const DEFERRED_PAYMENT_DOCUMENT_TYPES: readonly DeferredPaymentDocumentType[] = [
	'electronic_invoice',
	'invoice',
	'receipt',
	'other',
];

let deferredPaymentItemSequence = 0;

export interface DeferredPaymentFormItemValues {
	client_key: string;
	product_id: null;
	code: string;
	description: string;
	quantity: number;
	unit_price: number;
	serials: string[];
}

export interface DeferredPaymentFormValues {
	customer_sale_id: number | null;
	document_type: DeferredPaymentDocumentType;
	document_number: string;
	issue_date: string;
	due_date: string;
	purchase_order: string | null;
	notes: string | null;
	assignee_ids: number[];
	items: DeferredPaymentFormItemValues[];
}

const dateOnlySchema = (requiredMessage: string) =>
	Yup.string()
		.matches(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha válida')
		.required(requiredMessage);

export const DeferredPaymentItemSchema = Yup.object({
	product_id: Yup.number().nullable().oneOf([null]).defined(),
	code: Yup.string()
		.trim()
		.max(50, 'El código no puede superar los 50 caracteres')
		.required('Ingresa el código del ítem'),
	description: Yup.string()
		.trim()
		.max(255, 'La descripción no puede superar los 255 caracteres')
		.required('Ingresa la descripción del ítem'),
	quantity: Yup.number()
		.typeError('La cantidad debe ser un número')
		.integer('La cantidad debe ser un número entero')
		.moreThan(0, 'La cantidad debe ser mayor a 0')
		.required('Ingresa la cantidad'),
	unit_price: Yup.number()
		.typeError('El precio unitario debe ser un número')
		.min(0, 'El precio unitario no puede ser negativo')
		.required('Ingresa el precio unitario'),
	serials: Yup.array()
		.of(Yup.string().trim().required('Los seriales no pueden estar vacíos'))
		.defined(),
});

export const DeferredPaymentDocumentSchema = Yup.object({
	customer_sale_id: Yup.number()
		.nullable()
		.typeError('Selecciona un cliente')
		.integer('Selecciona un cliente válido')
		.positive('Selecciona un cliente válido')
		.required('Selecciona un cliente'),
	document_type: Yup.mixed<DeferredPaymentDocumentType>()
		.oneOf(DEFERRED_PAYMENT_DOCUMENT_TYPES, 'Selecciona un tipo de documento válido')
		.required('Selecciona el tipo de documento'),
	document_number: Yup.string()
		.trim()
		.max(50, 'El número de documento no puede superar los 50 caracteres')
		.required('Ingresa el número de documento'),
	issue_date: dateOnlySchema('Selecciona la fecha de emisión'),
	due_date: dateOnlySchema('Selecciona la fecha de vencimiento').test(
		'due-date-after-issue-date',
		'La fecha de vencimiento no puede ser anterior a la fecha de emisión',
		function validateDueDate(value) {
			const { parent }: { parent: unknown } = this;
			const parentRecord =
				parent && typeof parent === 'object' ? (parent as Record<string, unknown>) : {};
			const { issue_date: issueDate } = parentRecord;
			return typeof issueDate !== 'string' || !value || value >= issueDate;
		},
	),
	purchase_order: Yup.string()
		.trim()
		.max(100, 'La orden de compra no puede superar los 100 caracteres')
		.nullable()
		.defined(),
	notes: Yup.string()
		.trim()
		.max(1000, 'Las notas no pueden superar los 1000 caracteres')
		.nullable()
		.defined(),
	assignee_ids: Yup.array()
		.of(
			Yup.number()
				.integer('Selecciona un encargado válido')
				.positive('Selecciona un encargado válido')
				.required('Selecciona un encargado válido'),
		)
		.defined(),
	items: Yup.array()
		.of(DeferredPaymentItemSchema)
		.min(1, 'Agrega al menos un ítem al documento')
		.test(
			'positive-document-total',
			'El total del documento debe ser mayor a 0',
			(items) =>
				!items ||
				items.reduce((total, item) => total + item.quantity * item.unit_price, 0) > 0,
		)
		.required('Agrega al menos un ítem al documento'),
});

const createDeferredPaymentItemKey = (): string => {
	deferredPaymentItemSequence += 1;
	return `deferred-item-${deferredPaymentItemSequence}`;
};

export const createEmptyDeferredPaymentItem = (): DeferredPaymentFormItemValues => ({
	client_key: createDeferredPaymentItemKey(),
	product_id: null,
	code: '',
	description: '',
	quantity: 1,
	unit_price: 0,
	serials: [],
});

export const createDeferredPaymentInitialValues = (
	issueDate: string,
): DeferredPaymentFormValues => ({
	customer_sale_id: null,
	document_type: 'electronic_invoice',
	document_number: '',
	issue_date: issueDate,
	due_date: issueDate,
	purchase_order: null,
	notes: null,
	assignee_ids: [],
	items: [createEmptyDeferredPaymentItem()],
});

export const calculateDeferredPaymentEstimatedTotal = (
	items: readonly DeferredPaymentFormItemValues[],
): number => items.reduce((total, item) => total + item.quantity * item.unit_price, 0);
