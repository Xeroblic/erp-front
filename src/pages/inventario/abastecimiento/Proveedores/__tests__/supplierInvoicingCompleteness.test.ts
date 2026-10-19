import { describe, expect, it } from 'vitest';
import { getMissingInvoicingFields, isIncompleteForInvoicing } from '../types';
import type { ISupplierFormValues } from '../types';

/**
 * Aviso de completitud del proveedor: nombra exactamente lo que falta para
 * confirmar una factura. Antes decía «Falta giro y/o alguna dirección» aunque
 * sólo faltara una comuna.
 */

const complete: ISupplierFormValues = {
	rut: '77889911-6',
	company_name: 'Distribuidora Recorrido SpA',
	contact_name: '',
	business_activity: 'Venta de accesorios computacionales',
	billing_address: 'Av. Providencia 1500',
	billing_commune_id: 13,
	shipping_address: 'Los Industriales 220',
	shipping_commune_id: 14,
	phone: '',
	email: '',
};

describe('getMissingInvoicingFields', () => {
	it('con giro, direcciones y comunas no falta nada', () => {
		expect(getMissingInvoicingFields(complete)).toEqual([]);
		expect(isIncompleteForInvoicing(complete)).toBe(false);
	});

	it('nombra la comuna cuando es lo único que falta', () => {
		const values = { ...complete, shipping_commune_id: null };

		expect(getMissingInvoicingFields(values)).toEqual(['comuna de despacho']);
		expect(isIncompleteForInvoicing(values)).toBe(true);
	});

	it('lista lo que falta en el orden del formulario e ignora espacios', () => {
		const values = {
			...complete,
			business_activity: '   ',
			billing_commune_id: null,
			shipping_address: '',
		};

		expect(getMissingInvoicingFields(values)).toEqual([
			'giro',
			'comuna de facturación',
			'dirección de despacho',
		]);
	});
});
