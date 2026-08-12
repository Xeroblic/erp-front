import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICustomerSaleOverview } from '@/interface/customerSales.interface';
// eslint-disable-next-line import/extensions
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import useClientesVentas from '../useClientesVentas';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 1 }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const customer: ICustomerSaleOverview = {
	id: 11,
	name: 'Comercial Andina Ltda.',
	rut: '76.123.456-7',
	contact: null,
	loyalty: 40,
	total_sales: 1000,
	is_active: true,
};

const listResponse = (page: number) => ({
	data: {
		data: [customer],
		current_page: page,
		from: page === 2 ? 11 : 1,
		last_page: 2,
		per_page: 10,
		to: 11,
		total: 11,
	},
});

describe('useClientesVentas', () => {
	beforeEach(() => {
		apiSpies.fetchData.mockReset();
		apiSpies.fetchData.mockImplementation((config: { params?: { page?: number } }) =>
			Promise.resolve(listResponse(config.params?.page ?? 1)),
		);
	});

	it('retrocede y recarga la página anterior tras borrar la única fila de la última página', async () => {
		const store = configureStore({ reducer: { customerSales: customerSalesReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const { result } = renderHook(() => useClientesVentas(), { wrapper: Wrapper });

		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledOnce());
		act(() => result.current.actions.setPage(2));
		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(result.current.data.meta?.current_page).toBe(2));

		act(() => {
			const refresh = result.current.actions.refreshAfterDeletion();
			refresh?.catch(() => undefined);
		});

		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledTimes(3));
		expect(apiSpies.fetchData.mock.calls[2]?.[0]).toMatchObject({
			params: expect.objectContaining({ page: 1, per_page: 10 }),
		});
	});

	it('mantiene estables los grupos de la API cuando no cambia su estado', async () => {
		const store = configureStore({ reducer: { customerSales: customerSalesReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const { result, rerender } = renderHook(() => useClientesVentas(), { wrapper: Wrapper });

		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledOnce());
		const previous = result.current;
		rerender();

		expect(result.current.data).toBe(previous.data);
		expect(result.current.state).toBe(previous.state);
		expect(result.current.filters).toBe(previous.filters);
		expect(result.current.actions).toBe(previous.actions);
	});
});
