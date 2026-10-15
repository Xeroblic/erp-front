import type { PropsWithChildren } from 'react';
import { configureStore, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { Provider, useDispatch } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import transfersReducer, { createTransfer } from '@/store/slices/transfers/transfersSlice';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { ICreateTransferRequest } from '@/interface/transfers.interface';
import type { RootState } from '@/store/rootReducer';
import {
	TRANSFER_FORBIDDEN_MESSAGE,
	TRANSFER_SERVER_ERROR_MESSAGE,
	TRANSFER_VALIDATION_MESSAGE,
} from '@/utils/transferErrors.util';
import CreateEditTransferModal from '../CreateEditTransferModal';

const { fetchData, onRejected } = vi.hoisted(() => ({ fetchData: vi.fn(), onRejected: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
// La sucursal activa (origen) es la 1.
vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: () => 1,
}));
// Catálogos del formulario: un producto con stock y ninguna bodega.
vi.mock('@/store/slices/products/productsSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return {
		fetchProductsList: createAsyncThunk('test/products', () => ({
			items: [{ id: 31, name: 'Cable HDMI', sku: 'SKU-1', stock: 5, serial_tracking: false }],
		})),
	};
});
vi.mock('@/store/slices/warehouses/warehouseSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return { fetchWarehouses: createAsyncThunk('test/warehouses', () => ({ items: [] })) };
});
vi.mock('@/store/slices/sucursales/sucursalesSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return { fetchMisSucursales: createAsyncThunk('test/branches', () => []) };
});
// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

interface ISelectStubProps {
	name: string;
	options?: TSelectOption[];
	value?: TSelectOption | null;
	onChange?: (option: TSelectOption | null) => void;
	isDisabled?: boolean;
}

// react-select no se deja operar con `fireEvent`: un <select> nativo con las mismas opciones.
vi.mock('@/components/form/SelectReact', () => ({
	default: ({ name, options = [], value, onChange, isDisabled }: ISelectStubProps) => (
		<select
			aria-label={name}
			value={value?.value ?? ''}
			disabled={isDisabled}
			onChange={(event) =>
				onChange?.(options.find((option) => option.value === event.target.value) ?? null)
			}>
			<option value=''>—</option>
			{options.map((option) => (
				<option key={option.value} value={option.value} disabled={option.isDisabled}>
					{option.label}
				</option>
			))}
		</select>
	),
}));

const store = () =>
	configureStore({
		reducer: {
			transferencias: transfersReducer,
			auth: () => ({ loading: false, user: null }),
			sucursales: () => ({
				lista: [
					{ id: 1, branch_name: 'Casa matriz' },
					{ id: 2, branch_name: 'Sucursal Norte' },
				],
				loading: false,
			}),
		},
	});

// El thunk tipa `getState` como `RootState`; el store de la prueba sólo monta lo que el modal lee.
type TDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

/** Como `TransferenciasAdmin`: envía con el thunk real y deja que el modal maneje el rechazo. */
const Host = () => {
	const dispatch = useDispatch<TDispatch>();
	const handleSubmit = async (payload: ICreateTransferRequest) => {
		try {
			await dispatch(createTransfer(payload)).unwrap();
		} catch (error: unknown) {
			onRejected(error);
			throw error;
		}
	};
	return <CreateEditTransferModal isOpen onClose={vi.fn()} onSubmit={handleSubmit} />;
};

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

const fillAndSubmit = async () => {
	render(
		<Provider store={store()}>
			<Host />
		</Provider>,
	);
	fireEvent.change(screen.getByLabelText('to_branch_id'), { target: { value: '2' } });
	const product = screen.getByLabelText('items.0.product_id');
	await waitFor(() => expect(product).not.toBeDisabled());
	fireEvent.change(product, { target: { value: '31' } });
	fireEvent.click(screen.getByRole('button', { name: 'Crear transferencia' }));
	await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1));
	return screen.findByRole('alert');
};

const submitButton = () => screen.getByRole('button', { name: 'Crear transferencia' });

afterEach(() => {
	vi.clearAllMocks();
});

describe('CreateEditTransferModal — errores del envío', () => {
	it('403: pide acceso a la sucursal de destino y no deja reintentar a ella', async () => {
		fetchData.mockRejectedValueOnce(
			axiosError(403, { message: 'This action is unauthorized.' }),
		);

		const alert = await fillAndSubmit();

		expect(alert).toHaveTextContent(TRANSFER_FORBIDDEN_MESSAGE);
		expect(screen.queryByText('This action is unauthorized.')).not.toBeInTheDocument();
		expect(submitButton()).toBeDisabled();
		expect(screen.getByRole('option', { name: 'Sucursal Norte (sin acceso)' })).toBeDisabled();
	});

	it('422 de negocio: muestra su mensaje tal cual y permite corregir y reenviar', async () => {
		const message = 'Stock insuficiente para el producto SKU-1. Disponible: 2, requerido: 5';
		fetchData.mockRejectedValueOnce(axiosError(422, { success: false, message }));

		const alert = await fillAndSubmit();

		expect(onRejected).toHaveBeenCalledWith({
			status: 422,
			kind: 'business',
			message,
			fieldErrors: null,
		});
		expect(alert).toHaveTextContent(message);
		expect(submitButton()).not.toBeDisabled();
	});

	it('422 de validación: cada `errors.*` aparece bajo su campo', async () => {
		fetchData.mockRejectedValueOnce(
			axiosError(422, {
				message:
					'Solo se traslada stock entre sucursales de la misma filial. (and 1 more error)',
				errors: {
					to_branch_id: ['Solo se traslada stock entre sucursales de la misma filial.'],
					to_warehouse_id: ['La bodega destino no pertenece a la sucursal destino.'],
				},
			}),
		);

		const alert = await fillAndSubmit();

		expect(alert).toHaveTextContent(TRANSFER_VALIDATION_MESSAGE);
		expect(
			await screen.findByText('Solo se traslada stock entre sucursales de la misma filial.'),
		).toBeInTheDocument();
		expect(
			screen.getByText('La bodega destino no pertenece a la sucursal destino.'),
		).toBeInTheDocument();
	});

	it('500: mensaje genérico, sin el cuerpo técnico del servidor', async () => {
		fetchData.mockRejectedValueOnce(
			axiosError(500, { message: 'SQLSTATE[23000]: Integrity constraint violation' }),
		);

		const alert = await fillAndSubmit();

		expect(alert).toHaveTextContent(TRANSFER_SERVER_ERROR_MESSAGE);
		expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
	});
});
