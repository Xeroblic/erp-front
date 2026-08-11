import { describe, expect, it, vi } from 'vitest';
import type { PaginatedResponse } from '@/services/salesService';
import type { ICustomerSaleOverview } from '@/interface/customerSales.interface';
import ApiService from '@/services/ApiService';
import customerSalesReducer, {
	fetchCustomersListOverviewThunk,
	fetchCustomersOverviewThunk,
} from '../customerSalesSlice';

const firstRequest = { subsidiary: 1, page: 1, per_page: 10, params: { q: 'andina' } };
const secondRequest = { subsidiary: 2, page: 1, per_page: 10 };
const response: PaginatedResponse<ICustomerSaleOverview> = {
	data: [
		{
			id: 4,
			name: 'Comercial Andina Ltda.',
			rut: '76.123.456-7',
			contact: null,
			loyalty: 40,
			total_sales: 1000,
			is_active: true,
		},
	],
	meta: { current_page: 1, from: 1, last_page: 1, per_page: 10, to: 1, total: 1 },
	links: { first: null, last: null, prev: null, next: null },
};

describe('customerSales overview', () => {
	it('descarta una respuesta tardía y conserva sólo la consulta vigente', () => {
		let state = customerSalesReducer(
			undefined,
			fetchCustomersOverviewThunk.pending('first', firstRequest),
		);
		state = customerSalesReducer(
			state,
			fetchCustomersOverviewThunk.pending('second', secondRequest),
		);

		state = customerSalesReducer(
			state,
			fetchCustomersOverviewThunk.fulfilled(response, 'first', firstRequest),
		);
		expect(state.overview).toEqual([]);
		expect(state.overviewLoading).toBe(true);

		state = customerSalesReducer(
			state,
			fetchCustomersOverviewThunk.fulfilled(response, 'second', secondRequest),
		);
		expect(state.overview).toEqual(response.data);
		expect(state.meta?.total).toBe(1);
		expect(state.overviewLoading).toBe(false);
	});

	it('keeps the page overview isolated from the shared overview consumer', () => {
		let state = customerSalesReducer(
			undefined,
			fetchCustomersOverviewThunk.pending('modal-request', firstRequest),
		);
		state = customerSalesReducer(
			state,
			fetchCustomersListOverviewThunk.pending('page-request', secondRequest),
		);

		state = customerSalesReducer(
			state,
			fetchCustomersOverviewThunk.fulfilled(response, 'modal-request', firstRequest),
		);
		expect(state.overview).toEqual(response.data);
		expect(state.listOverview).toEqual([]);
		expect(state.listOverviewLoading).toBe(true);

		state = customerSalesReducer(
			state,
			fetchCustomersListOverviewThunk.fulfilled(response, 'page-request', secondRequest),
		);
		expect(state.overview).toEqual(response.data);
		expect(state.listOverview).toEqual(response.data);
		expect(state.listMeta?.total).toBe(1);
	});

	it('passes the thunk abort signal to the list overview request', async () => {
		const fetchData = vi.spyOn(ApiService, 'fetchData').mockResolvedValue({
			data: {
				data: [],
			},
		} as never);
		const dispatch = vi.fn();

		await fetchCustomersListOverviewThunk(secondRequest)(dispatch, () => ({}), undefined);

		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		);
		fetchData.mockRestore();
	});
});
