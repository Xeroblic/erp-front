import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
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
			values: { is_active: true, type: detailState.current?.type },
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
vi.mock('../../components/parts/EditableSelect', () => ({
	default: ({
		formik,
		name,
		displayValueFormatter,
	}: {
		formik: { values: Record<string, unknown> };
		name: string;
		displayValueFormatter?: (value: unknown) => string;
	}) =>
		name === 'type' && displayValueFormatter ? (
			<span>{displayValueFormatter(formik.values[name])}</span>
		) : null,
}));

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

	it.each([undefined, 'legacy'])('muestra el fallback neutral para el tipo %s', (type) => {
		detailState.current = { ...customerWithoutIdentity, type } as unknown as ICustomerSale;

		render(
			<Provider store={store}>
				<ClientesVentasDetalleView />
			</Provider>,
		);

		expect(screen.getByText('Sin información')).toBeInTheDocument();
		expect(screen.queryByText('Sin información registrada.')).not.toBeInTheDocument();
		expect(screen.queryByText('legacy')).not.toBeInTheDocument();
	});
});
