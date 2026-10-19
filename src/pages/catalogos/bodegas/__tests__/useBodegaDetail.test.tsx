import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { IWarehouseDetail } from '@/interface/warehouse.interface';
// eslint-disable-next-line import/extensions
import warehouseReducer from '@/store/slices/warehouses/warehouseSlice';
import { useBodegaDetail } from '../hooks/useBodegaDetail';

const fetchData = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: 1,
		hasValidBranch: true,
		visibleBranches: [],
	}),
}));
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

interface IRequest {
	url: string;
	params?: { page?: number };
}

const product = (id: number) => ({
	id,
	name: `Producto ${id}`,
	sku: `SKU-${id}`,
	branch_id: 1,
	stock: id,
	brand: { id: 1, name: 'Marca' },
});

const detail: IWarehouseDetail = {
	id: 7,
	name: 'Bodega Norte',
	code: 'BN-7',
	branch_id: 1,
	warehouse_type: 'Secundaria',
	maximum_capacity: null,
	is_active: true,
	requires_serial_tracking: false,
	products: [{ id: 101, sku: 'SKU-101', name: 'Producto 101', quantity: 2, sync_stock: true }],
};

describe('useBodegaDetail catálogo de productos', () => {
	it('recorre todas las páginas de productos de la sucursal', async () => {
		fetchData.mockImplementation(({ url, params }: IRequest) => {
			if (url.endsWith('/detail')) return Promise.resolve({ data: { data: detail } });
			const page = params?.page ?? 1;
			const ids =
				page === 1 ? Array.from({ length: 100 }, (_, index) => index + 1) : [99 + page];
			return Promise.resolve({
				data: {
					data: ids.map(product),
					meta: { total: 105, current_page: page, per_page: 100, last_page: 6 },
				},
			});
		});
		const store = configureStore({ reducer: { warehouse: warehouseReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>
				<MemoryRouter initialEntries={['/inventario/bodegas/7']}>
					<Routes>
						<Route path='/inventario/bodegas/:id' element={children} />
					</Routes>
				</MemoryRouter>
			</Provider>
		);

		const hook = renderHook(() => useBodegaDetail(), { wrapper: Wrapper });

		await waitFor(() => expect(hook.result.current.state.allProducts).toHaveLength(105));
		expect(hook.result.current.state.productsLoading).toBe(false);
		const availableIds = hook.result.current.derived.availableProducts.map((p) => p.id);
		expect(availableIds).toContain(105);
		expect(availableIds).not.toContain(101);
		expect(availableIds).toHaveLength(104);
	});
});
