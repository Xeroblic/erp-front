import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import ClientesVentasDetalleView from '../ClientesVentasDetalleView';

const detailState = vi.hoisted(() => ({
	current: undefined as ICustomerSale | undefined,
}));

vi.mock('gsap', () => ({
	gsap: {
		context: (callback: () => void) => {
			callback();
			return { revert: vi.fn() };
		},
		from: vi.fn(),
		to: vi.fn(),
	},
}));

vi.mock('../hooks/useClientesVentasDetalle', () => ({
	useClientesVentasDetalle: () => ({
		formik: {
			values: { is_active: true },
			isSubmitting: false,
			submitForm: vi.fn().mockResolvedValue(undefined),
			setFieldValue: vi.fn(),
			resetForm: vi.fn(),
		},
		detalle: detailState.current,
		loading: false,
		isEditable: false,
		setIsEditable: vi.fn(),
		handleCancelEdit: vi.fn(),
		handleBack: vi.fn(),
		contacto: { name: '', email: '', phone: '' },
	}),
}));

vi.mock('../components/CustomerCreditProfileCard', () => ({ default: () => null }));
vi.mock('../../components/parts/ClientDetailHeader', () => ({ default: () => null }));
vi.mock('../../components/parts/DetailSection', () => ({
	default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));
vi.mock('../../components/parts/EditableField', () => ({ default: () => null }));
vi.mock('../../components/parts/EditableSelect', () => ({ default: () => null }));

const customerWithoutIdentity: ICustomerSale = {
	id: 1,
	subsidiary_id: 1,
	name: ' ',
	document_type: 'rut',
	document_number: '11.111.111-1',
	type: 'company',
	rut: '11.111.111-1',
	email: 'cliente@example.com',
	is_active: true,
	created_at: '2026-08-07T00:00:00Z',
	updated_at: '2026-08-07T00:00:00Z',
	billing_company: ' ',
};

describe('ClientesVentasDetalleView', () => {
	beforeEach(() => {
		detailState.current = undefined;
		document.title = '';
	});

	it('reemplaza Error por el fallback seguro cuando el detalle no tiene identidad', () => {
		document.title = 'Error | ERP';

		const view = render(
			<Provider store={store}>
				<ClientesVentasDetalleView />
			</Provider>,
		);

		expect(document.title).toBe('Detalle de cliente | ERP');

		detailState.current = customerWithoutIdentity;
		view.rerender(
			<Provider store={store}>
				<ClientesVentasDetalleView />
			</Provider>,
		);

		expect(document.title).toBe('Detalle de cliente | ERP');
		expect(document.title).not.toContain('Error |');
	});
});
