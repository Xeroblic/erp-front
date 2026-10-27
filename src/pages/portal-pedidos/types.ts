import * as Yup from 'yup';
import type { TSelectOption } from '@/components/form/SelectReact';
import { validateRut } from '@/utils/validateRut';

export interface IPedidoFormValues {
	rutCliente: string;
	nombreCliente: string;
	canalCompra: string;
	cotizacion: FileList | null;
	link: string;
}

export const PEDIDO_INITIAL_VALUES: IPedidoFormValues = {
	rutCliente: '',
	nombreCliente: '',
	canalCompra: '',
	cotizacion: null,
	link: '',
};

export const PEDIDO_CHANNELS: TSelectOption[] = [
	{ value: 'WhatsApp', label: 'WhatsApp' },
	{ value: 'Correo', label: 'Correo Electrónico' },
	{ value: 'Presencial', label: 'Presencial' },
];

export const PEDIDO_ATTACHMENT_ERROR = 'Debe adjuntar una Cotización o ingresar un Link válido';

export const PedidoSchema = Yup.object({
	rutCliente: Yup.string()
		.required('El RUT del cliente es obligatorio')
		.test('is-valid-rut', 'RUT no válido', (value) => validateRut(value ?? '')),
	nombreCliente: Yup.string().required('El nombre del cliente es obligatorio'),
	canalCompra: Yup.string().required('Debe seleccionar un canal de compra'),
	cotizacion: Yup.mixed<FileList>().nullable(),
	link: Yup.string(),
}).test('at-least-one-file-or-link', PEDIDO_ATTACHMENT_ERROR, function hasCotizacionOrLink(value) {
	const hasCotizacion = (value.cotizacion?.length ?? 0) > 0;
	const hasLink = (value.link ?? '').trim().length > 0;

	if (hasCotizacion || hasLink) return true;

	return this.createError({ path: 'link', message: PEDIDO_ATTACHMENT_ERROR });
});
