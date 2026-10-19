import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetProcurementSuppliersStoreForTests } from '@/mocks/services/procurementSuppliers.mock';
import procurementSuppliersReducer from '@/store/slices/procurement/procurementSuppliersSlice';
import useProveedores from '../useProveedores';

/**
 * Contra el doble en memoria del servicio: estas pruebas verifican que
 * el filtro «activos/inactivos/todos» se traduce en los parámetros
 * excluyentes del contrato (`is_active` vs `include_inactive`) y que cambiar
 * de filtro vuelve a la página 1.
 */

vi.mock(
	'@/services/procurement/procurementSuppliers.service',
	() => import('@/mocks/services/procurementSuppliers.mock'),
);

const branchContext = vi.hoisted(() => ({ branchId: 4, subsidiaryId: 4 }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...branchContext }),
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
	branchContext.branchId = 4;
	branchContext.subsidiaryId = 4;
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

describe('useProveedores — cambio de filial', () => {
	const OTHER_SUBSIDIARY_ID = 9;

	const switchSubsidiary = (rerender: () => void) => {
		branchContext.branchId = OTHER_SUBSIDIARY_ID;
		branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
		rerender();
	};

	it('no muestra el listado de la filial anterior desde el primer render', async () => {
		const { result, rerender } = renderHook(() => useProveedores(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.items.length).toBeGreaterThan(0));

		switchSubsidiary(rerender);

		expect(result.current.items).toEqual([]);
		expect(result.current.meta).toBeNull();
		expect(result.current.loading).toBe(true);

		// El doble siembra igual cada filial: lo que importa es que la vista
		// quedó vacía hasta que respondió la filial nueva.
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.items.length).toBeGreaterThan(0);
	});

	it('vuelve a la página 1', async () => {
		const { result, rerender } = renderHook(() => useProveedores(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.onPaginationChange(2, 1));
		await waitFor(() => expect(result.current.meta?.current_page).toBe(2));

		switchSubsidiary(rerender);
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.meta?.current_page ?? 1).toBe(1);
	});

	it('cierra la desactivación elegida en la filial anterior', async () => {
		const { result, rerender } = renderHook(() => useProveedores(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.items.length).toBeGreaterThan(0));
		const [supplier] = result.current.items;

		act(() => result.current.openDeactivate(supplier));
		expect(result.current.deactivateTarget).toEqual(supplier);

		switchSubsidiary(rerender);

		expect(result.current.deactivateTarget).toBeNull();
	});
});
