import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetPurchaseDocumentsStoreForTests } from '@/mocks/services/purchaseDocuments.mock';
import { listPurchaseDocuments } from '@/services/procurement/purchaseDocuments.service';
import purchaseDocumentsReducer from '@/store/slices/procurement/purchaseDocumentsSlice';
import useDocumentosCompra from '../useDocumentosCompra';

/**
 * Propiedad de contexto del listado (ZF-12). El store guarda lo de la última
 * filial que respondió y la petición nueva sale en un efecto: el hook no
 * puede mostrar filas ni dejar abierto el alta de la filial anterior.
 */

vi.mock('@/services/procurement/purchaseDocuments.service', async () => {
	const mock = await import('@/mocks/services/purchaseDocuments.mock');
	return { ...mock, listPurchaseDocuments: vi.fn(mock.listPurchaseDocuments) };
});
// Las opciones del filtro tienen su propia prueba: acá sólo importa el listado.
vi.mock('../useSupplierFilterOptions', () => ({
	default: () => ({ options: [], loading: false, canList: true }),
}));

const branchContext = vi.hoisted(() => ({
	branchId: 4 as number | null,
	subsidiaryId: 4 as number | null,
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...branchContext }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const OTHER_SUBSIDIARY_ID = 9;

const listCalls = vi.mocked(listPurchaseDocuments);
const lastListCall = () => listCalls.mock.calls.at(-1);

/** Expone la query vigente para comprobar qué quedó escrito en la URL. */
const currentUrl = { search: '' };
const UrlProbe = () => {
	currentUrl.search = useLocation().search;
	return null;
};

const createWrapper = (initialEntry = '/inventario/abastecimiento/documentos-compra') => {
	const store = configureStore({ reducer: { purchaseDocuments: purchaseDocumentsReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<MemoryRouter initialEntries={[initialEntry]}>
			<Provider store={store}>
				{children}
				<UrlProbe />
			</Provider>
		</MemoryRouter>
	);
	return Wrapper;
};

const switchSubsidiary = (rerender: () => void) => {
	branchContext.branchId = OTHER_SUBSIDIARY_ID;
	branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
	rerender();
};

afterEach(() => {
	listCalls.mockClear();
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

describe('useDocumentosCompra — filtros en la URL', () => {
	it('al recargar con filtros los lee de la URL y los pide al backend', async () => {
		const { result } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper(
				'/inventario/abastecimiento/documentos-compra?status=draft&supplier_id=3&issued_from=2026-09-01&page=2',
			),
		});

		expect(result.current).toMatchObject({
			status: 'draft',
			supplierId: 3,
			issuedFrom: '2026-09-01',
			hasActiveFilters: true,
		});
		await waitFor(() => expect(listCalls).toHaveBeenCalled());
		expect(lastListCall()).toEqual([
			4,
			expect.objectContaining({
				status: 'draft',
				supplier_id: 3,
				issued_from: '2026-09-01',
				page: 2,
				per_page: 20,
			}),
		]);
	});

	it('cambiar un filtro lo escribe en la URL, vuelve a la página 1 y respeta otras claves', async () => {
		const { result } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper('/inventario/abastecimiento/documentos-compra?page=3&otro=x'),
		});

		act(() => result.current.setSupplierIdValue(7));

		expect(new URLSearchParams(currentUrl.search).get('supplier_id')).toBe('7');
		expect(new URLSearchParams(currentUrl.search).get('page')).toBeNull();
		expect(new URLSearchParams(currentUrl.search).get('otro')).toBe('x');
		await waitFor(() => expect(lastListCall()?.[1]).toMatchObject({ supplier_id: 7, page: 1 }));

		act(() => result.current.clearFilters());
		expect(currentUrl.search).toBe('?otro=x');
	});

	it('al cambiar de filial descarta el proveedor sin pedirlo nunca a la filial nueva', async () => {
		const { rerender } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper(
				'/inventario/abastecimiento/documentos-compra?supplier_id=3&status=draft',
			),
		});
		await waitFor(() => expect(listCalls).toHaveBeenCalled());

		switchSubsidiary(rerender);

		await waitFor(() => expect(lastListCall()?.[0]).toBe(OTHER_SUBSIDIARY_ID));
		const otherSubsidiaryCalls = listCalls.mock.calls.filter(
			([subsidiaryId]) => subsidiaryId === OTHER_SUBSIDIARY_ID,
		);
		otherSubsidiaryCalls.forEach(([, params]) => expect(params?.supplier_id).toBeUndefined());
		expect(currentUrl.search).toBe('?status=draft');
	});

	it('conserva el proveedor del enlace cuando el perfil termina de cargar', async () => {
		branchContext.subsidiaryId = null;
		const { result, rerender } = renderHook(() => useDocumentosCompra(), {
			wrapper: createWrapper('/inventario/abastecimiento/documentos-compra?supplier_id=3'),
		});

		branchContext.subsidiaryId = 4;
		rerender();

		await waitFor(() => expect(lastListCall()?.[0]).toBe(4));
		expect(lastListCall()?.[1]).toMatchObject({ supplier_id: 3 });
		expect(result.current.supplierId).toBe(3);
		expect(currentUrl.search).toBe('?supplier_id=3');
	});
});
