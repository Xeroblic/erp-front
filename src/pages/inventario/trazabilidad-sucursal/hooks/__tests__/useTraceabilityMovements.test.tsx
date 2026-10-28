import { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import inventarioReducer from '@/store/slices/inventory/inventorySlice';
import { useTraceabilityMovements } from '../useTraceabilityMovements';

interface IPendingRequest {
	url: string;
	signal: AbortSignal;
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
}

const branchContext = vi.hoisted(() => ({ branchId: 1 }));
const requests = vi.hoisted((): IPendingRequest[] => []);
const fetchData = vi.hoisted(() =>
	vi.fn(
		(config: { url: string; signal: AbortSignal }) =>
			new Promise((resolve, reject) => {
				requests.push({ url: config.url, signal: config.signal, resolve, reject });
			}),
	),
);
const toastError = vi.hoisted(() => vi.fn());
const branches = vi.hoisted(() => [
	{ id: 1, name: 'Sucursal Uno' },
	{ id: 2, name: 'Sucursal Dos' },
]);

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: branchContext.branchId }),
}));
vi.mock('@/store/selectors/userBranchesSelectors', () => ({
	selectUserBranches: () => branches,
}));
vi.mock('react-toastify', () => ({ toast: { error: toastError } }));
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

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

const okResponse = (movements: IInventoryMovement[], hasNextPage = false) => ({
	data: {
		data: movements,
		links: { first: null, last: null, prev: null, next: hasNextPage ? '/page/2' : null },
		meta: {
			current_page: 1,
			from: 1,
			last_page: hasNextPage ? 2 : 1,
			path: '',
			per_page: 20,
			to: movements.length,
			total: movements.length,
		},
	},
});

