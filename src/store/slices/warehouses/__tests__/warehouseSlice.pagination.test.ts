import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import type { IWarehouse } from '@/interface/warehouse.interface';
import warehouseReducer, { fetchWarehouses } from '../warehouseSlice';

const fetchData = vi.hoisted(() => vi.fn());

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const warehouse = (id: number): IWarehouse => ({
	id,
	name: `Bodega ${id}`,
	code: `B-${id}`,
	branch_id: 1,
	warehouse_type: 'Secundaria',
	maximum_capacity: null,
	is_active: true,
	requires_serial_tracking: false,
});

const page = (ids: number[], current: number, last: number) => ({
	data: {
		data: ids.map(warehouse),
		meta: { total: 3, current_page: current, per_page: 2, last_page: last },
	},
});

describe('warehouseSlice · listado completo de bodegas', () => {
	it('con allPages trae todas las páginas y sólo envía los parámetros que el backend lee', async () => {
		fetchData.mockReset();
		fetchData.mockResolvedValueOnce(page([1, 2], 1, 2)).mockResolvedValueOnce(page([3], 2, 2));
		const store = configureStore({ reducer: { warehouse: warehouseReducer } });

		const result = await store
			.dispatch(fetchWarehouses({ branchId: 1, params: { per_page: 2 }, allPages: true }))
			.unwrap();

		expect(result.items.map((item) => item.id)).toEqual([1, 2, 3]);
		expect(fetchData).toHaveBeenCalledTimes(2);
		const requestedParams = fetchData.mock.calls.map(
			(call) => (call[0] as { params: Record<string, unknown> }).params,
		);
		requestedParams.forEach((params) => {
			expect(Object.keys(params).sort()).toEqual(['page', 'per_page', 'q']);
		});
	});
});
