import * as Yup from 'yup';
import { validateRut } from '@/utils/validateRut';

export interface IClientesVentasDetalleForm {
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
	notes: string;
}

export const ClientesVentasDetalleSchema = Yup.object({
	document_number: Yup.string()
		.required('RUT requerido')
		.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
	billing_company: Yup.string().required('Nombre o empresa requerido'),
	email: Yup.string().email('Email inválido').required('Email requerido'),
});

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
			'El cupo debe ser un monto no negativo de hasta 13 enteros y 2 decimales',
			(value) => !value || /^\d{1,13}(?:\.\d{1,2})?$/.test(value),
		),
	notes: Yup.string().trim(),
});
