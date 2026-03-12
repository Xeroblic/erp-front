import { validateRut } from '@/utils/validateRut';
import * as Yup from 'yup';

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

export const ClientesVentasDetalleSchema = Yup.object({
	document_number: Yup.string()
		.required('RUT requerido')
		.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
	billing_company: Yup.string().required('Nombre o empresa requerido'),
	email: Yup.string().email('Email inválido').required('Email requerido'),
});
