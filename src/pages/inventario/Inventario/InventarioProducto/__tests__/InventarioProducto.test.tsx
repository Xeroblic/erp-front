import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryOverview from '@/store/slices/procurement/inventoryOverviewSlice';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import InventarioProductoView from '@/pages/inventario/Inventario/InventarioProducto/InventarioProductoView';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';
import { resetStockReceiptsStoreForTests } from '@/services/procurement/stockReceipts.service';
import { resetInventoryCriticalThresholdsForTests } from '@/services/procurement/inventoryOverview.service';
import { clearAllPersistedMockState } from '@/services/procurement/procurementMockPersistence.util';

const context = vi.hoisted(() => ({
	branchId: 4 as number | null,
	subsidiaryId: 2,
	visibleBranches: [] as { id: number; name: string }[],
	enabled: true,
}));
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return context.enabled;
	},
}));
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => context }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
/** `DocumentInitialStockModal` usa `SelectReact`: se reemplaza por `<select>` nativo. */
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		inputId,
		options,
		value,
		onChange,
		placeholder,
	}: {
		inputId?: string;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
		placeholder?: string;
	}) => (
		<select
			id={inputId}
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

const MOUSE_ID = 31;
const CABLE_ID = 58;

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product', 'edit-product', 'view-purchase-document'],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }, { id: 6 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {
		grant(state, action: { payload: string }) {
			state.user.permisos.push(action.payload);
		},
	},
});

const renderFicha = (productId: number | string, permisos: string[] = []) => {
	const store = configureStore({
		reducer: { inventoryOverview, inventoryStock, auth: auth.reducer },
	});
	permisos.forEach((permiso) => store.dispatch(auth.actions.grant(permiso)));
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[`/inventario/stock/${productId}`]}>
				<Routes>
					<Route
						path='/inventario/stock/:productId'
						element={<InventarioProductoView />}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

/** Valor de un KPI: la etiqueta y la cifra son dos párrafos hermanos. */
const kpi = async (label: string) =>
	(await screen.findByText(label, { selector: 'p' })).nextElementSibling;

const ubicaciones = () => screen.getByRole('table', { name: 'Unidades por ubicación' });

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
	// Los modales se montan en `#portal-root` (`Portal.tsx`).
	const portalRoot = document.createElement('div');
	portalRoot.id = 'portal-root';
	document.body.appendChild(portalRoot);
});
afterEach(() => {
	document.getElementById('portal-root')?.remove();
	// La trazabilidad lee las recepciones: su worker simulado no debe sobrevivir a la prueba.
	resetStockReceiptsStoreForTests();
	resetInventoryStockStoreForTests();
	resetInventoryCriticalThresholdsForTests();
	clearAllPersistedMockState('inventory-critical-thresholds');
	vi.restoreAllMocks();
});

