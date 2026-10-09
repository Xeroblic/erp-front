import type { PropsWithChildren } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import productStock from '@/store/slices/products/productStockSlice';
import StockSeriesModal from '@/pages/catalogos/productos/components/modals/StockSeriesModal';
import type { IProduct } from '@/interface/product.interface';

const { fetchData, toastError, toastSuccess } = vi.hoisted(() => ({
	fetchData: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/utils/toast.utils', () => ({
	default: { error: toastError, success: toastSuccess, info: vi.fn(), warning: vi.fn() },
}));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
// El multiselect de series no aporta a estas pruebas: se eligen por su casilla.
vi.mock('@/components/form/SelectReact', () => ({ default: () => null }));
// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
}));

const auth = createSlice({
	name: 'auth',
	initialState: {
		user: {
			id: 1,
			branch: { id: 5 },
			access: { branches: [] },
			visible: {
				branches: [
					{ id: 5, name: 'Sucursal Centro', subsidiary: { id: 2, name: 'Filial' } },
					{ id: 6, name: 'Sucursal Norte', subsidiary: { id: 2, name: 'Filial' } },
					{ id: 9, name: 'Sucursal Ajena', subsidiary: { id: 3, name: 'Otra filial' } },
				],
			},
		},
	},
	reducers: {},
});

const product = { id: 7, name: 'Notebook', children: [] } as unknown as IProduct;

const renderModal = () => {
	const store = configureStore({ reducer: { productStock, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<StockSeriesModal isOpen onClose={vi.fn()} product={product} subsidiaryId={2} />
		</Provider>,
	);
};

afterEach(() => {
	fetchData.mockReset();
	toastError.mockReset();
	toastSuccess.mockReset();
});

describe('StockSeriesModal — sucursal de destino', () => {
	it('ofrece sólo las sucursales del usuario en la filial y muestra el 403 del backend', async () => {
		fetchData.mockImplementation((request: { url: string; method: string }) => {
			if (request.method === 'get')
				return Promise.resolve({
					data: {
						data: [
							{ serial_number: 'SN-1', current_status: 'available', branch_id: null },
						],
					},
				});
			// Mismo envoltorio que un rechazo de Axios: un Error con `response`.
			return Promise.reject(
				Object.assign(new Error('Request failed with status code 403'), {
					response: {
						status: 403,
						data: { message: 'No tienes permiso para realizar esta acción.' },
					},
				}),
			);
		});
		renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Asignar a Sucursal' }));
		const branchSelect = screen.getByRole('combobox');
		const names = within(branchSelect)
			.getAllByRole('option')
			.map((option) => option.textContent);
		expect(names).toEqual([
			'-- Seleccione una sucursal --',
			'Sucursal Centro',
			'Sucursal Norte',
		]);
		// Abre con la sucursal principal del usuario elegida.
		expect(branchSelect).toHaveValue('5');

		fireEvent.click(await screen.findByRole('checkbox'));
		fireEvent.click(screen.getByRole('button', { name: /Asignar Seleccionadas \(1\)/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith('No tienes permiso para realizar esta acción.'),
		);
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/subsidiaries/2/products/7/assign-stock',
				data: expect.objectContaining({ branch_id: 5 }),
			}),
		);
		expect(toastSuccess).not.toHaveBeenCalled();
	});
});
