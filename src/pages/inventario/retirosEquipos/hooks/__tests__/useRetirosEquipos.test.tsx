import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRetirosEquipos } from '../useRetirosEquipos';

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 12, subsidiaryId: 3, hasValidBranch: true }),
}));

vi.mock('@/store/slices/equipmentWithdrawals', () => ({
	fetchWithdrawals: (payload: unknown) => ({ type: 'equipmentWithdrawals/fetch', payload }),
	selectWithdrawals: (state: { equipmentWithdrawals: ITestWithdrawalsState }) =>
		state.equipmentWithdrawals.list,
	selectWithdrawalsMeta: (state: { equipmentWithdrawals: ITestWithdrawalsState }) =>
		state.equipmentWithdrawals.meta,
	selectWithdrawalsLoading: (state: { equipmentWithdrawals: ITestWithdrawalsState }) =>
		state.equipmentWithdrawals.loading,
	selectWithdrawalsError: (state: { equipmentWithdrawals: ITestWithdrawalsState }) =>
		state.equipmentWithdrawals.error,
	selectWithdrawalsOwnerContext: (state: { equipmentWithdrawals: ITestWithdrawalsState }) =>
		state.equipmentWithdrawals.ownerContext,
	withdrawalsFiltersFromSearchParams: (params: URLSearchParams) => ({
		...(params.get('q') ? { q: params.get('q') ?? undefined } : {}),
		...(params.get('page') ? { page: Number(params.get('page')) } : {}),
		...(params.get('per_page') ? { per_page: Number(params.get('per_page')) } : {}),
	}),
}));

interface ITestWithdrawalsState {
	list: [];
	meta: null;
	loading: boolean;
	error: null;
	ownerContext: null;
}

const initialWithdrawalsState: ITestWithdrawalsState = {
	list: [],
	meta: null,
	loading: false,
	error: null,
	ownerContext: null,
};

const createHook = (initialEntry: string) => {
	const store = configureStore({
		reducer: { equipmentWithdrawals: (state = initialWithdrawalsState) => state },
	});
	const Wrapper = ({ children }: PropsWithChildren) => (
		<MemoryRouter
			initialEntries={[initialEntry]}
			future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<Provider store={store}>{children}</Provider>
		</MemoryRouter>
	);

	return renderHook(() => useRetirosEquipos(), { wrapper: Wrapper });
};

describe('useRetirosEquipos: búsqueda y filtros rápidos', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('no deja que una búsqueda pendiente reemplace "Qué hay afuera"', async () => {
		vi.useFakeTimers();
		const hook = createHook('/inventario/retiros-equipos');

		act(() => hook.result.current.onSearchChange('serie'));
		act(() => hook.result.current.applyQuickFilter('out'));
		await act(async () => vi.advanceTimersByTimeAsync(400));

		expect(hook.result.current.quickFilter).toBe('out');
		expect(hook.result.current.searchValue).toBe('');
	});

	it('no restaura filtros al limpiar mientras una búsqueda está pendiente', async () => {
		vi.useFakeTimers();
		const hook = createHook('/inventario/retiros-equipos?status=confirmed&type=loan&q=serie');

		act(() => {
			hook.result.current.onSearchChange('');
			hook.result.current.applyQuickFilter('all');
		});
		await act(async () => vi.advanceTimersByTimeAsync(400));

		expect(hook.result.current.quickFilter).toBe('all');
		expect(hook.result.current.searchValue).toBe('');
	});
});
