import { describe, expect, it } from 'vitest';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import { getCustomerDetailPageTitle, hasMatchingShippingAddress } from '../utils';

const customerWithAddresses = (overrides: Partial<ICustomerSale> = {}): ICustomerSale =>
	({
		id: 1,
		subsidiary_id: 1,
		name: 'Cliente de prueba',
		document_type: 'rut',
		document_number: '11.111.111-1',
		type: 'company',
		rut: '11.111.111-1',
		email: 'cliente@example.com',
		is_active: true,
		created_at: '2026-08-07T00:00:00Z',
		updated_at: '2026-08-07T00:00:00Z',
		billing_address_1: 'Av. Principal 123',
		billing_address_2: 'Oficina 4',
		billing_city: 'Santiago',
		commune_id: 10,
		billing_state_code: 'RM',
		billing_postcode: '8320000',
		billing_country_code: 'CL',
		shipping_address_1: 'Av. Principal 123',
		shipping_address_2: 'Oficina 4',
		shipping_city: 'Santiago',
		shipping_commune_id: 10,
		shipping_state_code: 'RM',
		shipping_postcode: '8320000',
		shipping_country_code: 'CL',
		...overrides,
	}) as ICustomerSale;

describe('hasMatchingShippingAddress', () => {
	it('reconoce direcciones idénticas en todos sus campos', () => {
		expect(hasMatchingShippingAddress(customerWithAddresses())).toBe(true);
	});

	it('no colapsa despacho cuando sólo cambia el código postal', () => {
		expect(
			hasMatchingShippingAddress(customerWithAddresses({ shipping_postcode: '8330000' })),
		).toBe(false);
	});
});

describe('getCustomerDetailPageTitle', () => {
	it('prioriza la empresa visible para el título de la pestaña', () => {
		expect(
			getCustomerDetailPageTitle(
				customerWithAddresses({ billing_company: ' Empresa de prueba ' }),
				'Contacto de prueba',
			),
		).toBe('Empresa de prueba');
	});

	it('usa el fallback seguro cuando no hay identidad disponible', () => {
		expect(
			getCustomerDetailPageTitle(
				customerWithAddresses({ billing_company: ' ', name: ' ' }),
				' ',
			),
		).toBe('Detalle de cliente');
	});
});
