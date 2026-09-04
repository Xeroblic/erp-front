import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer, {
	type CustomerSalesState,
} from '@/store/slices/customerSales/customerSalesSlice';
import CustomerSaleSelect from '../CustomerSaleSelect';

const apiSpies = vi.hoisted(() => ({
	fetchData: vi.fn(),
	fetchNormalized: vi.fn(),
	invalidateCache: vi.fn(),
}));
const authorizationSpies = vi.hoisted(() => ({ authorize: vi.fn(() => true) }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('@/pages/comercial/clientesVentas/components/modals/CreateCustomerSaleModal', () => ({
	default: ({ isOpen, isEdit = false }: { isOpen: boolean; isEdit?: boolean }) =>
		isOpen ? (
			<div role='dialog' aria-label={isEdit ? 'Editar Cliente' : 'Crear Cliente'} />
		) : null,
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: authorizationSpies.authorize,
		hasAnyPermission: () => true,
		isSuperAdmin: false,
	}),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const emptyPagination = {
	data: [],
	current_page: 1,
	from: null,
	last_page: 1,
	per_page: 100,
	to: null,
	total: 0,
	first_page_url: null,
	last_page_url: null,
	prev_page_url: null,
	next_page_url: null,
};

const CUSTOMER = {
	id: 77,
	name: 'Comercial Zeta',
	rut: '76.777.000-1',
	contact: { name: 'Ana Pérez' },
	loyalty: 0,
	total_sales: 0,
	is_active: true,
};
const CUSTOMER_LABEL = 'Comercial Zeta · Ana Pérez · 76.777.000-1';

const createTestStore = (customerSalesState?: Partial<CustomerSalesState>) =>
	configureStore({
		reducer: { customerSales: customerSalesReducer },
		preloadedState: {
			customerSales: {
				...customerSalesReducer(undefined, { type: 'test/init' }),
				...customerSalesState,
			},
		},
	});

const renderSelect = (
	props: Partial<React.ComponentProps<typeof CustomerSaleSelect>> = {},
	store = createTestStore(),
) => {
	const onChange = props.onChange ?? vi.fn();
	const view = render(
		<Provider store={store}>
			<CustomerSaleSelect
				subsidiaryId={1}
				value={null}
				inputId='customer_sale_id'
				{...props}
				onChange={onChange}
			/>
			{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
			<label htmlFor='customer_sale_id'>Cliente</label>
		</Provider>,
	);
	return { ...view, onChange, store };
};

describe('CustomerSaleSelect', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		apiSpies.fetchData.mockReset();
		apiSpies.fetchNormalized.mockReset();
		authorizationSpies.authorize.mockReset();
		authorizationSpies.authorize.mockReturnValue(true);
		apiSpies.fetchData.mockResolvedValue({ data: emptyPagination });
	});

	it('busca en el backend con el término escrito y ofrece los resultados remotos', async () => {
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [CUSTOMER], total: 1 }
					: { data: [] },
			}),
		);
		renderSelect();

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Zeta' } });

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/1/customer-sales/overview',
					params: expect.objectContaining({ q: 'Zeta', per_page: 100 }),
				}),
			),
		);
		expect(await screen.findByText(CUSTOMER_LABEL)).toBeInTheDocument();
	});

	it('entrega el cliente elegido y lo conserva al limpiar la búsqueda', async () => {
		apiSpies.fetchData.mockResolvedValue({
			data: { ...emptyPagination, data: [CUSTOMER], total: 1 },
		});
		const onChange = vi.fn();
		const { rerender, store } = renderSelect({ onChange });

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Zeta' } });
		fireEvent.click(await screen.findByText(CUSTOMER_LABEL));

		expect(onChange).toHaveBeenCalledWith({
			id: CUSTOMER.id,
			label: CUSTOMER_LABEL,
			isActive: true,
		});

		const callsAfterSelection = apiSpies.fetchData.mock.calls.length;
		rerender(
			<Provider store={store}>
				<CustomerSaleSelect
					subsidiaryId={1}
					value={CUSTOMER.id}
					inputId='customer_sale_id'
					onChange={onChange}
				/>
				{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
				<label htmlFor='customer_sale_id'>Cliente</label>
			</Provider>,
		);
		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '' } });

		expect(await screen.findByText(CUSTOMER_LABEL)).toBeInTheDocument();
		expect(apiSpies.fetchData.mock.calls.length).toBe(callsAfterSelection);
	});

	it('no ofrece el overview cacheado de otra subsidiaria', async () => {
		const store = createTestStore({
			overview: [CUSTOMER],
			overviewSubsidiaryId: 9,
		});
		renderSelect({ subsidiaryId: 1 }, store);

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Zeta' } });

		expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
		expect(screen.queryByText(CUSTOMER_LABEL)).not.toBeInTheDocument();
	});

	it('no consulta al backend mientras el anfitrión está inactivo', async () => {
		renderSelect({ isActive: false });

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Zeta' } });

		await waitFor(() => expect(apiSpies.fetchData).not.toHaveBeenCalled());
	});

	it('oculta crear y editar cliente sin los permisos correspondientes', () => {
		authorizationSpies.authorize.mockReturnValue(false);
		renderSelect({ value: CUSTOMER.id });

		expect(screen.queryByRole('button', { name: 'Crear cliente' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Editar cliente' })).not.toBeInTheDocument();
	});

	it('ofrece editar sólo cuando hay un cliente elegido y abre el modal con su detalle', async () => {
		const { rerender, store, onChange } = renderSelect();
		expect(screen.queryByRole('button', { name: 'Editar cliente' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument();

		apiSpies.fetchNormalized.mockResolvedValue({ ...CUSTOMER, is_active: true });
		rerender(
			<Provider store={store}>
				<CustomerSaleSelect
					subsidiaryId={1}
					value={CUSTOMER.id}
					inputId='customer_sale_id'
					onChange={onChange}
				/>
				{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
				<label htmlFor='customer_sale_id'>Cliente</label>
			</Provider>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Editar cliente' }));

		await waitFor(() =>
			expect(apiSpies.fetchNormalized).toHaveBeenCalledWith(
				expect.objectContaining({ url: `/subsidiaries/1/customer-sales/${CUSTOMER.id}` }),
			),
		);
		expect(await screen.findByRole('dialog', { name: 'Editar Cliente' })).toBeInTheDocument();
	});
});
