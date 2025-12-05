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
        .nullable()
        .when('type', {
            is: 'custom',
            then: (schema) =>
                schema
                    .typeError('Ingresa un precio neto válido')
                    .moreThan(0, 'El precio neto debe ser mayor a 0'),
            otherwise: (schema) => schema,
        }),
    discount_amount: Yup.number().nullable().min(0, 'El descuento no puede ser negativo'),
});

export const quotationSchema = Yup.object().shape({
    customer_id: Yup.number()
        .required('Debe seleccionar un cliente')
        .min(1, 'Debe seleccionar un cliente válido'),
    quote_date: Yup.date().required('La fecha de cotización es requerida'),
    expiry_date: Yup.date()
        .required('La fecha de validez es requerida')
        .min(
            Yup.ref('quote_date'),
            'La fecha de validez debe ser posterior a la fecha de cotización',
        ),
    payment_method: Yup.string().required('Debe seleccionar un método de pago'),
    purchase_order: Yup.string().max(100, 'La orden de compra no puede exceder 100 caracteres'),
    payment_terms: Yup.number()
        .min(0, 'Los términos de pago no pueden ser negativos')
        .max(365, 'Los términos de pago no pueden exceder 365 días'),
    discount_percentage: Yup.number()
        .min(0, 'El descuento no puede ser negativo')
        .max(100, 'El descuento no puede ser mayor a 100%'),
    tax_percentage: Yup.number()
        .oneOf([0, 19], 'Seleccione si desea aplicar IVA (19%)')
        .default(19),
    notes: Yup.string().max(500, 'Las notas no pueden exceder 500 caracteres'),
    items: Yup.array().of(itemSchema).min(1, 'Debe agregar al menos un ítem'),
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
