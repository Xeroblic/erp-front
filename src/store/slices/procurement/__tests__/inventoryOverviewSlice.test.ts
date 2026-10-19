import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import reducer, {
	fetchInventoryOperationDetail,
	fetchInventoryOperations,
	fetchInventorySummary,
	INVENTORY_OPERATION_FORBIDDEN_MESSAGE,
	inventoryBranchQueryKey,
	inventoryOperationDetailQueryKey,
	inventoryOperationsQueryKey,
	type InventoryOverviewState,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import type { IInventoryStockSummaryResponse } from '@/interface/inventoryOverview.interface';
import type { IInventoryOperationsResponse } from '@/interface/inventoryOperations.interface';

// El resumen de Inventario sigue sin backend; la trazabilidad no debe depender de eso.
vi.mock('@/config/inventoryStock.config', () => ({ default: false }));
const { getInventoryOperation, listInventoryOperations } = vi.hoisted(() => ({
	getInventoryOperation: vi.fn(),
	listInventoryOperations: vi.fn(),
}));
vi.mock('@/services/procurement/inventoryOperations.service', () => ({
	getInventoryOperation,
	listInventoryOperations,
}));

const request = { branchId: 4, ownerContext: 'owner' };
const summary = (products: number): IInventoryStockSummaryResponse => ({
	data: {
		products_count: products,
		unlocated_products_count: null,
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

describe('inventoryOverviewSlice · Trazabilidad (§14)', () => {
	const operationsRequest = {
		branchId: 4,
		ownerContext: 'owner',
		subsidiaryId: 2,
		branchName: 'Casa Matriz',
		params: { branch_id: 4, page: 1, per_page: 20 },
	};
	const detailRequest = (operationId: string) => ({
		...operationsRequest,
		operationId,
		params: { branch_id: 4, product_id: 31 },
	});
	const operations = (total: number): IInventoryOperationsResponse => ({
		data: [],
		meta: {
			current_page: 1,
			from: null,
			last_page: 1,
			links: [],
			path: '/api/subsidiaries/2/inventory-operations',
			per_page: 20,
			to: null,
			total,
		},
		links: { first: null, last: null, prev: null, next: null },
		context: { pending_movements_count: 0 },
	});

	it('sólo la última petición resuelve la lista y cada lista nueva pliega los detalles', () => {
		let state = reducer(
			initial,
			fetchInventoryOperationDetail.pending('d1', detailRequest('op-1')),
		);
		state = reducer(state, fetchInventoryOperations.pending('old', operationsRequest));
		expect(state.operationDetails).toEqual({});

		state = reducer(state, fetchInventoryOperations.pending('new', operationsRequest));
		state = reducer(
			state,
			fetchInventoryOperations.fulfilled(operations(1), 'old', operationsRequest),
		);
		expect(state.operations.response).toBeNull();

		state = reducer(
			state,
			fetchInventoryOperations.fulfilled(operations(2), 'new', operationsRequest),
		);
		expect(state.operations.ownerContext).toBe(inventoryOperationsQueryKey(operationsRequest));
		expect(state.operations.response?.meta.total).toBe(2);
	});

	it('cada detalle guarda su clave y descarta una respuesta vieja', () => {
		const opRequest = detailRequest('op-1');
		let state = reducer(initial, fetchInventoryOperationDetail.pending('old', opRequest));
		state = reducer(state, fetchInventoryOperationDetail.pending('new', opRequest));
		state = reducer(
			state,
			fetchInventoryOperationDetail.rejected(null, 'old', opRequest, {
				message: 'Vieja',
				forbidden: false,
			}),
		);

		expect(state.operationDetails['op-1']).toMatchObject({
			ownerContext: inventoryOperationDetailQueryKey(opRequest),
			loading: true,
			error: null,
		});

		state = reducer(
			state,
			fetchInventoryOperationDetail.rejected(null, 'new', opRequest, {
				message: 'Sin conexión',
				forbidden: false,
			}),
		);
		expect(state.operationDetails['op-1']).toMatchObject({
			loading: false,
			error: 'Sin conexión',
		});
	});

	it('un 403 del detalle cierra su vista; uno tardío no pisa la petición vigente', () => {
		const opRequest = detailRequest('op-1');
		const forbidden = { message: INVENTORY_OPERATION_FORBIDDEN_MESSAGE, forbidden: true };
		let state = reducer(initial, fetchInventoryOperationDetail.pending('old', opRequest));
		state = reducer(state, fetchInventoryOperationDetail.pending('new', opRequest));
		state = reducer(
			state,
			fetchInventoryOperationDetail.rejected(null, 'old', opRequest, forbidden),
		);
		expect(state.operationDetails['op-1']).toMatchObject({ loading: true, error: null });

		state = reducer(
			state,
			fetchInventoryOperationDetail.rejected(null, 'new', opRequest, forbidden),
		);
		expect(state.operationDetails).not.toHaveProperty('op-1');
	});

	it('pide la trazabilidad aunque el resumen de Inventario no tenga backend', async () => {
		listInventoryOperations.mockResolvedValue(operations(3));
		const store = configureStore({ reducer: { inventoryOverview: reducer } });

		const action = await store.dispatch(fetchInventoryOperations(operationsRequest));

		expect(fetchInventoryOperations.fulfilled.match(action)).toBe(true);
		expect(listInventoryOperations).toHaveBeenCalledWith(2, operationsRequest.params, {
			signal: expect.any(AbortSignal),
			branchName: 'Casa Matriz',
		});
		expect(store.getState().inventoryOverview.operations.response?.meta.total).toBe(3);
	});

	it('el 403 del detalle llega como «sin acceso», no como error inesperado', async () => {
		getInventoryOperation.mockRejectedValue(
			Object.assign(new Error('Forbidden'), {
				isAxiosError: true,
				response: { status: 403, data: { message: 'This action is unauthorized.' } },
			}),
		);
		const store = configureStore({ reducer: { inventoryOverview: reducer } });

		const action = await store.dispatch(fetchInventoryOperationDetail(detailRequest('op-1')));

		expect(action.payload).toEqual({
			message: INVENTORY_OPERATION_FORBIDDEN_MESSAGE,
			forbidden: true,
		});
		expect(store.getState().inventoryOverview.operationDetails).toEqual({});
	});

	it('otro rechazo del detalle queda como error reintentable', async () => {
		getInventoryOperation.mockRejectedValue(
			Object.assign(new Error('Server Error'), {
				isAxiosError: true,
				response: { status: 500, data: { message: 'Error del servidor.' } },
			}),
		);
		const store = configureStore({ reducer: { inventoryOverview: reducer } });

		await store.dispatch(fetchInventoryOperationDetail(detailRequest('op-1')));

		expect(store.getState().inventoryOverview.operationDetails['op-1']).toMatchObject({
			loading: false,
			error: 'Error del servidor.',
		});
	});

	it('la clave del detalle cambia con los filtros que marcan los ítems', () => {
		const withProduct = inventoryOperationDetailQueryKey(detailRequest('op-1'));
		const withoutProduct = inventoryOperationDetailQueryKey({
			...detailRequest('op-1'),
			params: { branch_id: 4 },
		});

		expect(withProduct).not.toBe(withoutProduct);
	});
});
