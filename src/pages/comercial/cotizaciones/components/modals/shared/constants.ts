import * as Yup from 'yup';
import { quoteStatusOptions } from '../../../constants/quoteStatuses';
import { TSelectOptions } from '@/components/form/SelectReact';
import { FormQuoteItem } from './types';

export const IVA_RATE = 19;

export const EMPTY_PRODUCT_ITEM: FormQuoteItem = {
    id: 0,
    quote_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    created_at: '',
    updated_at: '',
    type: 'product',
};

export const EMPTY_CUSTOM_ITEM: FormQuoteItem = {
    id: 0,
    quote_id: 0,
    product_id: null,
    quantity: 1,
    unit_price: 0,
    customer_name: '',
    customer_sku: '',
    description: '',
    discount_amount: null,
    created_at: '',
    updated_at: '',
    type: 'custom',
};

export const itemSchema = Yup.object().shape({
    type: Yup.mixed<'product' | 'custom'>().oneOf(['product', 'custom']).required(),
    product_id: Yup.number()
        .nullable()
        .when('type', {
            is: 'product',
            then: (schema) =>
                schema
                    .required('Debe seleccionar un producto')
                    .min(1, 'Debe seleccionar un producto válido'),
            otherwise: (schema) => schema,
        }),
    customer_name: Yup.string().when('type', {
        is: 'custom',
        then: (schema) =>
            schema.required('Ingresa un nombre para el ítem').min(3, 'Mínimo 3 caracteres'),
        otherwise: (schema) => schema,
    }),
    customer_sku: Yup.string().nullable(),
    quantity: Yup.number()
        .required('La cantidad es requerida')
        .min(1, 'La cantidad debe ser mayor a 0'),
    unit_price: Yup.number()
        .transform((value, originalValue) => {
            return originalValue === '' || originalValue === null ? null : value;
        })
        .nullable()
        .when('type', {
            is: 'custom',
            then: (schema) =>
                schema
                    .typeError('Ingresa un precio neto válido')
                    .min(0, 'El precio neto no puede ser negativo')
                    .notRequired(),
            otherwise: (schema) => schema,
        }),
    discount_amount: Yup.number().nullable().min(0, 'El descuento no puede ser negativo'),
});

export const quotationSchema = Yup.object().shape({
    customer_id: Yup.number()
        .required('ERROR: Debe seleccionar un cliente')
        .min(1, 'ERROR: Debe seleccionar un cliente válido')
        .typeError('ERROR: El cliente seleccionado no es válido'),
    quote_date: Yup.date()
        .required('ERROR: La fecha de cotización es obligatoria')
        .typeError('ERROR: Formato de fecha inválido'),
    expiry_date: Yup.date()
        .required('ERROR: La fecha de validez es obligatoria')
        .min(
            Yup.ref('quote_date'),
            'ERROR: La fecha de validez debe ser posterior a la fecha de cotización',
        )
        .typeError('ERROR: Formato de fecha inválido'),
    payment_method: Yup.string()
        .required('ERROR: Debe seleccionar un método de pago')
        .nullable()
        .test('not-empty', 'ERROR: El método de pago no puede estar vacío', (value) => {
            return value !== null && value !== undefined && value.trim().length > 0;
        }),
    document_type: Yup.string()
        .required('ERROR: Debe seleccionar un tipo de documento')
        .oneOf(['boleta', 'factura'], 'ERROR: Tipo de documento inválido'),
    purchase_order: Yup.string()
        .max(100, 'ERROR: La orden de compra no puede exceder 100 caracteres')
        .nullable(),
    payment_terms: Yup.number()
        .min(0, 'ERROR: Los términos de pago no pueden ser negativos')
        .max(365, 'ERROR: Los términos de pago no pueden exceder 365 días')
        .typeError('ERROR: Los términos de pago deben ser un número'),
    discount_percentage: Yup.number()
        .min(0, 'ERROR: El descuento no puede ser negativo')
        .max(100, 'ERROR: El descuento no puede ser mayor a 100%')
        .typeError('ERROR: El descuento debe ser un número'),
    tax_percentage: Yup.number()
        .oneOf([0, 19], 'ERROR: Seleccione si desea aplicar IVA (19% o 0%)')
        .default(19)
        .typeError('ERROR: Valor de IVA inválido'),
    notes: Yup.string()
        .max(500, 'ERROR: Las notas no pueden exceder 500 caracteres')
        .nullable(),
    items: Yup.array()
        .of(itemSchema)
        .min(1, 'ERROR: Debe agregar al menos un producto o item')
        .test('items-valid', 'ERROR: Todos los items deben tener precio y cantidad válidos', (items) => {
            if (!items || items.length === 0) return false;
            return items.every((item: any) => {
                const hasValidQuantity = item.quantity && item.quantity > 0;
                const hasValidProduct = item.type === 'product' ? item.product_id > 0 : true;
                const hasValidName = item.type === 'custom' ? item.customer_name?.trim().length > 0 : true;
                return hasValidQuantity && hasValidProduct && hasValidName;
            });
        }),
    subtotal: Yup.number()
        .min(0, 'ERROR: El subtotal no puede ser negativo')
        .typeError('ERROR: Subtotal inválido'),
    total_amount: Yup.number()
        .min(1, 'ERROR: El total debe ser mayor a 0')
        .typeError('ERROR: Total inválido'),
});

export const paymentMethodOptions: TSelectOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
    { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'credito', label: 'Crédito 30 días' },
];

export const paymentTermsOptions: TSelectOptions = [
    { value: '0', label: 'Inmediato' },
    { value: '15', label: '15 días' },
    { value: '30', label: '30 días' },
    { value: '45', label: '45 días' },
    { value: '60', label: '60 días' },
];

export const statusOptions: TSelectOptions = quoteStatusOptions.map((option: { value: string; label: string }) => ({
    value: option.value,
    label: option.label,
}));
