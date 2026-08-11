import { describe, expect, it } from 'vitest';
import type { IWarehouse, IWarehouseStats } from '@/interface/warehouse.interface';
import warehouseReducer, { fetchWarehouses } from '../warehouseSlice';

const warehouse = (branchId: number): IWarehouse => ({
	id: branchId,
	name: `Bodega ${branchId}`,
	code: `B-${branchId}`,
	branch_id: branchId,
	warehouse_type: 'Secundaria',
	maximum_capacity: null,
	is_active: true,
	requires_serial_tracking: false,
});

const emptyStats: IWarehouseStats = {
	total: 0,
	actives: 0,
	inactives: 0,
	with_products: 0,
	empty: 0,
	near_capacity: 0,
};

describe('warehouseSlice contexto organizacional', () => {
	it('vacía datos de la sucursal anterior y descarta su respuesta tardía', () => {
		const firstArg = { branchId: 1 };
		const secondArg = { branchId: 2 };
		const firstPayload = {
			items: [warehouse(1)],
			meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			stats: { ...emptyStats, total: 1, actives: 1, empty: 1 },
		};
		let state = warehouseReducer(undefined, fetchWarehouses.pending('first', firstArg));
		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(firstPayload, 'first', firstArg),
		);
		state = warehouseReducer(state, fetchWarehouses.pending('second', secondArg));

		expect(state).toMatchObject({
			warehouses: [],
			stats: emptyStats,
			listBranchId: 2,
			loading: true,
		});

		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(firstPayload, 'first', firstArg),
		);

		expect(state.warehouses).toEqual([]);
		expect(state.listBranchId).toBe(2);
		expect(state.loading).toBe(true);

		state = warehouseReducer(
			state,
			fetchWarehouses.rejected(
				new Error('fallo A'),
				'first',
				firstArg,
				{ message: 'fallo A' },
			),
		);

		expect(state.error).toBeNull();
		expect(state.loading).toBe(true);
	});
});
