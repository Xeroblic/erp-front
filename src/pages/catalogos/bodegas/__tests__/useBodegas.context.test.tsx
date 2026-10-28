import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IWarehouse } from '@/interface/warehouse.interface';
// eslint-disable-next-line import/extensions
import warehouseReducer from '@/store/slices/warehouses/warehouseSlice';
import { useBodegas } from '../hooks/useBodegas';

const branchContext = vi.hoisted(() => ({ branchId: 1 }));
const fetchData = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
// Sólo concede los permisos listados, y todos si la consulta pide `requireAll`.
const granted = vi.hoisted(() => ({ permissions: new Set<string>() }));
const authorizeMock = vi.hoisted(() =>
	vi.fn(({ permission }: { permission?: string | string[] }) =>
		(Array.isArray(permission) ? permission : [permission]).every(
			(name) => typeof name === 'string' && granted.permissions.has(name),
		),
	),
);

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: branchContext.branchId,
		subsidiaryId: 1,
		hasValidBranch: branchContext.branchId !== null,
		visibleBranches: [],
	}),
}));
vi.mock('@/hooks/useAuthorization', () => ({ default: () => ({ authorize: authorizeMock }) }));
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: toastMock }));
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

const renderUseBodegas = () => {
	const store = configureStore({ reducer: { warehouse: warehouseReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return { store, hook: renderHook(() => useBodegas(), { wrapper: Wrapper }) };
};

const listResponse = (items: IWarehouse[], page = 1, lastPage = 1) => ({
	data: {
		data: items,
		meta: { total: items.length, current_page: page, per_page: 100, last_page: lastPage },
	},
});

interface IRequest {
	url: string;
	method: string;
	params?: { page?: number };
	data?: unknown;
}

const requestsWith = (method: string): IRequest[] =>
	fetchData.mock.calls
		.map((call) => call[0] as IRequest)
		.filter((request) => request.method === method);

const deferred = () => {
	let resolve: (value: unknown) => void = () => undefined;
	let reject: (reason: unknown) => void = () => undefined;
	const promise = new Promise((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
};

describe('useBodegas con cambio de sucursal', () => {
	beforeEach(() => {
		branchContext.branchId = 1;
		fetchData.mockResolvedValue({
			data: {
				data: [warehouse],
				meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
			},
		});
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
		});
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

describe('useBodegas listado completo', () => {
	beforeEach(() => {
		branchContext.branchId = 1;
		fetchData.mockReset();
	});

	it('carga todas las páginas para que filtros y resumen cubran todas las bodegas', async () => {
		const pageOne = Array.from({ length: 100 }, (_, index) => ({
			...warehouse,
			id: index + 1,
			code: `B-${index + 1}`,
		}));
		const lastOne: IWarehouse = {
			...warehouse,
			id: 101,
			name: 'Bodega Sur',
			code: 'SUR-101',
			warehouse_type: 'Tránsito',
			is_active: false,
		};
		fetchData.mockImplementation(({ params }: IRequest) =>
			Promise.resolve(
				params?.page === 2 ? listResponse([lastOne], 2, 2) : listResponse(pageOne, 1, 2),
			),
		);

		const { hook } = renderUseBodegas();

		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(101));
		expect(hook.result.current.state.summary).toMatchObject({ total: 101, actives: 100 });
		expect(hook.result.current.state.typeOptions).toEqual(['Secundaria', 'Tránsito']);

		act(() => hook.result.current.actions.setGlobalFilter('sur-101'));
		expect(hook.result.current.state.warehouses.map((w) => w.id)).toEqual([101]);
	});
});

describe('useBodegas mutaciones', () => {
	beforeEach(() => {
		branchContext.branchId = 1;
		fetchData.mockReset();
		toastMock.success.mockReset();
		toastMock.error.mockReset();
	});

	it('no avisa ni recarga cuando la edición termina después de cambiar de sucursal', async () => {
		const pendingUpdate = deferred();
		fetchData.mockImplementation(({ method }: IRequest) =>
			method === 'patch' ? pendingUpdate.promise : Promise.resolve(listResponse([warehouse])),
		);
		const { hook } = renderUseBodegas();
		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));

		act(() => hook.result.current.actions.handleEdit(warehouse));
		let submit: Promise<unknown> = Promise.resolve();
		act(() => {
			submit = hook.result.current.forms.edit.submitForm();
		});
		await waitFor(() => expect(requestsWith('patch')).toHaveLength(1));

		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});
		await act(async () => {
			pendingUpdate.resolve({ data: { data: warehouse } });
			await submit;
		});

		expect(toastMock.success).not.toHaveBeenCalled();
		const branchOneLoads = requestsWith('get').filter(
			(request) => request.url === '/branches/1/warehouses',
		);
		expect(branchOneLoads).toHaveLength(1);
	});

	it('no avisa el fallo de una baja que termina después de cambiar de sucursal', async () => {
		const pendingDelete = deferred();
		fetchData.mockImplementation(({ method }: IRequest) =>
			method === 'delete'
				? pendingDelete.promise
				: Promise.resolve(listResponse([warehouse])),
		);
		const { hook } = renderUseBodegas();
		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));

		act(() => hook.result.current.actions.handleDelete(warehouse));
		let confirm: Promise<boolean> = Promise.resolve(true);
		act(() => {
			confirm = hook.result.current.actions.confirmDelete();
		});

		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});
		let result = true;
		await act(async () => {
			pendingDelete.reject({ response: { data: { message: 'fallo en sucursal 1' } } });
			result = await confirm;
		});

		expect(result).toBe(false);
		expect(toastMock.error).not.toHaveBeenCalled();
	});

	it('mantiene visible el listado cuando la baja falla por tener productos', async () => {
		fetchData.mockImplementation(({ method }: IRequest) =>
			method === 'delete'
				? Promise.reject(
						Object.assign(new Error('Request failed with status code 422'), {
							response: {
								data: {
									message:
										'No se puede eliminar la bodega porque tiene productos.',
									error: 'WAREHOUSE_HAS_PRODUCTS',
								},
							},
						}),
					)
				: Promise.resolve(listResponse([warehouse])),
		);
		const { hook } = renderUseBodegas();
		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));

		act(() => hook.result.current.actions.handleDelete(warehouse));
		await act(async () => {
			await hook.result.current.actions.confirmDelete();
		});

		expect(toastMock.error).toHaveBeenCalledWith(
			'No se puede eliminar, tiene productos asociados',
		);
		expect(hook.result.current.state.deleteBlockedByStock).toBe(false);
		expect(hook.result.current.state.error).toBeNull();
		expect(hook.result.current.state.warehouses).toHaveLength(1);
	});

	describe('baja rechazada porque la bodega todavía tiene stock', () => {
		const rejectWithStock = () =>
			fetchData.mockImplementation(({ method }: IRequest) =>
				method === 'delete'
					? Promise.reject(
							Object.assign(new Error('Request failed with status code 422'), {
								response: {
									status: 422,
									data: {
										message:
											'No se puede eliminar la bodega porque todavía tiene stock.',
										error: 'WAREHOUSE_HAS_STOCK',
									},
								},
							}),
						)
					: Promise.resolve(listResponse([warehouse])),
			);

		const confirmDeleteOf = async (hook: ReturnType<typeof renderUseBodegas>['hook']) => {
			await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));
			act(() => hook.result.current.actions.handleDelete(warehouse));
			let result = true;
			await act(async () => {
				result = await hook.result.current.actions.confirmDelete();
			});
			return result;
		};

		beforeEach(() => {
			granted.permissions = new Set(['edit-product', 'view-product']);
			authorizeMock.mockClear();
		});

		it('deja el modal abierto con el aviso propio, sin toast ni recarga', async () => {
			rejectWithStock();
			const { hook } = renderUseBodegas();

			expect(await confirmDeleteOf(hook)).toBe(false);

			expect(hook.result.current.state.deleteModalOpen).toBe(true);
			expect(hook.result.current.state.deleteBlockedByStock).toBe(true);
			expect(toastMock.error).not.toHaveBeenCalled();
			expect(hook.result.current.state.warehouses).toHaveLength(1);
			expect(requestsWith('get')).toHaveLength(1);
		});

		it('enlaza a la pestaña de ajuste con la bodega cuando el usuario puede ajustar', async () => {
			rejectWithStock();
			const { hook } = renderUseBodegas();
			await confirmDeleteOf(hook);

			expect(hook.result.current.state.adjustStockLink).toBe(
				'/inventario/abastecimiento/ajustes-traslados?tab=ajuste&warehouse_id=7',
			);
			expect(authorizeMock).toHaveBeenCalledWith(
				expect.objectContaining({
					permission: ['edit-product', 'view-product'],
					requireAll: true,
					branchId: 1,
					scope: 'access',
				}),
			);
		});

		it('no enlaza sin edit-product', async () => {
			granted.permissions = new Set(['view-product']);
			rejectWithStock();
			const { hook } = renderUseBodegas();
			await confirmDeleteOf(hook);

			expect(hook.result.current.state.deleteBlockedByStock).toBe(true);
			expect(hook.result.current.state.adjustStockLink).toBeNull();
		});

		it('olvida el rechazo al volver a pedir la baja', async () => {
			rejectWithStock();
			const { hook } = renderUseBodegas();
			await confirmDeleteOf(hook);

			act(() => hook.result.current.actions.handleDelete(warehouse));

			expect(hook.result.current.state.deleteBlockedByStock).toBe(false);
			expect(hook.result.current.state.adjustStockLink).toBeNull();
		});
	});

	it('la edición envía null para borrar encargado, capacidad, comuna y textos opcionales', async () => {
		const stored: IWarehouse = {
			...warehouse,
			maximum_capacity: 500,
			manager_id: 3,
			commune_id: 9,
			address: 'Calle 1',
			schedule: 'L-V',
			description: 'Bodega norte',
		};
		fetchData.mockImplementation(({ method }: IRequest) =>
			Promise.resolve(
				method === 'patch' ? { data: { data: stored } } : listResponse([stored]),
			),
		);
		const { hook } = renderUseBodegas();
		await waitFor(() => expect(hook.result.current.state.warehouses).toHaveLength(1));

		act(() => hook.result.current.actions.handleEdit(stored));
		await act(async () => {
			await hook.result.current.forms.edit.setValues({
				...hook.result.current.forms.edit.values,
				maximum_capacity: null,
				manager_id: null,
				commune_id: null,
				address: '',
				schedule: '  ',
				description: '',
			});
		});
		await act(async () => {
			await hook.result.current.forms.edit.submitForm();
		});

		expect(requestsWith('patch')[0]?.data).toMatchObject({
			maximum_capacity: null,
			manager_id: null,
			commune_id: null,
			address: null,
			schedule: null,
			description: null,
		});
	});
});
