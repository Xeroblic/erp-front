import type { PropsWithChildren } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CreateEditProductModal from '@/pages/catalogos/productos/components/modals/CreateEditProductModal';
import type { IProduct } from '@/interface/product.interface';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('react-toastify', () => ({
	toast: { error: toastError, success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/store/slices/brands/brandsSlice', () => ({
	fetchBrands: () => ({ type: 'brands/fetch' }),
	createBrand: () => ({ type: 'brands/create' }),
}));
// El OffCanvas real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/OffCanvas', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	OffCanvasHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	OffCanvasBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	OffCanvasFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
}));
// Selectores y paneles con sus propias peticiones: no aportan a estas pruebas.
vi.mock('@/components/utils/selects/BrandSelectorWithCreate', () => ({ default: () => null }));
vi.mock('@/components/utils/selects/CategorySelectorWithCreate', () => ({ default: () => null }));
vi.mock('../components/UserBranchSelector', () => ({ default: () => null }));
vi.mock('../components/WooCommerceProductTab', () => ({ default: () => null }));
vi.mock('../components/WooCommercePublishPanel', () => ({ default: () => null }));

const auth = createSlice({
	name: 'auth',
	initialState: { user: { id: 1 } },
	reducers: {},
});

const product = {
	id: 7,
	sku: 'NB-01',
	name: 'Notebook',
	brand_id: 2,
	product_type: 'general',
	is_active: true,
	serial_tracking: false,
	categories: [],
} as unknown as IProduct;

const renderModal = (onSubmit: () => Promise<void>, onClose = vi.fn()) => {
	const store = configureStore({ reducer: { auth: auth.reducer } });
	render(
		<Provider store={store}>
			<CreateEditProductModal
				isOpen
				onClose={onClose}
				onSubmit={onSubmit}
				product={product}
				brands={[]}
				categories={[]}
			/>
		</Provider>,
	);
	return { onClose };
};

afterEach(() => {
	toastError.mockReset();
});

describe('CreateEditProductModal: error del backend al guardar', () => {
	it('queda abierto, marca el campo y muestra el mensaje con el rechazo del thunk', async () => {
		// Forma de `rejectValue` de createProduct/updateProduct (`getErrorPayload`).
		const onSubmit = vi.fn().mockRejectedValue({
			message: 'Los datos no son válidos.',
			errors: { sku: ['El SKU ya está en uso.'] },
		});
		const { onClose } = renderModal(onSubmit);

		fireEvent.click(screen.getByRole('button', { name: /Actualizar producto/i }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(toastError).toHaveBeenCalledWith('Los datos no son válidos.'));
		expect(await screen.findByText('El SKU ya está en uso.')).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('se cierra cuando el guardado resuelve', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const { onClose } = renderModal(onSubmit);

		fireEvent.click(screen.getByRole('button', { name: /Actualizar producto/i }));

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(toastError).not.toHaveBeenCalled();
	});
});
