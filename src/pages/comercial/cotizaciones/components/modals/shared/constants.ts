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
    // customer_id: required, integer, exists in customer_sale table
    customer_id: Yup.number()
        .required('Debe seleccionar un cliente')
        .integer('El ID del cliente debe ser un numero entero')
        .min(1, 'Debe seleccionar un cliente valido')
        .typeError('El cliente seleccionado no es valido'),

    // quote_number: nullable, string, max 255, unique per subsidiary
    quote_number: Yup.string()
        .nullable()
        .max(255, 'El numero de cotizacion no puede exceder 255 caracteres'),

    // status: must be one of the allowed values
    status: Yup.string()
        .oneOf(['draft', 'sent', 'approved', 'converted', 'rejected', 'expired'], 'Estado invalido')
        .nullable(),

    // salesperson_id: nullable, integer
    salesperson_id: Yup.number()
        .nullable()
        .integer('El ID del vendedor debe ser un numero entero')
        .typeError('ID de vendedor invalido'),

    // payment_method: must be one of the allowed values
    payment_method: Yup.string()
        .required('Debe seleccionar un metodo de pago')
        .oneOf(
            ['efectivo', 'tarjeta', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'credito'],
            'Metodo de pago invalido'
        )
        .test('not-empty', 'El metodo de pago no puede estar vacio', (value) => {
            return value !== null && value !== undefined && value.trim().length > 0;
        }),

    // document_type: must be boleta or factura
    document_type: Yup.string()
        .required('Debe seleccionar un tipo de documento')
        .oneOf(['boleta', 'factura'], 'Tipo de documento invalido'),

    // quote_date: required, date
    quote_date: Yup.date()
        .required('La fecha de cotizacion es obligatoria')
        .typeError('Formato de fecha invalido'),

    // expiry_date: required, date, should be after quote_date
    expiry_date: Yup.date()
        .required('La fecha de validez es obligatoria')
        .min(
            Yup.ref('quote_date'),
            'La fecha de validez debe ser posterior a la fecha de cotizacion',
        )
        .typeError('Formato de fecha invalido'),

    // subtotal: nullable, numeric
    subtotal: Yup.number()
        .nullable()
        .min(0, 'El subtotal no puede ser negativo')
        .typeError('Subtotal invalido'),

    // tax_amount: nullable, numeric
    tax_amount: Yup.number()
        .nullable()
        .min(0, 'El monto del impuesto no puede ser negativo')
        .typeError('Monto de impuesto invalido'),

    // discount_amount: nullable, numeric
    discount_amount: Yup.number()
        .nullable()
        .min(0, 'El descuento no puede ser negativo')
        .typeError('Monto de descuento invalido'),

    // total_amount: nullable, numeric, should be > 0
    total_amount: Yup.number()
        .nullable()
        .min(1, 'El total debe ser mayor a 0')
        .typeError('Total invalido'),

    // tax_rate: nullable, numeric
    tax_rate: Yup.number()
        .nullable()
        .min(0, 'La tasa de impuesto no puede ser negativa')
        .max(100, 'La tasa de impuesto no puede ser mayor a 100%')
        .typeError('Tasa de impuesto invalida'),

    // discount_rate: nullable, numeric
    discount_rate: Yup.number()
        .nullable()
        .min(0, 'La tasa de descuento no puede ser negativa')
        .max(100, 'La tasa de descuento no puede ser mayor a 100%')
        .typeError('Tasa de descuento invalida'),

    // purchase_order: nullable, string, max 20
    purchase_order: Yup.string()
        .nullable()
        .max(20, 'La orden de compra no puede exceder 20 caracteres'),

    // terms_conditions: nullable, array
    terms_conditions: Yup.array()
        .nullable()
        .of(Yup.mixed()),

    // notes: nullable, string
    notes: Yup.string()
        .nullable()
        .max(1000, 'Las notas no pueden exceder 1000 caracteres'),

    // internal_notes: nullable, string
    internal_notes: Yup.string()
        .nullable()
        .max(1000, 'Las notas internas no pueden exceder 1000 caracteres'),

    // items: required, array, min 1 item
    items: Yup.array()
        .of(itemSchema)
        .min(1, 'Debe agregar al menos un producto o item')
        .required('Debe agregar items a la cotizacion')
        .test('items-valid', 'Todos los items deben tener precio y cantidad validos', (items) => {
            if (!items || items.length === 0) return false;
            return items.every((item: any) => {
                const hasValidQuantity = item.quantity && item.quantity > 0;
                const hasValidProduct = item.type === 'product' ? item.product_id > 0 : true;
                const hasValidName = item.type === 'custom' ? item.customer_name?.trim().length > 0 : true;
                return hasValidQuantity && hasValidProduct && hasValidName;
            });
        }),
});

export const paymentMethodOptions: TSelectOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
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
