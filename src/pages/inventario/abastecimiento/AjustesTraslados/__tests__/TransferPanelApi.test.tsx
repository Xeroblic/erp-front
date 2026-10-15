import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import { inventoryStockEnvelope } from '@/mocks/db/procurement.db';

/**
 * El traslado contra la API real (`VITE_INVENTORY_TRANSFERS_USE_MOCKS` apagada),
 * con `ApiService` sustituido por un backend que responde por URL. Cubre lo que
 * el mock no reproduce: bodegas inactivas, el cuerpo y la clave del POST, y la
 * forma real de los rechazos.
 */
const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: true,
		isMultiLocation: true,
		isLoading: false,
	}),
}));
vi.mock('@/config/inventoryStock.config', () => ({ default: true }));
vi.mock('@/config/inventoryAdjustments.config', () => ({ default: false }));
vi.mock('@/config/inventoryTransfers.config', () => ({ default: false }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 2 }),
}));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
	motion: {
		section: ({
			children,
			className,
			'aria-labelledby': labelledBy,
		}: {
			children: ReactNode;
			className?: string;
			'aria-labelledby'?: string;
		}) => (
			<section className={className} aria-labelledby={labelledBy}>
				{children}
			</section>
		),
	},
}));
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		'aria-label': ariaLabel,
		isDisabled,
		options,
		value,
		onChange,
		placeholder,
	}: {
		'aria-label'?: string;
		isDisabled?: boolean;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
		placeholder?: string;
	}) => (
		<select
			aria-label={ariaLabel}
			disabled={isDisabled}
			value={value?.value ?? ''}
			onChange={(event) => {
				const selected =
					options?.find((option) => option.value === event.target.value) ?? null;
				onChange?.(selected);
			}}>
			<option value=''>{placeholder}</option>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
}));

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product', 'edit-product', 'view-warehouse'] as string[],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});

interface IRequest {
	url: string;
	method: string;
	params?: Record<string, unknown>;
	data?: unknown;
	headers?: Record<string, string>;
}

/** Mismo envoltorio que un rechazo de Axios: lo lee `resolveProcurementError`. */
const apiError = (status: number, data: Record<string, unknown>) =>
	Object.assign(new Error(String(data.message)), {
		isAxiosError: true,
		response: { status, data },
	});

const WAREHOUSES = [
	{ id: 8, name: 'Bodega Central', is_active: true },
	{ id: 12, name: 'Bodega Vieja', is_active: false },
];

const MOVEMENT = {
	id: '9c6f6b0a-2f7b-4b7a-9b3e-6f9b8a1c2d3e',
	operation_type: 'warehouse_stock_placement',
	branch_id: 4,
	from_warehouse_id: null,
	to_warehouse_id: 8,
	reason: 'Ubicar productos del conteo inicial',
	global_stock_delta: 0,
	created_at: '2026-09-23T10:15:00-04:00',
	items: [
		{
			product_id: 31,
			quantity: 5,
			condition: 'fit',
			origin_quantity_after: 8,
			// El destino arrastraba -2: las unidades taparon primero ese hueco.
			destination_quantity_after: 3,
		},
	],
};

/** Backend por URL. `move` decide la respuesta del POST; por omisión, el 201. */
const installBackend = (
	move: (request: IRequest) => Promise<unknown> = () =>
		Promise.resolve({ data: { data: MOVEMENT } }),
	warehouses: () => Promise<unknown> = () =>
		Promise.resolve({ data: { data: WAREHOUSES, meta: { current_page: 1, last_page: 1 } } }),
) => {
	fetchData.mockImplementation((request: IRequest) => {
		if (request.url === '/branches/4/warehouses') return warehouses();
		if (request.url === '/branches/4/inventory-stock')
			return Promise.resolve({ data: inventoryStockEnvelope });
		if (request.url === '/branches/4/warehouse-stock-movements') return move(request);
		return Promise.reject(new Error(`Ruta no esperada: ${request.method} ${request.url}`));
	});
};

const renderPage = () => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={['/?tab=traslado']}>
				<AjustesTrasladosView />
			</MemoryRouter>
		</Provider>,
	);
};

const optionNames = (select: HTMLElement) =>
	within(select)
		.getAllByRole('option')
		.map((option) => option.textContent);

const clickNext = async () => {
	const button = screen.getByRole('button', { name: 'Siguiente' });
	await waitFor(() => expect(button).toBeEnabled());
	fireEvent.click(button);
};

