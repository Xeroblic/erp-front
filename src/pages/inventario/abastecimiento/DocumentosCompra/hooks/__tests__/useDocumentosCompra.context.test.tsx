import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetPurchaseDocumentsStoreForTests } from '@/mocks/services/purchaseDocuments.mock';
import purchaseDocumentsReducer from '@/store/slices/procurement/purchaseDocumentsSlice';
import useDocumentosCompra from '../useDocumentosCompra';

/**
 * Propiedad de contexto del listado (ZF-12). El store guarda lo de la última
 * filial que respondió y la petición nueva sale en un efecto: el hook no
 * puede mostrar filas ni dejar abierto el alta de la filial anterior.
 */

vi.mock(
	'@/services/procurement/purchaseDocuments.service',
	() => import('@/mocks/services/purchaseDocuments.mock'),
);

const branchContext = vi.hoisted(() => ({ branchId: 4, subsidiaryId: 4 }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...branchContext }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const OTHER_SUBSIDIARY_ID = 9;

const createWrapper = () => {
	const store = configureStore({ reducer: { purchaseDocuments: purchaseDocumentsReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return Wrapper;
};

const switchSubsidiary = (rerender: () => void) => {
	branchContext.branchId = OTHER_SUBSIDIARY_ID;
	branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
	rerender();
};

afterEach(() => {
	resetPurchaseDocumentsStoreForTests();
	branchContext.branchId = 4;
	branchContext.subsidiaryId = 4;
});

describe('useDocumentosCompra — cambio de filial', () => {
	it('no muestra el listado de la filial anterior desde el primer render', async () => {
		const { result, rerender } = renderHook(() => useDocumentosCompra(), {
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
		const { result, rerender } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		act(() => result.current.onPaginationChange(2, 1));
		await waitFor(() => expect(result.current.meta?.current_page).toBe(2));

		switchSubsidiary(rerender);
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.meta?.current_page).toBe(1);
	});

	it('cierra el alta abierta en la filial anterior', () => {
		const { result, rerender } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper(),
		});
		act(() => result.current.setIsCreateModalOpen(true));
		expect(result.current.isCreateModalOpen).toBe(true);

		switchSubsidiary(rerender);

		expect(result.current.isCreateModalOpen).toBe(false);
	});
});
