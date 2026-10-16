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

const serializedProduct = {
	id: 7,
	name: 'Notebook',
	serial_tracking: true,
	children: [],
} as unknown as IProduct;

/** Mismo envoltorio que un rechazo de Axios: un Error con `response`. */
const axiosRejection = (status: number, data: Record<string, unknown>) =>
	Promise.reject(
		Object.assign(new Error(`Request failed with status code ${status}`), {
			response: { status, data },
		}),
	);

const FORBIDDEN_BODY = { message: 'No tienes permiso para realizar esta acción.' };

/** Series disponibles en la sucursal indicada (`null` = Bodega Central) y el rechazo del POST. */
const mockSeriesAndRejection = (branchId: number | null, rejection: () => Promise<never>) =>
	fetchData.mockImplementation((request: { method: string }) =>
		request.method === 'get'
			? Promise.resolve({
					data: {
						data: [
							{
								serial_number: 'SN-1',
								current_status: 'available',
								branch_id: branchId,
								branch_name: branchId ? 'Sucursal Centro' : undefined,
							},
						],
					},
				})
			: rejection(),
	);

const renderModal = (product: IProduct = serializedProduct) => {
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
	it('ofrece sólo las sucursales del usuario en la filial y explica el 403 por el destino', async () => {
		mockSeriesAndRejection(null, () => axiosRejection(403, FORBIDDEN_BODY));
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
			expect(toastError).toHaveBeenCalledWith(
				'No tienes permiso para asignar este stock: necesitas acceso a la sucursal de destino (Sucursal Centro).',
			),
		);
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/subsidiaries/2/products/7/assign-stock',
				data: expect.objectContaining({ branch_id: 5 }),
			}),
		);
		expect(toastSuccess).not.toHaveBeenCalled();
	});

	it('al asignar un producto sin serie, el 403 pide también la sucursal del producto', async () => {
		mockSeriesAndRejection(null, () => axiosRejection(403, FORBIDDEN_BODY));
		renderModal({ ...serializedProduct, serial_tracking: false });

		fireEvent.click(screen.getByRole('button', { name: 'Asignar a Sucursal' }));
		fireEvent.click(await screen.findByRole('checkbox'));
		fireEvent.click(screen.getByRole('button', { name: /Asignar Seleccionadas \(1\)/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(
				'No tienes permiso para asignar este stock: necesitas acceso a la sucursal de destino (Sucursal Centro) y a la sucursal del producto, de la que sale el stock.',
			),
		);
	});

	it('muestra el motivo de la línea del 422 de asignar, no el mensaje genérico', async () => {
		mockSeriesAndRejection(null, () =>
			axiosRejection(422, {
				success: false,
				message: 'Valide la disponibilidad del inventario.',
				errors: ["La línea nombra el producto #8, que no es 'Notebook'."],
			}),
		);
		renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Asignar a Sucursal' }));
		fireEvent.click(await screen.findByRole('checkbox'));
		fireEvent.click(screen.getByRole('button', { name: /Asignar Seleccionadas \(1\)/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(
				"La línea nombra el producto #8, que no es 'Notebook'.",
			),
		);
		expect(toastSuccess).not.toHaveBeenCalled();
	});
});

describe('StockSeriesModal — devolver a la Bodega Central', () => {
	it('explica el 403 por la sucursal de la que salen las series', async () => {
		mockSeriesAndRejection(5, () => axiosRejection(403, FORBIDDEN_BODY));
		renderModal();

		fireEvent.click(await screen.findByRole('checkbox'));
		fireEvent.click(screen.getByRole('button', { name: /Devolver Seleccionadas \(1\)/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(
				'No tienes permiso para devolver estas series a la filial: necesitas acceso a la sucursal de la que salen (Sucursal Centro).',
			),
		);
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/subsidiaries/2/products/7/unassign-stock',
				data: expect.objectContaining({ branch_id: 5 }),
			}),
		);
		// Sin reintento automático: un único POST.
		const posts = fetchData.mock.calls.filter(
			(call: unknown[]) => (call[0] as { method?: string } | undefined)?.method === 'post',
		);
		expect(posts).toHaveLength(1);
		expect(toastSuccess).not.toHaveBeenCalled();
	});

	it('un rechazo que no es 403 conserva el mensaje del backend', async () => {
		mockSeriesAndRejection(5, () =>
			axiosRejection(422, {
				message: 'The given data was invalid.',
				errors: {
					confirm: ['Debe confirmar que las series serán devueltas a la subsidiaria.'],
				},
			}),
		);
		renderModal();

		fireEvent.click(await screen.findByRole('checkbox'));
		fireEvent.click(screen.getByRole('button', { name: /Devolver Seleccionadas \(1\)/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith(
				'Debe confirmar que las series serán devueltas a la subsidiaria.',
			),
		);
	});
});
