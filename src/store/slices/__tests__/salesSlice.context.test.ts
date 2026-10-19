import { describe, expect, it } from 'vitest';
import type { PaginatedResponse } from '@/services/salesService';
import type { ISale } from '@/interface/sales.interface';
import type { RootState } from '@/store/rootReducer';
import salesReducer, {
	clearDetail,
	loadSalesList,
	loadSaleDetail,
	loadSaleItems,
	selectSaleDetail,
	selectSaleItems,
	selectSalesLoading,
} from '../salesSlice';

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

describe('propiedad del detalle y los ítems de venta', () => {
	const a = { subsidiaryId: 1, saleId: 90 };
	const saleA = response(90).data[0];
	it.each([
		{ subsidiaryId: 1, saleId: 91 },
		{ subsidiaryId: 2, saleId: 90 },
	])('oculta A desde el render de $subsidiaryId/$saleId y conserva el pending de B', (b) => {
		let state = salesReducer(undefined, loadSaleDetail.pending('detailA', a));
		state = salesReducer(state, loadSaleItems.pending('itemsA', a));
		state = salesReducer(state, loadSaleDetail.fulfilled(saleA, 'detailA', a));
		const root = { salesModule: state } as unknown as RootState;
		expect(selectSaleDetail(root, b)).toBeNull();
		expect(selectSaleItems(root, b)).toEqual([]);
		expect(selectSalesLoading(root, b)).toBe(true);
		state = salesReducer(state, loadSaleDetail.pending('detailB', b));
		state = salesReducer(state, loadSaleItems.pending('itemsB', b));
		state = salesReducer(state, loadSaleItems.fulfilled([], 'itemsB', b));
		expect(selectSalesLoading({ salesModule: state } as unknown as RootState, b)).toBe(true);
		state = salesReducer(state, loadSaleDetail.fulfilled(saleA, 'detailA', a));
		state = salesReducer(state, loadSaleItems.rejected(new Error('A'), 'itemsA', a, 'A'));
		expect(state).toMatchObject({ detail: null, detailLoading: true, itemsError: null });
		state = salesReducer(state, loadSaleDetail.rejected(new Error('B'), 'detailB', b, 'B'));
		expect(state).toMatchObject({ detail: null, detailLoading: false, detailError: 'B' });
		state = salesReducer(state, loadSaleDetail.rejected(new Error('A'), 'detailA', a, 'A'));
		expect(state.detailError).toBe('B');
	});
	it('descarta respuestas de la misma venta tras una recarga nueva y tras cerrar', () => {
		let state = salesReducer(undefined, loadSaleDetail.pending('old', a));
		state = salesReducer(state, loadSaleDetail.pending('new', a));
		state = salesReducer(state, loadSaleDetail.fulfilled(saleA, 'old', a));
		expect(state.detail).toBeNull();
		expect(state.detailLoading).toBe(true);
		state = salesReducer(state, clearDetail());
		state = salesReducer(state, loadSaleDetail.fulfilled(saleA, 'new', a));
		expect(state.detail).toBeNull();
		expect(state.detailOwner).toBeNull();
	});
});
