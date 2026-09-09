import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/services/procurement/procurementSuppliers.service';
import procurementSuppliersReducer from '@/store/slices/procurement/procurementSuppliersSlice';
import useProveedores from '../useProveedores';

/**
 * Contra el servicio mock real (no se mockea): estas pruebas verifican que
 * el filtro «activos/inactivos/todos» se traduce en los parámetros
 * excluyentes del contrato (`is_active` vs `include_inactive`) y que cambiar
 * de filtro vuelve a la página 1.
 */

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 4 }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const createWrapper = () => {
	const store = configureStore({
		reducer: { procurementSuppliers: procurementSuppliersReducer },
	});
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return Wrapper;
};

afterEach(() => {
	resetProcurementSuppliersStoreForTests();
});

describe('useProveedores', () => {
	it('carga sólo activos por defecto', async () => {
		const { result } = renderHook(() => useProveedores(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.items.every((row) => row.is_active)).toBe(true);
		expect(result.current.status).toBe('active');
	});

	it('cambiar a Inactivos trae sólo desactivados y vuelve a la página 1', async () => {
		const { result } = renderHook(() => useProveedores(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.onPaginationChange(1, 1));
		await waitFor(() => expect(result.current.items).toHaveLength(1));

		act(() => result.current.setStatusValue('inactive'));
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.items.every((row) => !row.is_active)).toBe(true);
		expect(result.current.meta?.current_page).toBe(1);
	});

	it('Todos trae activos e inactivos', async () => {
		const { result } = renderHook(() => useProveedores(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.setStatusValue('all'));
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.items.some((row) => row.is_active)).toBe(true);
		expect(result.current.items.some((row) => !row.is_active)).toBe(true);
	});
});
