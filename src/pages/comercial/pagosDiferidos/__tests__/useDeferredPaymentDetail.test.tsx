import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

const fetchDetailSpy = vi.hoisted(() => vi.fn());
const branchContext = vi.hoisted(() => ({ subsidiaryId: null as number | null }));

vi.mock('@/store/slices/deferredPayments/deferredPaymentsMock', async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import('@/store/slices/deferredPayments/deferredPaymentsMock')
		>();
	return {
		...actual,
		mockFetchDeferredPaymentById: (
			...args: Parameters<typeof actual.mockFetchDeferredPaymentById>
		) => {
			fetchDetailSpy(...args);
			return actual.mockFetchDeferredPaymentById(...args);
		},
	};
});

vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({
	default: true,
}));

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: branchContext.subsidiaryId,
		hasValidBranch: branchContext.subsidiaryId !== null,
		visibleBranches: [],
	}),
}));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return {
		useAppDispatch: reactRedux.useDispatch,
		useAppSelector: reactRedux.useSelector,
	};
});

describe('useDeferredPaymentDetail', () => {
	const createHook = (documentId: number | null) => {
		const store = configureStore({
			reducer: { deferredPayments: deferredPaymentsReducer },
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(
			({ selectedId }: { selectedId: number | null }) => useDeferredPaymentDetail(selectedId),
			{ initialProps: { selectedId: documentId }, wrapper: Wrapper },
		);
		return { store, hook };
	};

	afterEach(() => {
		branchContext.subsidiaryId = null;
		fetchDetailSpy.mockClear();
		vi.useRealTimers();
	});

	it('no consulta ni conserva detalle cuando no hay documento seleccionado', () => {
		const { hook, store } = createHook(null);

		expect(fetchDetailSpy).not.toHaveBeenCalled();
		expect(hook.result.current.document).toBeNull();
		expect(store.getState().deferredPayments.current).toBeNull();
	});

	it('carga el detalle mock sin subsidiaria resuelta', async () => {
		vi.useFakeTimers();
		const { hook } = createHook(2);

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(fetchDetailSpy).toHaveBeenCalledOnce();
		expect(hook.result.current.document?.id).toBe(2);
		expect(hook.result.current.hasDataContext).toBe(true);
	});

	it('aborta el detalle anterior al cambiar rápidamente de documento', async () => {
		vi.useFakeTimers();
		const { hook, store } = createHook(1);

		hook.rerender({ selectedId: 2 });
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(fetchDetailSpy).toHaveBeenCalledTimes(2);
		expect(hook.result.current.document?.id).toBe(2);
		expect(store.getState().deferredPayments.errorDetail).toBeNull();
	});

	it('expone el error y permite reintentar la carga vigente', async () => {
		vi.useFakeTimers();
		const { hook } = createHook(9999);

		await act(async () => {
			await vi.runAllTimersAsync();
		});
		expect(hook.result.current.error).toContain('No se encontr');

		act(() => {
			const request = hook.result.current.actions.refresh();
			expect(request).toBeDefined();
		});
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(fetchDetailSpy).toHaveBeenCalledTimes(2);
		expect(hook.result.current.error).toContain('No se encontr');
	});

	it('aborta y limpia el estado del detalle al desmontar', async () => {
		vi.useFakeTimers();
		const { hook, store } = createHook(1);

		hook.unmount();
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(store.getState().deferredPayments).toMatchObject({
			current: null,
			loadingDetail: false,
			errorDetail: null,
			detailRequestId: null,
		});
	});
});
