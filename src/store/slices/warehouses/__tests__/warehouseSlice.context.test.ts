import { describe, expect, it, vi } from 'vitest';
import type { IWarehouse, IWarehouseStats } from '@/interface/warehouse.interface';
import warehouseReducer, { createWarehouse, fetchWarehouses } from '../warehouseSlice';

vi.mock('@/services/ApiService', () => ({ default: { fetchData: vi.fn() } }));

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

	it('ignora el éxito y el error tardíos de una creación de otra sucursal', () => {
		const firstArg = { branchId: 1 };
		const secondArg = { branchId: 2 };
		const createArg = {
			branchId: 1,
			data: { name: 'Bodega A', code: 'B-A', warehouse_type: 'Secundaria' },
		};
		const secondPayload = {
			items: [warehouse(2)],
			meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			stats: { ...emptyStats, total: 1, actives: 1, empty: 1 },
		};

		let state = warehouseReducer(undefined, fetchWarehouses.pending('list-a', firstArg));
		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(
				{ items: [warehouse(1)], meta: secondPayload.meta, stats: secondPayload.stats },
				'list-a',
				firstArg,
			),
		);
		state = warehouseReducer(state, createWarehouse.pending('create-a', createArg));
		state = warehouseReducer(state, fetchWarehouses.pending('list-b', secondArg));
		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(secondPayload, 'list-b', secondArg),
		);
		state = warehouseReducer(
			state,
			createWarehouse.fulfilled(warehouse(1), 'create-a', createArg),
		);

		expect(state.warehouses).toEqual([warehouse(2)]);
		expect(state.listBranchId).toBe(2);
		expect(state.error).toBeNull();

		state = warehouseReducer(state, createWarehouse.pending('create-a-error', createArg));
		state = warehouseReducer(
			state,
			createWarehouse.rejected(
				new Error('fallo A'),
				'create-a-error',
				createArg,
				{ message: 'fallo A' },
			),
		);

		expect(state.warehouses).toEqual([warehouse(2)]);
		expect(state.error).toBeNull();
	});

	it('descarta la respuesta antigua cuando se recarga la misma sucursal', () => {
		const branchArg = { branchId: 1 };
		const firstPayload = {
			items: [warehouse(1)],
			meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			stats: { ...emptyStats, total: 1, actives: 1, empty: 1 },
		};
		const secondPayload = {
			items: [warehouse(7)],
			meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			stats: { ...emptyStats, total: 1, actives: 1, empty: 1 },
		};

		let state = warehouseReducer(undefined, fetchWarehouses.pending('first', branchArg));
		state = warehouseReducer(state, fetchWarehouses.pending('second', branchArg));
		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(firstPayload, 'first', branchArg),
		);

		expect(state.loading).toBe(true);
		expect(state.warehouses).toEqual([]);

		state = warehouseReducer(
			state,
			fetchWarehouses.fulfilled(secondPayload, 'second', branchArg),
		);

		expect(state.loading).toBe(false);
		expect(state.warehouses).toEqual([warehouse(7)]);
	});
});
