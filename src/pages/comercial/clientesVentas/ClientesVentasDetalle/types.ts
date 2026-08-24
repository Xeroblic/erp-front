import * as Yup from 'yup';
import type { CustomerSaleType } from '@/interface/customerSales.interface';
import { validateRut } from '@/utils/validateRut';

export interface IClientesVentasDetalleForm {
	type: CustomerSaleType | '';
	document_number: string;
	billing_company: string;
	contact_name: string;
	email: string;
	trade_activity: string;
	phone: string;
	is_active: boolean;
	preferred_payment_method: string;
	default_document_type: string;
	billing_address_1: string;
	billing_city: string;
	billing_postcode: string;
	shipping_address_1: string;
	shipping_city: string;
	notes: string;
}

export interface CreditProfileFormValues {
	is_active: boolean;
	payment_term_days: string;
	credit_limit: string;
	collection_email: string;
	notes: string;
}

export const createClientesVentasDetalleSchema = (requiresType: boolean) => {
	const typeSchema = Yup.string()
		.transform((value: unknown) => (value === null ? '' : value))
		.oneOf(['', 'natural', 'company'], 'Selecciona un tipo de cliente válido');

	return Yup.object({
		type: requiresType ? typeSchema.required('Selecciona el tipo de cliente') : typeSchema,
		document_number: Yup.string()
			.required('RUT requerido')
			.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
		billing_company: Yup.string().required('Nombre o empresa requerido'),
		email: Yup.string().email('Email inválido').required('Email requerido'),
	});
};

export const CreditProfileSchema = Yup.object({
	is_active: Yup.boolean().required(),
	payment_term_days: Yup.string()
		.trim()
		.required('Ingresa el plazo de pago')
		.test(
			'payment-term-days',
			'El plazo debe ser un número entero entre 1 y 32767 días',
			(value) => {
				if (!value) return false;
				const days = Number(value);
				return /^\d+$/.test(value) && Number.isInteger(days) && days >= 1 && days <= 32767;
			},
		),
	credit_limit: Yup.string()
		.trim()
		.test(
			'credit-limit',
			'El cupo de crédito debe contener solo números enteros de hasta 13 dígitos',
			(value) => !value || /^\d{1,13}$/.test(value),
		),
	collection_email: Yup.string()
		.trim()
		.email('Ingresa un correo de cobranza válido')
		.max(255, 'El correo de cobranza debe tener como máximo 255 caracteres'),
	notes: Yup.string().trim(),
});
