import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usePagosDiferidos from '../hooks/usePagosDiferidos';

const fetchListSpy = vi.hoisted(() => vi.fn());

vi.mock('@/store/slices/deferredPayments/deferredPaymentsMock', async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import('@/store/slices/deferredPayments/deferredPaymentsMock')
		>();
	return {
		...actual,
		mockFetchDeferredPayments: (
			...args: Parameters<typeof actual.mockFetchDeferredPayments>
		) => {
			fetchListSpy();
			return actual.mockFetchDeferredPayments(...args);
		},
	};
});
vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({
	default: true,
}));

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: null,
		hasValidBranch: false,
	}),
}));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return {
		useAppDispatch: reactRedux.useDispatch,
		useAppSelector: reactRedux.useSelector,
	};
});

describe('usePagosDiferidos', () => {
	const createHook = () => {
		const store = configureStore({
			reducer: { deferredPayments: deferredPaymentsReducer },
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		return { store, hook: renderHook(() => usePagosDiferidos(), { wrapper: Wrapper }) };
	};

	afterEach(() => {
		vi.useRealTimers();
	});

	it('carga la demo aun cuando la subsidiaria no se puede resolver', async () => {
		vi.useFakeTimers();
		const { store } = createHook();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(store.getState().deferredPayments.list.length).toBeGreaterThan(0);
		expect(store.getState().deferredPayments.summary).not.toBeNull();
		expect(store.getState().deferredPayments.error).toBeNull();
	});

	it('envía la paginación seleccionada al ciclo de carga', async () => {
		vi.useFakeTimers();
		const { store, hook } = createHook();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		act(() => {
			hook.result.current.filters.setFilter({ page: 2, per_page: 2 });
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(store.getState().deferredPayments.meta).toMatchObject({
			current_page: 2,
			per_page: 2,
		});
	});

	it('permite limpiar y volver a buscar el mismo término durante el debounce', async () => {
		vi.useFakeTimers();
		const { store, hook } = createHook();

		act(() => {
			hook.result.current.filters.setSearch('cliente');
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		act(() => {
			hook.result.current.filters.reset();
			hook.result.current.filters.setSearch('cliente');
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(hook.result.current.filters.search).toBe('cliente');
		expect(store.getState().deferredPayments.filters.search).toBe('cliente');
		expect(store.getState().deferredPayments.error).toBeNull();
	});

	it('no consulta cuando el rango de vencimiento es inválido', async () => {
		vi.useFakeTimers();
		const { store, hook } = createHook();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		const previousMeta = store.getState().deferredPayments.meta;

		act(() => {
			hook.result.current.filters.setFilter({
				due_after: '2026-08-10',
				due_before: '2026-08-01',
			});
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(hook.result.current.filters.hasInvalidDateRange).toBe(true);
		expect(store.getState().deferredPayments.meta).toEqual(previousMeta);
		expect(store.getState().deferredPayments.loading).toBe(false);
	});
	it('espera el debounce antes de consultar al buscar desde otra página', async () => {
		vi.useFakeTimers();
		const { hook } = createHook();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		act(() => hook.result.current.filters.setFilter({ page: 2 }));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		fetchListSpy.mockClear();

		act(() => hook.result.current.filters.setSearch('andina'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(299);
		});
		expect(fetchListSpy).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(fetchListSpy).toHaveBeenCalledOnce();
	});
	it('no deja un error falso al desmontar y abortar las solicitudes', async () => {
		vi.useFakeTimers();
		const { store, hook } = createHook();
		hook.unmount();
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(store.getState().deferredPayments.error).toBeNull();
		expect(store.getState().deferredPayments.errorSummary).toBeNull();
	});
});
