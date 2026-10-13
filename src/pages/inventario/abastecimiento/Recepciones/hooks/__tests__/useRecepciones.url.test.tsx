import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	listStockReceipts,
	listWarehousesForStockReceipts,
} from '@/services/procurement/stockReceipts.service';
import stockReceiptsReducer from '@/store/slices/procurement/stockReceiptsSlice';
import useRecepciones from '../useRecepciones';

/**
 * Filtros del listado de recepciones en la URL: se leen al recargar, se
 * escriben al cambiar y nunca tocan `?purchase_document_id=`, que en esta
 * pantalla abre el alta con ese documento. Cambiar de filial descarta la
 * bodega y la página de la anterior.
 */

vi.mock('@/services/procurement/stockReceipts.service', async (importOriginal) => {
	const original =
		await importOriginal<typeof import('@/services/procurement/stockReceipts.service')>();
	return {
		...original,
		listWarehousesForStockReceipts: vi.fn(() =>
			Promise.resolve([{ id: 8, name: 'Bodega Central', is_active: true, branch_id: 4 }]),
		),
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

const branch = vi.hoisted(() => ({
	current: {
		branchId: 4 as number | null,
		subsidiaryId: 4 as number | null,
		visibleBranches: [] as { id: number; name: string }[],
	},
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => branch.current,
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const listCalls = vi.mocked(listStockReceipts);
const warehouseCalls = vi.mocked(listWarehousesForStockReceipts);

const setBranch = (
	subsidiaryId: number | null,
	visibleBranches = branch.current.visibleBranches,
) => {
	branch.current = { branchId: 4, subsidiaryId, visibleBranches };
};

afterEach(() => {
	setBranch(4, []);
	vi.clearAllMocks();
});

const currentUrl = { search: '' };
const UrlProbe = () => {
	currentUrl.search = useLocation().search;
	return null;
};

const createWrapper = (initialEntry: string) => {
	const store = configureStore({
		// `auth` sin usuario: la filial de cada sucursal no se conoce y ninguna se descarta.
		reducer: { stockReceipts: stockReceiptsReducer, auth: () => ({ user: null }) },
	});
	const Wrapper = ({ children }: PropsWithChildren) => (
		// Mismo flag que el `BrowserRouter` de la app: la URL se actualiza en
		// una transición, después que el estado urgente del hook.
		<MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true }}>
			<Provider store={store}>
				{children}
				<UrlProbe />
			</Provider>
		</MemoryRouter>
	);
	return Wrapper;
};

const LIST_URL = '/inventario/abastecimiento/recepciones';

describe('useRecepciones — filtros en la URL', () => {
	it('al recargar con filtros los pide al backend y deja fuera purchase_document_id', async () => {
		const { result } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(
				`${LIST_URL}?status=posted&warehouse_id=8&page=2&purchase_document_id=24`,
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
			wrapper: createWrapper(`${LIST_URL}?purchase_document_id=24`),
		});

		act(() => result.current.setStatusValue('failed'));
		expect(currentUrl.search).toBe('?purchase_document_id=24&status=failed');

		act(() => result.current.clearFilters());
		expect(currentUrl.search).toBe('?purchase_document_id=24');
	});
});

describe('useRecepciones — filial activa', () => {
	it('sin filial activa deja de cargar y muestra el error', async () => {
		setBranch(null);
		const { result } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(LIST_URL),
		});

		await waitFor(() => expect(result.current.error).toMatch(/filial activa/));
		expect(result.current.loading).toBe(false);
		expect(listCalls).not.toHaveBeenCalled();
	});

	it('cambiar de filial descarta bodega y página, y la petición sale sin ellas', async () => {
		const { rerender } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(`${LIST_URL}?status=posted&warehouse_id=8&page=2`),
		});
		await waitFor(() => expect(listCalls).toHaveBeenCalledTimes(1));

		setBranch(5);
		rerender();

		await waitFor(() => expect(currentUrl.search).toBe('?status=posted'));
		const callsForNewSubsidiary = listCalls.mock.calls.filter(([id]) => id === 5);
		expect(callsForNewSubsidiary.length).toBeGreaterThan(0);
		callsForNewSubsidiary.forEach(([, params]) => {
			expect(params).not.toHaveProperty('warehouse_id', 8);
			expect(params).toMatchObject({ status: 'posted', page: 1 });
		});
	});

	it('pasar de sin filial a una filial (perfil cargado) conserva la bodega del enlace', async () => {
		setBranch(null);
		const { rerender } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(`${LIST_URL}?warehouse_id=8`),
		});

		setBranch(4);
		rerender();

		await waitFor(() => expect(listCalls).toHaveBeenCalled());
		expect(currentUrl.search).toBe('?warehouse_id=8');
		expect(listCalls.mock.calls.at(-1)?.[1]).toMatchObject({ warehouse_id: 8 });
	});
});

describe('useRecepciones — bodegas del filtro', () => {
	it('las pide a la fachada de recepciones con las sucursales del usuario', async () => {
		setBranch(4, [
			{ id: 4, name: 'Central' },
			{ id: 6, name: 'Sur' },
		]);
		const { result } = renderHook(() => useRecepciones(), {
			wrapper: createWrapper(LIST_URL),
		});

		expect(warehouseCalls).toHaveBeenCalledWith([4, 6], expect.any(AbortSignal));
		await waitFor(() =>
			expect(result.current.warehouseOptions).toEqual([
				{ id: 8, name: 'Bodega Central', is_active: true, branch_id: 4 },
			]),
		);
		expect(result.current.authorizedBranchIds).toEqual([4, 6]);
	});
});
