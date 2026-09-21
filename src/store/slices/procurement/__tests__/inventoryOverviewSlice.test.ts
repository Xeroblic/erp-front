import { describe, expect, it } from 'vitest';
import reducer, {
	fetchInventorySummary,
	inventoryBranchQueryKey,
	type InventoryOverviewState,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import type { IInventoryStockSummaryResponse } from '@/interface/inventoryOverview.interface';

const request = { branchId: 4, ownerContext: 'owner' };
const summary = (products: number): IInventoryStockSummaryResponse => ({
	data: {
		products_count: products,
		physical_quantity: 0,
		unfit_quantity: 0,
		undocumented_quantity: 0,
		unlocated_quantity: 0,
		critical_count: 0,
		out_count: 0,
		unconfigured_count: 0,
	},
	context: { scope: 'branch', branch_id: 4, warehouse: null },
});

const initial = reducer(undefined, { type: '@@init' });
const pending = (state: InventoryOverviewState, requestId: string) =>
	reducer(state, fetchInventorySummary.pending(requestId, request));

describe('inventoryOverviewSlice', () => {
	it('guarda la clave de quien pidió y sólo acepta la última petición', () => {
		let state = pending(initial, 'old');
		state = pending(state, 'new');
		expect(state.summary.ownerContext).toBe(inventoryBranchQueryKey(request));

		state = reducer(state, fetchInventorySummary.fulfilled(summary(1), 'old', request));
		expect(state.summary.response).toBeNull();
		expect(state.summary.loading).toBe(true);

		state = reducer(state, fetchInventorySummary.fulfilled(summary(2), 'new', request));
		expect(state.summary.response?.data.products_count).toBe(2);
		expect(state.summary.loading).toBe(false);
	});

	it('un abort no se muestra como error; un rechazo sí', () => {
		const aborted = reducer(
			pending(initial, 'r1'),
			// RTK marca `meta.aborted` cuando el error se llama `AbortError`.
			fetchInventorySummary.rejected(
				Object.assign(new Error('cancelada'), { name: 'AbortError' }),
				'r1',
				request,
			),
		);
		expect(aborted.summary.error).toBeNull();

		const failed = reducer(
			pending(initial, 'r2'),
			fetchInventorySummary.rejected(null, 'r2', request, 'Sin conexión'),
		);
		expect(failed.summary.error).toBe('Sin conexión');
	});
});
