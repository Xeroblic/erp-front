import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { ICreateTransferRequest } from '@/interface/transfers.interface';
import type { ISubsidiaryRolloutStage } from '@/hooks/useSubsidiaryRolloutStage';
import {
	FROM_LOCATION_REQUIRED_MESSAGE,
	TO_LOCATION_REQUIRED_MESSAGE,
} from '../../../types/transfers.types';
import CreateEditTransferModal from '../CreateEditTransferModal';

const { rolloutStage } = vi.hoisted(() => ({
	rolloutStage: {
		multiLocationEnabled: false,
		isMultiLocation: false,
		isLoading: false,
	} as ISubsidiaryRolloutStage,
}));

vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => rolloutStage,
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
// La sucursal activa (origen) es la 1.
vi.mock('@/store/selectors/branchSelectors', () => ({ default: () => 1 }));
vi.mock('@/store/slices/products/productsSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return {
		fetchProductsList: createAsyncThunk('test/products', () => ({
			items: [{ id: 31, name: 'Cable HDMI', sku: 'SKU-1', stock: 5, serial_tracking: false }],
		})),
	};
});
// Cada sucursal tiene una bodega activa y una inactiva.
vi.mock('@/store/slices/warehouses/warehouseSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return {
		fetchWarehouses: createAsyncThunk(
			'test/warehouses',
			({ branchId }: { branchId: number }) =>
				branchId === 1
					? {
							items: [
								{ id: 11, name: 'Mesón', is_active: true },
								{ id: 12, name: 'Bodega vieja', is_active: false },
							],
						}
					: {
							items: [
								{ id: 21, name: 'Central Norte', is_active: true },
								{ id: 22, name: 'Norte cerrada', is_active: false },
							],
						},
		),
	};
});
vi.mock('@/store/slices/sucursales/sucursalesSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit');
	return { fetchMisSucursales: createAsyncThunk('test/branches', () => []) };
});
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
			// `Button` lee el usuario para sus permisos.
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

const onSubmit = vi.fn<(payload: ICreateTransferRequest) => Promise<void>>();

const setStage = (isMultiLocation: boolean) => {
	Object.assign(rolloutStage, {
		multiLocationEnabled: isMultiLocation,
		isMultiLocation,
		isLoading: false,
	});
};

const optionLabels = (selectName: string) =>
	within(screen.getByLabelText(selectName))
		.getAllByRole('option')
		.map((option) => option.textContent);

/** Elige la sucursal destino y un producto; deja las bodegas a cargo de cada prueba. */
const openWithDestination = async () => {
	render(
		<Provider store={store()}>
			<CreateEditTransferModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />
		</Provider>,
	);
	await waitFor(() => expect(optionLabels('from_warehouse_id')).toContain('Mesón'));
	fireEvent.change(screen.getByLabelText('to_branch_id'), { target: { value: '2' } });
	await waitFor(() => expect(optionLabels('to_warehouse_id')).toContain('Central Norte'));
	const product = screen.getByLabelText('items.0.product_id');
	await waitFor(() => expect(product).not.toBeDisabled());
	fireEvent.change(product, { target: { value: '31' } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Crear transferencia' }));

beforeEach(() => {
	onSubmit.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.clearAllMocks();
	setStage(false);
});

describe('CreateEditTransferModal — etapa 2 (ubicaciones)', () => {
	beforeEach(() => setStage(true));

	it('ofrece «Sin ubicación» en los dos selectores y la envía como null', async () => {
		await openWithDestination();

		expect(optionLabels('from_warehouse_id')).toContain('Sin ubicación');
		expect(optionLabels('to_warehouse_id')).toContain('Sin ubicación');

		fireEvent.change(screen.getByLabelText('from_warehouse_id'), {
			target: { value: 'unlocated' },
		});
		fireEvent.change(screen.getByLabelText('to_warehouse_id'), {
			target: { value: 'unlocated' },
		});
		submit();

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		const payload = onSubmit.mock.calls[0][0];
		expect(payload).toHaveProperty('from_warehouse_id', null);
		expect(payload).toHaveProperty('to_warehouse_id', null);
	});

	it('envía la bodega elegida en cada lado', async () => {
		await openWithDestination();

		fireEvent.change(screen.getByLabelText('from_warehouse_id'), {
			target: { value: '12' },
		});
		fireEvent.change(screen.getByLabelText('to_warehouse_id'), {
			target: { value: 'unlocated' },
		});
		submit();

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0][0]).toMatchObject({
			from_warehouse_id: 12,
			to_warehouse_id: null,
		});
	});

	it('no envía si alguna ubicación quedó sin elegir', async () => {
		await openWithDestination();

		submit();

		expect(await screen.findByText(FROM_LOCATION_REQUIRED_MESSAGE)).toBeInTheDocument();
		expect(screen.getByText(TO_LOCATION_REQUIRED_MESSAGE)).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('el destino no ofrece bodegas inactivas; el origen sí, rotuladas', async () => {
		await openWithDestination();

		expect(optionLabels('to_warehouse_id')).not.toContain('Norte cerrada');
		expect(optionLabels('from_warehouse_id')).toContain('Bodega vieja (inactiva)');
	});

	it('no deja elegir bodega ni enviar mientras la etapa de la filial se está leyendo', async () => {
		Object.assign(rolloutStage, {
			multiLocationEnabled: null,
			isMultiLocation: false,
			isLoading: true,
		});
		await openWithDestination();

		expect(screen.getByLabelText('from_warehouse_id')).toBeDisabled();
		expect(screen.getByLabelText('to_warehouse_id')).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Crear transferencia' })).toBeDisabled();
	});
});

describe('CreateEditTransferModal — etapa 1 (sin cambios)', () => {
	it('omite las bodegas no elegidas y no ofrece «Sin ubicación»', async () => {
		await openWithDestination();

		expect(optionLabels('from_warehouse_id')).not.toContain('Sin ubicación');
		expect(optionLabels('to_warehouse_id')).not.toContain('Sin ubicación');

		submit();

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		const payload = onSubmit.mock.calls[0][0];
		expect(payload.from_warehouse_id).toBeUndefined();
		expect(payload.to_warehouse_id).toBeUndefined();
	});

	it('lista todas las bodegas, sin rótulo de inactiva', async () => {
		await openWithDestination();

		expect(optionLabels('to_warehouse_id')).toContain('Norte cerrada');
		expect(optionLabels('from_warehouse_id')).toContain('Bodega vieja');
	});
});
