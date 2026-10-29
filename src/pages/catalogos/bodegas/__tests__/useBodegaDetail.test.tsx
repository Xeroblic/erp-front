import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { IWarehouseDetail } from '@/interface/warehouse.interface';
// eslint-disable-next-line import/extensions
import warehouseReducer from '@/store/slices/warehouses/warehouseSlice';
import { useBodegaDetail } from '../hooks/useBodegaDetail';
import AttachProductModal from '../detallesComponents/modals/AttachProductModal';

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
vi.mock('@/components/ui/Modal', () => ({
	default: ({ children }: PropsWithChildren) => <section>{children}</section>,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		isDisable,
	}: PropsWithChildren<{ onClick?: () => void; isDisable?: boolean }>) => (
		<button type='button' onClick={onClick} disabled={isDisable}>
			{children}
		</button>
	),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

interface IRequest {
	url: string;
	method?: string;
	data?: unknown;
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

const AttachWrapper = ({ children }: PropsWithChildren) => (
	<Provider store={configureStore({ reducer: { warehouse: warehouseReducer } })}>
		<MemoryRouter initialEntries={['/inventario/bodegas/7']}>
			<Routes>
				<Route path='/inventario/bodegas/:id' element={children} />
			</Routes>
		</MemoryRouter>
	</Provider>
);

const AttachFlow = () => {
	const { state, actions } = useBodegaDetail();
	return (
		<>
			<button
				type='button'
				disabled={state.productsLoading || !state.allProducts.length}
				onClick={() => actions.onSelectProductToAttach(state.allProducts[0])}>
				Elegir producto
			</button>
			{state.attachProduct && (
				<AttachProductModal
					isOpen
					product={state.attachProduct}
					associatedProducts={state.warehouse?.products}
					onClose={actions.closeAttachModal}
					onConfirm={actions.onConfirmAttach}
					isLoading={state.isAttaching}
				/>
			)}
		</>
	);
};

describe('asociación manual de productos a bodegas (ZF-116)', () => {
	it('envía cantidad manual aunque el stock global sea cero y conserva el borrador ante 422', async () => {
		let rejectAttach = true;
		fetchData.mockReset();
		fetchData.mockImplementation(({ url, method }: IRequest) => {
			if (method === 'post') {
				return rejectAttach
					? Promise.reject(
							Object.assign(new Error('Sin capacidad'), {
								response: {
									status: 422,
									data: {
										message: 'Sin capacidad',
										errors: { quantity: ['Sin capacidad'] },
									},
								},
							}),
						)
					: Promise.resolve({ data: { data: detail } });
			}
			if (url.endsWith('/detail')) return Promise.resolve({ data: { data: detail } });
			return Promise.resolve({ data: { data: [{ ...product(102), stock: 0 }] } });
		});
		render(<AttachFlow />, { wrapper: AttachWrapper });
		await waitFor(() =>
			expect(fetchData).toHaveBeenCalledWith(
				expect.objectContaining({ url: '/branches/1/products' }),
			),
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Elegir producto' })).toBeEnabled(),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Elegir producto' }));
		expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
		expect(screen.queryByRole('switch')).not.toBeInTheDocument();
		expect(screen.queryByText(/Sincronizar/)).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '0' } });
		fireEvent.click(screen.getByRole('button', { name: 'Asociar' }));
		expect(fetchData).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'post' }));
		fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '4' } });
		fireEvent.click(screen.getByRole('button', { name: 'Asociar' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Asociar' })).toBeEnabled());
		expect(screen.getByLabelText('Cantidad')).toHaveValue(4);
		expect(fetchData).toHaveBeenCalledWith({
			url: '/branches/1/warehouses/7/products',
			method: 'post',
			data: { product_id: 102, quantity: 4 },
		});
		rejectAttach = false;
		fireEvent.click(screen.getByRole('button', { name: 'Asociar' }));
		await waitFor(() => expect(screen.queryByLabelText('Cantidad')).not.toBeInTheDocument());
	});
});

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
