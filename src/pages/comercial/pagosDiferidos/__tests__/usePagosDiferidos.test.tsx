import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { usePagosDiferidos } from '../hooks/usePagosDiferidos';

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
	afterEach(() => {
		vi.useRealTimers();
	});

	it('no restaura una búsqueda pendiente después de limpiar los filtros', async () => {
		vi.useFakeTimers();
		const store = configureStore({
			reducer: { deferredPayments: deferredPaymentsReducer },
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const { result } = renderHook(() => usePagosDiferidos(), { wrapper: Wrapper });

		act(() => {
			result.current.filters.setSearch('cliente');
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		expect(store.getState().deferredPayments.filters.search).toBe('cliente');

		act(() => {
			result.current.filters.setSearch('cliente nuevo');
			result.current.filters.reset();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(result.current.filters.search).toBe('');
		expect(store.getState().deferredPayments.filters.search).toBeUndefined();
	});
});
