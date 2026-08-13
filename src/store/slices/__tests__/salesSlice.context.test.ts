import { describe, expect, it } from 'vitest';
import type { PaginatedResponse } from '@/services/salesService';
import type { ISale } from '@/interface/sales.interface';
import salesReducer, { loadSalesList } from '../salesSlice';

const response = (id: number): PaginatedResponse<ISale> => ({
	data: [{ id, sale_number: `V-${id}`, status: 'pending', total_amount: '1000' } as ISale],
	meta: { current_page: 1, from: 1, last_page: 1, per_page: 15, to: 1, total: 1 },
	links: { first: null, last: null, prev: null, next: null },
});

describe('salesSlice contexto organizacional', () => {
	it('limpia la lista y descarta respuestas de la subsidiaria anterior', () => {
		const firstArg = { subsidiaryId: 1 };
		const secondArg = { subsidiaryId: 2 };
		let state = salesReducer(undefined, loadSalesList.pending('first', firstArg));
		state = salesReducer(state, loadSalesList.fulfilled(response(1), 'first', firstArg));
		state = salesReducer(state, loadSalesList.pending('second', secondArg));

		expect(state).toMatchObject({ list: [], listSubsidiaryId: 2, loading: true });

		state = salesReducer(state, loadSalesList.fulfilled(response(1), 'first', firstArg));
		expect(state.list).toEqual([]);
		expect(state.loading).toBe(true);

		state = salesReducer(
			state,
			loadSalesList.rejected(new Error('fallo A'), 'first', firstArg, 'fallo A'),
		);
		expect(state.error).toBeNull();
		expect(state.loading).toBe(true);
	});
});
