import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsScenarioFixtures';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usersAdminReducer from '@/store/slices/usersAdmin/usersAdminSlice';
import CreateEditDeferredPaymentModal from '../components/modals/CreateEditDeferredPaymentModal';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn(), invalidateCache: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 1, hasValidBranch: true }),
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

describe('Integración de CreateEditDeferredPaymentModal', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		apiSpies.fetchData.mockReset();
		apiSpies.invalidateCache.mockReset();
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? emptyPagination
					: {
							data: [],
							meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
						},
			}),
		);
	});

	it('busca clientes remotamente y conserva las opciones del documento editado', async () => {
		const store = configureStore({
			reducer: {
				customerSales: customerSalesReducer,
				deferredPayments: deferredPaymentsReducer,
				usersAdmin: usersAdminReducer,
			},
			preloadedState: {
				deferredPayments: {
					...deferredPaymentsReducer(undefined, { type: 'test/init' }),
					listSubsidiaryId: 1,
				},
			},
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const editedDocument = DEFERRED_PAYMENT_DETAIL_FIXTURES[1];
		render(
			<CreateEditDeferredPaymentModal
				isOpen
				deferredPaymentDocument={editedDocument}
				onClose={vi.fn()}
			/>,
			{ wrapper: Wrapper },
		);

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/1/customer-sales/overview',
					params: expect.objectContaining({ per_page: 100, q: undefined }),
				}),
			),
		);
		expect(
			screen.getByText(
				new RegExp(
					editedDocument.customer.billing_company ??
						editedDocument.customer.contact_name ??
						editedDocument.customer.rut,
				),
			),
		).toBeInTheDocument();
		expect(screen.getByText(new RegExp(editedDocument.assignees[0].name))).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Automarco' } });
		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/1/customer-sales/overview',
					params: expect.objectContaining({ q: 'Automarco', per_page: 100 }),
				}),
			),
		);
	});
	it('conserva el cliente elegido después de seleccionar y cerrar la búsqueda', async () => {
		const searchedCustomer = {
			id: 457,
			name: 'Zeta Corp',
			rut: '76.457.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(
			({ url, params }: { url: string; params?: { q?: string } }) =>
				Promise.resolve({
					data: url.includes('/overview')
						? {
								...emptyPagination,
								data: params?.q === 'Zeta' ? [searchedCustomer] : [],
								total: params?.q === 'Zeta' ? 1 : 0,
							}
						: {
								data: [],
								meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
							},
				}),
		);
		const store = configureStore({
			reducer: {
				customerSales: customerSalesReducer,
				deferredPayments: deferredPaymentsReducer,
				usersAdmin: usersAdminReducer,
			},
			preloadedState: {
				deferredPayments: {
					...deferredPaymentsReducer(undefined, { type: 'test/init' }),
					listSubsidiaryId: 1,
				},
			},
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, {
			wrapper: Wrapper,
		});

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'Zeta' } });
		const option = await screen.findByText('Zeta Corp · 76.457.000-1');
		fireEvent.click(option);
		fireEvent.blur(customerInput);

		await act(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 350);
			});
		});

		expect(screen.getByText('Zeta Corp · 76.457.000-1')).toBeInTheDocument();
		expect(store.getState().deferredPayments).toBeDefined();
		const overviewCalls = apiSpies.fetchData.mock.calls.filter(([request]) =>
			String((request as { url?: string }).url).includes('/overview'),
		);
		expect(overviewCalls).toHaveLength(2);
		expect(overviewCalls[1]?.[0]).toEqual(
			expect.objectContaining({ params: expect.objectContaining({ q: 'Zeta' }) }),
		);
	});
});