/** Sin ubicación → Bodega Central, una línea de 5 aptos del mouse y el motivo. */
const fillTransfer = async () => {
	fireEvent.change(await screen.findByLabelText('Origen'), { target: { value: 'unlocated' } });
	fireEvent.change(screen.getByLabelText('Destino'), { target: { value: 'warehouse:8' } });
	await clickNext();
	const product = await screen.findByLabelText('Producto de la línea 1');
	await waitFor(() =>
		expect(within(product).getByRole('option', { name: /Mouse USB/ })).toBeInTheDocument(),
	);
	fireEvent.change(product, { target: { value: '31' } });
	fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), { target: { value: '5' } });
	await clickNext();
	fireEvent.change(await screen.findByLabelText('Motivo'), {
		target: { value: 'Ubicar productos del conteo inicial' },
	});
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Registrar traslado' }));

afterEach(() => {
	fetchData.mockReset();
});

describe('Traslados internos contra la API real', () => {
	it('ofrece una bodega inactiva sólo como origen', async () => {
		installBackend();
		renderPage();

		const origin = await screen.findByLabelText('Origen');
		expect(optionNames(origin)).toContain('Bodega Vieja (inactiva)');
		expect(optionNames(screen.getByLabelText('Destino'))).not.toContain('Bodega Vieja');
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
	});

	it('envía el traslado con su clave y muestra los saldos del destino aunque arrastrara negativo', async () => {
		installBackend();
		renderPage();
		await fillTransfer();
		submit();

		const table = await screen.findByRole('table', { name: 'Saldos después del traslado' });
		const post = fetchData.mock.calls
			.map((call: unknown[]) => call[0] as IRequest)
			.find((request) => request.method === 'post');
		expect(post).toMatchObject({
			url: '/branches/4/warehouse-stock-movements',
			data: {
				from_warehouse_id: null,
				to_warehouse_id: 8,
				reason: 'Ubicar productos del conteo inicial',
				items: [{ product_id: 31, quantity: 5, condition: 'fit' }],
			},
		});
		expect(post?.headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
		const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
		expect(cells[4]).toHaveTextContent('3');
		expect(screen.getByText(/El destino tenía saldo negativo/)).toBeInTheDocument();
	});

	it('cita las unidades sin procedencia del 409 en vez de un «no alcanza» genérico', async () => {
		installBackend(() =>
			Promise.reject(
				apiError(409, {
					message: 'La ubicación de origen no tiene stock suficiente con procedencia.',
					code: 'INSUFFICIENT_LOCATION_STOCK',
					context: {
						requested: 5,
						available: 2,
						branch_id: 4,
						warehouse_id: null,
						condition: 'fit',
						origin_id: null,
						unattributed_quantity: 3,
					},
				}),
			),
		);
		renderPage();
		await fillTransfer();
		submit();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent(
			'Hay 3 unidades sin procedencia registrada en el origen, que el traslado todavía no puede mover.',
		);
		expect(
			screen.queryByRole('table', { name: 'Saldos después del traslado' }),
		).not.toBeInTheDocument();
	});

	it('explica el 409 de una sola ubicación y no ofrece reenviar el traslado', async () => {
		installBackend(() =>
			Promise.reject(
				apiError(409, {
					message: 'Esta filial todavía opera con una sola ubicación.',
					code: 'MULTI_LOCATION_NOT_ENABLED',
				}),
			),
		);
		renderPage();
		await fillTransfer();
		submit();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Esta filial todavía opera con una sola ubicación.');
		expect(alert).toHaveTextContent(
			'el stock vive en «Sin ubicación», que es de donde salen las ventas. Los traslados se habilitan cuando la sucursal opere con varias ubicaciones.',
		);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Registrar traslado' })).toBeDisabled(),
		);
		expect(
			screen.queryByRole('button', { name: 'Reintentar traslado' }),
		).not.toBeInTheDocument();
	});

	it('marca el destino y la línea con los errores del 422', async () => {
		installBackend(() =>
			Promise.reject(
				apiError(422, {
					message: 'Los datos enviados no son válidos.',
					errors: {
						to_warehouse_id: ['La bodega de destino está inactiva.'],
						'items.0.quantity': ['La cantidad supera el saldo de la línea.'],
					},
				}),
			),
		);
		renderPage();
		await fillTransfer();
		submit();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('El origen o el destino no son válidos');
		expect(alert).toHaveTextContent('Una línea tiene errores');

		fireEvent.click(within(alert).getByRole('button', { name: 'Revisar productos' }));
		expect(
			await screen.findByText('La cantidad supera el saldo de la línea.'),
		).toBeInTheDocument();
	});

	it('explica el 403 del listado de bodegas y permite reintentar', async () => {
		let denied = true;
		installBackend(undefined, () =>
			denied
				? Promise.reject(
						apiError(403, { message: 'No tienes permiso para ver las bodegas.' }),
					)
				: Promise.resolve({ data: { data: WAREHOUSES, meta: { last_page: 1 } } }),
		);
		renderPage();

		expect(await screen.findByText('No pudimos cargar las bodegas')).toBeInTheDocument();
		expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument();

		denied = false;
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(await screen.findByLabelText('Origen')).toBeInTheDocument();
	});
});
