import React, { PropsWithChildren, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, {
	INVENTORY_OPERATION_FORBIDDEN_MESSAGE,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import useInventoryTraceability from '@/pages/inventario/Inventario/hooks/useInventoryTraceability';
import type { IInventoryOperationsResponse } from '@/interface/inventoryOperations.interface';

vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
const { getInventoryOperation, listInventoryOperations } = vi.hoisted(() => ({
	getInventoryOperation: vi.fn(),
	listInventoryOperations: vi.fn(),
}));
vi.mock('@/services/procurement/inventoryOperations.service', () => ({
	getInventoryOperation,
	listInventoryOperations,
}));
const { warning } = vi.hoisted(() => ({ warning: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: { warning } }));

const OPERATION_ID = '0d3b6f7a-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

const list: IInventoryOperationsResponse = {
	data: [
		{
			id: OPERATION_ID,
			operation_type: 'sale_fulfillment',
			title: 'Salida por venta',
			occurred_at: '2026-09-25T10:00:30-03:00',
			branch: { id: 4, name: 'Centro' },
			actor: null,
			reason: null,
			source: { type: 'sale', id: 57 },
			reverses_operation_id: null,
			summary: { products_count: 1, units_affected: 5, physical_effect: true },
		},
	],
	links: { first: null, last: null, prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/2/inventory-operations',
		per_page: 15,
		to: 1,
		total: 1,
	},
	context: { pending_movements_count: 0 },
};

const axiosError = (status: number, message: string) =>
	Object.assign(new Error(message), {
		isAxiosError: true,
		response: { status, data: { message } },
	});

const PARAMS = { branch_id: 4, page: 1, per_page: 15 };

const renderTraceability = () => {
	const store = configureStore({ reducer: { inventoryOverview: reducer } });
	const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
		<Provider store={store}>{children}</Provider>
	);
	return renderHook(
		() =>
			useInventoryTraceability({
				subsidiaryId: 2,
				branchId: 4,
				branchName: 'Centro',
				owner: 'prueba',
				params: PARAMS,
			}),
		{ wrapper: Wrapper },
	);
};

afterEach(() => {
	getInventoryOperation.mockReset();
	listInventoryOperations.mockReset();
	warning.mockReset();
});

describe('useInventoryTraceability · detalle', () => {
	it('un 403 (el alcance cambió tras la lista) pliega la operación y avisa sin acceso', async () => {
		listInventoryOperations.mockResolvedValue(list);
		getInventoryOperation.mockRejectedValue(axiosError(403, 'This action is unauthorized.'));
		const { result } = renderTraceability();
		await waitFor(() => expect(result.current.response).toEqual(list));

		act(() => result.current.toggle(OPERATION_ID));
		expect(result.current.expanded).toEqual([OPERATION_ID]);

		await waitFor(() => expect(result.current.expanded).toEqual([]));
		expect(warning).toHaveBeenCalledWith(INVENTORY_OPERATION_FORBIDDEN_MESSAGE);
		expect(result.current.detailOf(OPERATION_ID).error).toBeNull();
	});

	it('otro error deja la operación abierta con su mensaje para reintentar', async () => {
		listInventoryOperations.mockResolvedValue(list);
		getInventoryOperation.mockRejectedValue(axiosError(500, 'Error del servidor.'));
		const { result } = renderTraceability();
		await waitFor(() => expect(result.current.response).toEqual(list));

		act(() => result.current.toggle(OPERATION_ID));

		await waitFor(() =>
			expect(result.current.detailOf(OPERATION_ID).error).toBe('Error del servidor.'),
		);
		expect(result.current.expanded).toEqual([OPERATION_ID]);
		expect(warning).not.toHaveBeenCalled();
	});
});
