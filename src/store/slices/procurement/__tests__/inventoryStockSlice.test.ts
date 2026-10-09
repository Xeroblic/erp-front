import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, {
	createWarehouseStockMovementThunk,
	fetchInventoryStock,
	fetchInventoryOrigins,
} from '@/store/slices/procurement/inventoryStockSlice';
import { inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import type { IInventoryStockResponse } from '@/interface/procurement.interface';
import * as service from '@/services/procurement/inventoryStock.service';

vi.mock('@/config/inventoryStock.config', () => ({ default: false }));
const request = { branchId: 4, ownerContext: 'session-A', params: {} };
const response: IInventoryStockResponse = {
	...inventoryStockEnvelope,
	context: { scope: 'unlocated', branch_id: 4, warehouse: null },
};
describe('inventoryStockSlice — identidad de consultas', () => {
	it('descarta fulfilled y rejected de una solicitud anterior y limpia datos al fallar la vigente', () => {
		let state = reducer(undefined, fetchInventoryStock.pending('A', request));
		state = reducer(state, fetchInventoryStock.fulfilled(response, 'A', request));
		state = reducer(state, fetchInventoryStock.pending('B', { ...request, branchId: 6 }));
		expect(state.list.response).toBeNull();
		state = reducer(state, fetchInventoryStock.fulfilled(response, 'A', request));
		state = reducer(
			state,
			fetchInventoryStock.rejected(new Error('Anterior'), 'A', request, 'Anterior'),
		);
		expect(state.list.loading).toBe(true);
		expect(state.list.error).toBeNull();
		state = reducer(
			state,
			fetchInventoryStock.rejected(
				new Error('Actual'),
				'B',
				{ ...request, branchId: 6 },
				'Actual',
			),
		);
		expect(state.list).toMatchObject({ response: null, loading: false, error: 'Actual' });
	});
	it('una cancelación de procedencias libera carga sin mostrar error', () => {
		const originRequest = { ...request, productId: 31 };
		let state = reducer(undefined, fetchInventoryOrigins.pending('A', originRequest));
		state = reducer(
			state,
			fetchInventoryOrigins.rejected(
				{ name: 'AbortError', message: 'Cancelado' },
				'A',
				originRequest,
			),
		);
		expect(state.origins).toMatchObject({ response: null, loading: false, error: null });
	});
	it('con el flag apagado las lecturas van a la API real; el traslado sigue bloqueado', async () => {
		const stock = vi.spyOn(service, 'listInventoryStock').mockResolvedValue(response);
		const origins = vi
			.spyOn(service, 'listInventoryOrigins')
			.mockRejectedValue(new Error('sin red'));
		const movement = vi.spyOn(service, 'createWarehouseStockMovement');
		const store = configureStore({ reducer });
		await store.dispatch(fetchInventoryStock(request));
		await store.dispatch(fetchInventoryOrigins({ ...request, productId: 31 }));
		await store.dispatch(
			createWarehouseStockMovementThunk({
				branchId: 4,
				payload: { from_warehouse_id: 8, to_warehouse_id: 15, reason: 'x', items: [] },
			}),
		);
		expect(stock).toHaveBeenCalledWith(4, {}, expect.any(AbortSignal));
		expect(origins).toHaveBeenCalledTimes(1);
		expect(movement).not.toHaveBeenCalled();
		expect(store.getState().list.response).toBe(response);
		expect(store.getState().origins.error).toBe('sin red');
		vi.restoreAllMocks();
	});
});
