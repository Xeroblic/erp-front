import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IWarehouse } from '@/interface/warehouse.interface';
// eslint-disable-next-line import/extensions
import warehouseReducer from '@/store/slices/warehouses/warehouseSlice';
import { useBodegas } from '../hooks/useBodegas';

const branchContext = vi.hoisted(() => ({ branchId: 1 as number | null }));
const fetchData = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: branchContext.branchId,
		subsidiaryId: 1,
		hasValidBranch: branchContext.branchId !== null,
		visibleBranches: [],
	}),
}));
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const warehouse: IWarehouse = {
	id: 7,
	name: 'Bodega Norte',
	code: 'BN-7',
	branch_id: 1,
	warehouse_type: 'Secundaria',
	maximum_capacity: null,
	is_active: true,
	requires_serial_tracking: false,
};

describe('useBodegas con cambio de sucursal', () => {
	beforeEach(() => {
		branchContext.branchId = 1;
		fetchData.mockResolvedValue({
			data: {
				data: [warehouse],
				meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			},
		} as never);
	});

	it('cierra edición y descarta la bodega seleccionada antes de cargar la nueva sucursal', async () => {
		const store = configureStore({ reducer: { warehouse: warehouseReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(() => useBodegas(), { wrapper: Wrapper });

		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));
		act(() => hook.result.current.actions.handleEdit(warehouse));
		expect(hook.result.current.state.editModalOpen).toBe(true);
		expect(hook.result.current.state.selectedWarehouse?.id).toBe(7);

		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});

		expect(hook.result.current.state.editModalOpen).toBe(false);
		expect(hook.result.current.state.deleteModalOpen).toBe(false);
		expect(hook.result.current.state.selectedWarehouse).toBeNull();
		await waitFor(() => expect(hook.result.current.state.loading).toBe(false));
	});

	it('cierra la creación en el primer render al cambiar de sucursal', async () => {
		const store = configureStore({ reducer: { warehouse: warehouseReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(() => useBodegas(), { wrapper: Wrapper });

		await waitFor(() => expect(hook.result.current.state.loading).toBe(false));
		act(() => hook.result.current.actions.openCreateModal());
		expect(hook.result.current.state.createModalOpen).toBe(true);

		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});

		expect(hook.result.current.state.createModalOpen).toBe(false);
		await waitFor(() => {
			expect(store.getState().warehouse.listBranchId).toBe(2);
			expect(hook.result.current.state.loading).toBe(false);
		});
	});
});

describe('useBodegas filtros y resumen', () => {
	const central: IWarehouse = {
		...warehouse,
		id: 1,
		name: 'Bodega Central',
		code: 'BOD-001',
		warehouse_type: 'Principal',
		current_capacity: 12,
	};
	const sala: IWarehouse = {
		...warehouse,
		id: 2,
		name: 'Sala de ventas',
		code: 'SALA-1',
		warehouse_type: 'Sala de ventas',
		current_capacity: 3,
		is_active: false,
	};

	beforeEach(() => {
		branchContext.branchId = 1;
		fetchData.mockResolvedValue({
			data: {
				data: [central, sala],
				meta: { total: 2, current_page: 1, per_page: 15, last_page: 1 },
			},
		} as never);
	});

	it('filtra por búsqueda, tipo y estado sin alterar el resumen de la sucursal', async () => {
		const store = configureStore({ reducer: { warehouse: warehouseReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(() => useBodegas(), { wrapper: Wrapper });

		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(2));
		const expectedSummary = { total: 2, actives: 1, units: 15, nearCapacity: 0 };
		expect(hook.result.current.state.summary).toEqual(expectedSummary);
		expect(hook.result.current.state.typeOptions).toEqual(['Principal', 'Sala de ventas']);

		act(() => hook.result.current.actions.setStatusFilter('inactive'));
		expect(hook.result.current.state.warehouses.map((w) => w.id)).toEqual([2]);

		act(() => hook.result.current.actions.setTypeFilter('Principal'));
		expect(hook.result.current.state.warehouses).toEqual([]);
		expect(hook.result.current.state.hasFilters).toBe(true);
		expect(hook.result.current.state.summary).toEqual(expectedSummary);

		act(() => hook.result.current.actions.clearFilters());
		act(() => hook.result.current.actions.setGlobalFilter('sala-1'));
		expect(hook.result.current.state.warehouses.map((w) => w.id)).toEqual([2]);

		act(() => hook.result.current.actions.clearFilters());
		expect(hook.result.current.state.hasFilters).toBe(false);
		expect(hook.result.current.state.warehouses).toHaveLength(2);
	});
});