describe('Ficha de inventario', () => {
	it('rechaza un enlace a un producto inválido sin consultar', () => {
		renderFicha('abc');
		expect(screen.getByText('Producto inválido')).toBeInTheDocument();
	});

	it('resume en KPI lo que hay, lo vendible y lo que falta', async () => {
		renderFicha(MOUSE_ID);

		expect(await kpi('En la sucursal')).toHaveTextContent('19');
		expect(await kpi('Disponibles para vender')).toHaveTextContent('1');
		expect(await kpi('Reservadas')).toHaveTextContent('16');
		expect(await kpi('No vendibles')).toHaveTextContent('2');
		expect(await kpi('Sin documento de compra')).toHaveTextContent('5');
		expect(screen.getByText('Bajo el umbral')).toBeInTheDocument();
		expect(screen.getByText('Avisa con 10 unidades o menos')).toBeInTheDocument();
		// Precio en pesos, sin decimales.
		expect(screen.getByText('$7.990')).toBeInTheDocument();
		expect(within(ubicaciones()).getAllByRole('row')).toHaveLength(3);
	});

	it('las procedencias se ven por ubicación y se puede cambiar de ubicación', async () => {
		renderFicha(MOUSE_ID);
		const region = await screen.findByRole('region', { name: 'Procedencias del producto' });
		await within(region).findByText('Recepción #80');
		expect(within(region).getByRole('button', { name: 'Documentar' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Estante A3 · 4' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Estante A3 · 4' })).toHaveAttribute(
				'aria-pressed',
				'true',
			),
		);
		const shelf = await screen.findByRole('region', { name: 'Procedencias del producto' });
		await waitFor(() =>
			expect(
				within(shelf).queryByRole('button', { name: 'Documentar' }),
			).not.toBeInTheDocument(),
		);
	});

	it('cambiar el umbral actualiza el estado; vaciarlo lo desactiva', async () => {
		renderFicha(MOUSE_ID);
		fireEvent.click(await screen.findByRole('button', { name: 'Cambiar umbral' }));
		const dialog = await screen.findByRole('dialog');

		fireEvent.change(within(dialog).getByLabelText('Umbral (unidades)'), {
			target: { value: '2,5' },
		});
		fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar umbral' }));
		expect(
			await within(dialog).findByText('Ingresa un número entero, sin decimales ni signos.'),
		).toBeInTheDocument();

		fireEvent.change(within(dialog).getByLabelText('Umbral (unidades)'), {
			target: { value: '' },
		});
		// `Button` bloquea unos milisegundos tras cada clic (guarda anti doble clic).
		const guardar = within(dialog).getByRole('button', { name: 'Guardar umbral' });
		await waitFor(() => expect(guardar).toBeEnabled());
		fireEvent.click(guardar);

		await screen.findByText('Sin umbral: no avisa cuando se agota');
		expect(screen.getByText('Sin umbral')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Definir umbral' })).toBeInTheDocument();
	});

	it('documentar respalda unidades y la ficha vuelve a pedir sus totales', async () => {
		renderFicha(CABLE_ID);
		expect(await kpi('Sin documento de compra')).toHaveTextContent('100');
		// Sin reservas ni no vendibles, esos KPI no aparecen.
		expect(screen.queryByText('Reservadas', { selector: 'p' })).not.toBeInTheDocument();
		expect(screen.queryByText('No vendibles', { selector: 'p' })).not.toBeInTheDocument();

		const region = await screen.findByRole('region', { name: 'Procedencias del producto' });
		fireEvent.click(await within(region).findByRole('button', { name: 'Documentar' }));
		const dialog = await screen.findByRole('dialog', { name: 'Documentar stock inicial' });
		// El picker carga los documentos confirmados de forma asíncrona.
		await within(dialog).findByRole('option', { name: '7788 · Sin proveedor' });
		fireEvent.change(within(dialog).getByLabelText('Documento confirmado'), {
			target: { value: '90' },
		});
		await within(dialog).findByLabelText('Línea del documento');
		fireEvent.change(within(dialog).getByLabelText('Línea del documento'), {
			target: { value: '950' },
		});
		fireEvent.change(within(dialog).getByLabelText('Cantidad a documentar'), {
			target: { value: '10' },
		});
		fireEvent.change(within(dialog).getByLabelText('Motivo'), {
			target: { value: 'Factura llegó con retraso, respaldo parcial del conteo inicial.' },
		});
		fireEvent.click(within(dialog).getByRole('button', { name: 'Documentar' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await waitFor(async () =>
			expect(await kpi('Sin documento de compra')).toHaveTextContent('90'),
		);
		expect(await screen.findByText('Boleta #7788')).toBeInTheDocument();
	});

	describe('Trazabilidad', () => {
		it('con `view-inventory-movements` muestra las operaciones del producto', async () => {
			renderFicha(MOUSE_ID, ['view-inventory-movements']);

			const table = await screen.findByRole('table', { name: 'Trazabilidad' });

			expect(await within(table).findByText('Saldo inicial')).toBeInTheDocument();
			expect(within(table).getByText('Recepción #80')).toBeInTheDocument();
		});

		it('sin el permiso la ficha no muestra la trazabilidad', async () => {
			renderFicha(MOUSE_ID);

			await screen.findByRole('table', { name: 'Unidades por ubicación' });
			expect(screen.queryByRole('table', { name: 'Trazabilidad' })).not.toBeInTheDocument();
		});
	});
});
