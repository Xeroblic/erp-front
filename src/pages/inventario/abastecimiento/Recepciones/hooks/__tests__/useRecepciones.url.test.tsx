import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { listStockReceipts } from '@/services/procurement/stockReceipts.service';
import stockReceiptsReducer from '@/store/slices/procurement/stockReceiptsSlice';
import useRecepciones from '../useRecepciones';

/**
 * Filtros del listado de recepciones en la URL: se leen al recargar, se
 * escriben al cambiar y nunca tocan `?purchase_document_id=`, que en esta
 * pantalla abre el alta con ese documento.
 */

vi.mock('@/services/procurement/stockReceipts.service', async (importOriginal) => {
	const original =
		await importOriginal<typeof import('@/services/procurement/stockReceipts.service')>();
	return {
		...original,
		listStockReceipts: vi.fn(() =>
			Promise.resolve({
				data: [],
				links: { first: '?page=1', last: '?page=1', prev: null, next: null },
				meta: {
					current_page: 1,
					from: null,
					last_page: 1,
					links: [],
					path: '/api/subsidiaries/4/procurement/stock-receipts',
					per_page: 20,
					to: null,
					total: 0,
				},
			}),
		),
	};
});
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 4, visibleBranches: [] }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const listCalls = vi.mocked(listStockReceipts);

const currentUrl = { search: '' };
const UrlProbe = () => {
	currentUrl.search = useLocation().search;
	return null;
};

const createWrapper = (initialEntry: string) => {
	const store = configureStore({ reducer: { stockReceipts: stockReceiptsReducer } });
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

describe('useRecepciones — filtros en la URL', () => {
	it('al recargar con filtros los pide al backend y deja fuera purchase_document_id', async () => {
		const { result } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(
				'/inventario/abastecimiento/recepciones?status=posted&warehouse_id=8&page=2&purchase_document_id=24',
			),
		});

		expect(result.current).toMatchObject({ status: 'posted', warehouseId: 8 });
		await waitFor(() => expect(listCalls).toHaveBeenCalled());
		const [, params] = listCalls.mock.calls.at(-1) ?? [];
		expect(params).toMatchObject({ status: 'posted', warehouse_id: 8, page: 2 });
		expect(params).not.toHaveProperty('purchase_document_id');
	});

	it('cambiar o limpiar filtros conserva purchase_document_id en la URL', () => {
		const { result } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(
				'/inventario/abastecimiento/recepciones?purchase_document_id=24',
			),
		});

		act(() => result.current.setStatusValue('failed'));
		expect(currentUrl.search).toBe('?purchase_document_id=24&status=failed');

		act(() => result.current.clearFilters());
		expect(currentUrl.search).toBe('?purchase_document_id=24');
	});
});