const renderTraceability = () => {
	const store = configureStore({ reducer: { inventario: inventarioReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return renderHook(() => useTraceabilityMovements(), { wrapper: Wrapper });
};

interface IRenderSnapshot {
	branch: number | null;
	ids: number[];
	status: string;
	next: boolean;
	hasFetched: boolean;
	error: string | undefined;
}

/** Registra cada render, no sólo el estado final tras los efectos. */
const renderRecordingTraceability = () => {
	const renders: IRenderSnapshot[] = [];
	const store = configureStore({ reducer: { inventario: inventarioReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	const hook = renderHook(
		() => {
			const result = useTraceabilityMovements();
			renders.push({
				branch: result.branchId,
				ids: result.movimientos.map((m) => m.id),
				status: result.fetchStatus,
				next: result.pagination.hasNextPage,
				hasFetched: result.hasFetched,
				error: result.error,
			});
			return result;
		},
		{ wrapper: Wrapper },
	);
	return { hook, renders };
};

describe('useTraceabilityMovements', () => {
	beforeEach(() => {
		branchContext.branchId = 1;
		requests.length = 0;
		fetchData.mockClear();
		toastError.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('al cambiar de sucursal cancela la consulta anterior y su respuesta tardía no reemplaza la nueva', async () => {
		const hook = renderTraceability();
		expect(requests).toHaveLength(1);
		const oldRequest = requests[0];
		expect(oldRequest.url).toContain('/branches/1/');

		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});

		await waitFor(() => expect(requests).toHaveLength(2));
		expect(oldRequest.signal.aborted).toBe(true);
		const newRequest = requests[1];
		expect(newRequest.url).toContain('/branches/2/');

		await act(async () => {
			newRequest.resolve(okResponse([makeMovement(20, 2)]));
			await Promise.resolve();
		});
		await waitFor(() => expect(hook.result.current.fetchStatus).toBe('success'));

		await act(async () => {
			oldRequest.resolve(okResponse([makeMovement(10, 1)]));
			await Promise.resolve();
		});

		expect(hook.result.current.movimientos.map((m) => m.id)).toEqual([20]);
		expect(hook.result.current.currentBranchName).toBe('Sucursal Dos');
	});

	it('al vencer el tiempo de espera cancela la petición y una respuesta tardía no pisa el estado «timeout»', async () => {
		vi.useFakeTimers();
		const hook = renderTraceability();
		expect(hook.result.current.fetchStatus).toBe('loading');
		const request = requests[0];

		await act(async () => {
			await vi.advanceTimersByTimeAsync(15_000);
		});

		expect(hook.result.current.fetchStatus).toBe('timeout');
		expect(request.signal.aborted).toBe(true);

		await act(async () => {
			request.resolve(okResponse([makeMovement(10, 1)]));
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(hook.result.current.fetchStatus).toBe('timeout');
		expect(hook.result.current.movimientos).toEqual([]);
		expect(hook.result.current.loading).toBe(false);
	});

	it('desde el primer render tras cambiar de sucursal no expone datos, paginación ni estado de la anterior', async () => {
		const { hook, renders } = renderRecordingTraceability();
		await act(async () => {
			requests[0].resolve(okResponse([makeMovement(10, 1)], true));
			await Promise.resolve();
		});
		await waitFor(() => expect(hook.result.current.fetchStatus).toBe('success'));

		renders.length = 0;
		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});

		const branchTwoRenders = renders.filter((r) => r.branch === 2);
		expect(branchTwoRenders.length).toBeGreaterThan(0);
		branchTwoRenders.forEach((snapshot) => {
			expect(snapshot).toMatchObject({ ids: [], next: false, hasFetched: false });
			expect(snapshot.status).not.toBe('success');
		});
	});

	it('desde el primer render tras cambiar de sucursal no muestra el error de la anterior', async () => {
		const { hook, renders } = renderRecordingTraceability();
		await act(async () => {
			requests[0].reject({ response: { data: { message: 'Falla sucursal uno' } } });
			await Promise.resolve();
		});
		await waitFor(() => expect(hook.result.current.fetchStatus).toBe('error'));
		expect(hook.result.current.error).toBe('Falla sucursal uno');

		renders.length = 0;
		act(() => {
			branchContext.branchId = 2;
			hook.rerender();
		});

		const branchTwoRenders = renders.filter((r) => r.branch === 2);
		expect(branchTwoRenders.length).toBeGreaterThan(0);
		branchTwoRenders.forEach((snapshot) => {
			expect(snapshot.error).toBeUndefined();
			expect(snapshot.status).not.toBe('error');
		});
	});

	it('si falla «cargar más» conserva las páginas cargadas y avisa sin pantalla de error', async () => {
		const hook = renderTraceability();
		await act(async () => {
			requests[0].resolve(okResponse([makeMovement(10, 1)], true));
			await Promise.resolve();
		});
		await waitFor(() => expect(hook.result.current.fetchStatus).toBe('success'));

		act(() => hook.result.current.loadMore());
		expect(requests).toHaveLength(2);
		await act(async () => {
			requests[1].reject({ response: { data: { message: 'Servidor no disponible' } } });
			await Promise.resolve();
		});

		await waitFor(() => expect(hook.result.current.isLoadingMore).toBe(false));
		expect(hook.result.current.fetchStatus).toBe('success');
		expect(hook.result.current.error).toBeUndefined();
		expect(hook.result.current.movimientos.map((m) => m.id)).toEqual([10]);
		expect(toastError).toHaveBeenCalledWith('Servidor no disponible');
	});

	it('si «cargar más» vence el tiempo de espera conserva las páginas cargadas', async () => {
		vi.useFakeTimers();
		const hook = renderTraceability();
		await act(async () => {
			requests[0].resolve(okResponse([makeMovement(10, 1)], true));
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(hook.result.current.fetchStatus).toBe('success');

		act(() => hook.result.current.loadMore());
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15_000);
		});

		expect(requests[1].signal.aborted).toBe(true);
		expect(hook.result.current.fetchStatus).toBe('success');
		expect(hook.result.current.isLoadingMore).toBe(false);
		expect(hook.result.current.movimientos.map((m) => m.id)).toEqual([10]);
		expect(toastError).toHaveBeenCalledTimes(1);
	});
});
