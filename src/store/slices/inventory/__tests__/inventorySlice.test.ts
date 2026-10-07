import { describe, expect, it, vi } from 'vitest';
import type { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import reducer, {
	clearListaMovimientoSucursal,
	fetchListaMovimientoSucursalThunk,
	type IInventoryState,
} from '../inventorySlice';

vi.mock('@/services/ApiService', () => ({ default: { fetchData: vi.fn() } }));

const makeMovement = (id: number, branchId: number): IInventoryMovement => ({
	id,
	product: { id, sku: `SKU-${id}`, name: `Producto ${id}` },
	branch: { id: branchId, name: `Sucursal ${branchId}` },
	warehouse: { id: 1, name: 'Bodega' },
	quantity_delta: 1,
	balance_before: 0,
	balance_after: 1,
	movement_type: 'entry',
	reason: 'Ingreso',
	source: { type: 'reception', id, line_id: 1 },
	performed_by: { id: 1, name: 'Operador', email: 'operador@example.com' },
	metadata: null,
	occurred_at: '2026-10-01T10:00:00-03:00',
	created_at: '2026-10-01T10:00:00-03:00',
});

const makeResponse = (movements: IInventoryMovement[], nextPage: string | null = null) => ({
	data: movements,
	links: { first: null, last: null, prev: null, next: nextPage },
	meta: {
		current_page: 1,
		from: 1,
		last_page: nextPage ? 2 : 1,
		path: '/branches/1/inventory-movements',
		per_page: 20,
		to: movements.length,
		total: movements.length,
	},
});

const branchOne = { branch_id: 1, page: 1, per_page: 20 };
const branchTwo = { branch_id: 2, page: 1, per_page: 20 };
const initial = (): IInventoryState => reducer(undefined, { type: '@@init' });

describe('inventorySlice · lista de movimientos por sucursal', () => {
	it('descarta la respuesta tardía de una consulta reemplazada por otra sucursal', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('old', branchOne));
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('new', branchTwo));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(20, 2)]),
				'new',
				branchTwo,
			),
		);

		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(10, 1)], '/page/2'),
				'old',
				branchOne,
			),
		);

		expect(state.listaMovimientoSucursal.map((m) => m.id)).toEqual([20]);
		expect(state.pagination.hasNextPage).toBe(false);
		expect(state.loading).toBe(false);
	});

	it('no agrega a la lista vigente una página «cargar más» de una consulta reemplazada', () => {
		const appendArg = { ...branchOne, page: 2, append: true };
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('append', appendArg));
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('fresh', branchTwo));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(20, 2)]),
				'fresh',
				branchTwo,
			),
		);

		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(11, 1)]),
				'append',
				appendArg,
			),
		);

		expect(state.listaMovimientoSucursal.map((m) => m.id)).toEqual([20]);
	});

	it('un error tardío de una consulta reemplazada no borra la lista ni marca error', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('old', branchOne));
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('new', branchTwo));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(20, 2)]),
				'new',
				branchTwo,
			),
		);

		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.rejected(
				null,
				'old',
				branchOne,
				'Error al cargar movimientos',
			),
		);

		expect(state.error).toBeUndefined();
		expect(state.listaMovimientoSucursal.map((m) => m.id)).toEqual([20]);
	});

	it('al cancelar la consulta vigente libera la carga sin marcar error ni vaciar la lista', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('first', branchOne));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(10, 1)], '/page/2'),
				'first',
				branchOne,
			),
		);
		const appendArg = { ...branchOne, page: 2, append: true };
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('more', appendArg));

		const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.rejected(abortError, 'more', appendArg),
		);

		expect(state.loading).toBe(false);
		expect(state.error).toBeUndefined();
		expect(state.listaMovimientoSucursal.map((m) => m.id)).toEqual([10]);
	});

	it('tras limpiar la lista ignora la respuesta de la consulta que seguía en vuelo', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('inflight', branchOne));
		state = reducer(state, clearListaMovimientoSucursal());

		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(10, 1)]),
				'inflight',
				branchOne,
			),
		);

		expect(state.listaMovimientoSucursal).toEqual([]);
		expect(state.loading).toBe(false);
	});

	it('un «cargar más» rechazado conserva las páginas cargadas y no marca error global', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('first', branchOne));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.fulfilled(
				makeResponse([makeMovement(10, 1)], '/page/2'),
				'first',
				branchOne,
			),
		);
		const appendArg = { ...branchOne, page: 2, append: true };
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('more', appendArg));

		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.rejected(
				null,
				'more',
				appendArg,
				'Servidor no disponible',
			),
		);

		expect(state.loading).toBe(false);
		expect(state.error).toBeUndefined();
		expect(state.listaMovimientoSucursal.map((m) => m.id)).toEqual([10]);
		expect(state.pagination.hasNextPage).toBe(true);
	});

	it('un rechazo de la consulta vigente de primera página marca error y vacía la lista', () => {
		let state = initial();
		state = reducer(state, fetchListaMovimientoSucursalThunk.pending('only', branchOne));
		state = reducer(
			state,
			fetchListaMovimientoSucursalThunk.rejected(null, 'only', branchOne, 'Sin acceso'),
		);

		expect(state.loading).toBe(false);
		expect(state.error).toBe('Sin acceso');
		expect(state.listaMovimientoSucursal).toEqual([]);
	});
});
