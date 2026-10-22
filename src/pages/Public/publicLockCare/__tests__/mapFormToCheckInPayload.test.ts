import { describe, expect, it } from 'vitest';
import { TicketFormValues } from '@/pages/Public/formLockCleare/components/FormLockCare.types';
import { mapFormToCheckInPayload } from '../types';

const baseValues: TicketFormValues = {
	name: 'Ana Pérez',
	email: 'ana@correo.cl',
	phone: '+56911112222',
	termsAccepted: true,
	requiresInvoice: 'no',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: 'reparacion',
	repairBrand: 'Lenovo',
	repairModel: 'ThinkPad T14',
	repairSerialNumber: 'SN-123',
	repairIncludesCharger: 'si',
	upgradeType: '',
	upgradeBrand: '',
	upgradeModel: '',
	upgradeSerialNumber: '',
	notes: '',
	message: 'No enciende',
	attachments: [],
};

describe('mapFormToCheckInPayload', () => {
	it('arma el payload de una reparación sin factura con los datos del equipo', () => {
		expect(mapFormToCheckInPayload(baseValues, 'qr-abc')).toEqual({
			qr_token: 'qr-abc',
			customer_name: 'Ana Pérez',
			customer_email: 'ana@correo.cl',
			customer_phone: '+56911112222',
			device_description: 'No enciende',
			is_invoice: false,
			invoice_rut: undefined,
			invoice_company_name: undefined,
			invoice_company_address: undefined,
			serial_number: 'SN-123',
			service_type: 'reparacion',
			upgrade_type: undefined,
			device_brand: 'Lenovo',
			device_model: 'ThinkPad T14',
		});
	});

	it('envía los datos de factura sólo cuando el cliente la pide', () => {
		const payload = mapFormToCheckInPayload(
			{
				...baseValues,
				requiresInvoice: 'si',
				invoiceRut: '76.123.456-7',
				invoiceBusinessName: 'Servicios SpA',
				invoiceAddress: 'Av. Siempre Viva 742',
			},
			'qr-abc',
		);

		expect(payload).toMatchObject({
			is_invoice: true,
			invoice_rut: '76.123.456-7',
			invoice_company_name: 'Servicios SpA',
			invoice_company_address: 'Av. Siempre Viva 742',
		});
	});

	it('no filtra datos de factura que quedaron escritos si el cliente cambió a «no»', () => {
		const payload = mapFormToCheckInPayload(
			{ ...baseValues, requiresInvoice: 'no', invoiceRut: '76.123.456-7' },
			'qr-abc',
		);

		expect(payload.invoice_rut).toBeUndefined();
	});

	it('en una mejora toma marca, modelo y serie de los campos de mejora', () => {
		const payload = mapFormToCheckInPayload(
			{
				...baseValues,
				serviceType: 'upgrade',
				upgradeType: 'ram',
				upgradeBrand: 'HP',
				upgradeModel: 'EliteBook 840',
				upgradeSerialNumber: 'UP-9',
			},
			'qr-abc',
		);

		expect(payload).toMatchObject({
			service_type: 'upgrade',
			upgrade_type: 'ram',
			device_brand: 'HP',
			device_model: 'EliteBook 840',
			serial_number: 'UP-9',
		});
	});

	it('una reparación no envía el tipo de mejora que quedó elegido antes', () => {
		const payload = mapFormToCheckInPayload(
			{ ...baseValues, serviceType: 'reparacion', upgradeType: 'ssd' },
			'qr-abc',
		);

		expect(payload.upgrade_type).toBeUndefined();
	});

	it('omite la serie vacía', () => {
		const payload = mapFormToCheckInPayload(
			{ ...baseValues, repairSerialNumber: '' },
			'qr-abc',
		);

		expect(payload.serial_number).toBeUndefined();
	});
});
