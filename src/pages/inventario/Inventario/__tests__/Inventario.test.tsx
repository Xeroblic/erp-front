import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryOverview from '@/store/slices/procurement/inventoryOverviewSlice';
import InventarioView from '@/pages/inventario/Inventario/InventarioView';
import * as service from '@/services/procurement/inventoryOverview.service';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';
import type { IInventoryOverviewResponse } from '@/interface/inventoryOverview.interface';

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
/** Mismo shim que el resto de abastecimiento: `SelectReact` como `<select>` nativo. */
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

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product'],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }, { id: 6 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {
		deny(state) {
			state.user.permisos = [];
		},
	},
});

const LocationProbe = () => {
	const location = useLocation();
	return <div data-testid='location'>{`${location.pathname}${location.search}`}</div>;
};

const renderPage = (path = '/inventario/stock') => {
	const store = configureStore({ reducer: { inventoryOverview, auth: auth.reducer } });
	const tree = () => (
		<Provider store={store}>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route path='/inventario/stock' element={<InventarioView />} />
					<Route path='/inventario/stock/bodegas/:bodegaId' element={<p>Bodega</p>} />
					<Route path='/inventario/stock/:productId' element={<p>Ficha</p>} />
				</Routes>
				<LocationProbe />
			</MemoryRouter>
		</Provider>
	);
	const view = render(tree());
	return { ...view, store, update: () => view.rerender(tree()) };
};

const productRows = () =>
	within(screen.getByRole('table', { name: 'Inventario por producto' }))
		.queryAllByRole('button', { name: /Ver ficha de/ })
		.map((row) => row.getAttribute('aria-label')?.replace('Ver ficha de ', ''));

const location = () => screen.getByTestId('location').textContent;

/** La fila de la tabla a la que pertenece un botón «Ver». */
const rowOf = (button: HTMLElement): HTMLElement => {
	const row = button.closest('tr');
	if (!row) throw new Error('El botón no está dentro de una fila.');
	return row;
};

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
});
afterEach(() => {
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Inventario — vista unificada', () => {
	it('no consulta nada ni muestra datos simulados con el flag apagado', async () => {
		context.enabled = false;
		const spy = vi.spyOn(service, 'listInventoryOverview');
		renderPage();

		expect(await screen.findByText('Consulta no habilitada')).toBeInTheDocument();
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
		expect(spy).not.toHaveBeenCalled();
	});

	it('sin permiso de lectura no monta la sesión', () => {
		const page = renderPage();
		act(() => {
			page.store.dispatch(auth.actions.deny());
		});
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});

	it('muestra el reparto por bodega, el disponible y el estado de cada producto', async () => {
		renderPage('/inventario/stock?q=mouse');
		const row = rowOf(await screen.findByRole('button', { name: 'Ver ficha de Mouse USB' }));

		expect(within(row).getByRole('list', { name: 'Unidades por ubicación' })).toHaveTextContent(
			'Sin ubicación15Estante A34',
		);
		expect(within(row).getByText('19')).toBeInTheDocument();
		expect(within(row).getByText('16 reservadas')).toBeInTheDocument();
		expect(within(row).getByText('2 no vendibles')).toBeInTheDocument();
		expect(within(row).getByText('Bajo el umbral')).toBeInTheDocument();
	});

	it('muestra los KPI de la sucursal sin botones de alerta', async () => {
		renderPage();
		const kpi = async (label: string) =>
			(await screen.findByText(label)).parentElement as HTMLElement;
		expect(await kpi('Stock crítico')).toHaveTextContent('1');
		expect(await kpi('Stock total')).toBeInTheDocument();
		expect(await kpi('Sin stock')).toBeInTheDocument();
		expect(screen.queryByRole('list', { name: 'Alertas' })).not.toBeInTheDocument();
	});

	it('Por bodega muestra los agregados y «Ver» abre la ficha de la bodega', async () => {
		renderPage('/inventario/stock?estado=critical');
		fireEvent.click(screen.getByRole('tab', { name: /Por bodega/ }));

		// Entrar a Por bodega limpia los filtros de productos.
		await waitFor(() => expect(location()).toBe('/inventario/stock?vista=bodegas'));
		const bodega = await screen.findByRole('button', { name: 'Ver productos de Estante A3' });
		expect(rowOf(bodega)).toHaveTextContent('1 bajo el umbral');

		fireEvent.click(bodega);

		await waitFor(() => expect(location()).toBe('/inventario/stock/bodegas/12'));
	});

	it('ordena desde la cabecera y lo refleja en la URL', async () => {
		// 16 productos de prueba van antes del mouse por nombre: una página de 50 los muestra todos.
		renderPage('/inventario/stock?per_page=50');
		await screen.findByRole('button', { name: 'Ver ficha de Mouse USB' });

		fireEvent.click(screen.getByRole('button', { name: /En bodega/ }));
		await waitFor(() =>
			expect(location()).toBe('/inventario/stock?orden=physical_quantity&per_page=50'),
		);
		fireEvent.click(screen.getByRole('button', { name: /En bodega/ }));
		await waitFor(() =>
			expect(location()).toBe('/inventario/stock?orden=-physical_quantity&per_page=50'),
		);
		await waitFor(() => expect(productRows()[0]).toBe('Cable HDMI 2 m'));
	});

	it('abrir un producto lleva a su ficha', async () => {
		renderPage('/inventario/stock?q=mouse');
		fireEvent.click(await screen.findByRole('button', { name: 'Ver ficha de Mouse USB' }));
		await waitFor(() => expect(location()).toBe('/inventario/stock/31'));
	});

	it('al cambiar de sucursal cancela la consulta anterior y no pinta sus filas', async () => {
		let firstSignal: AbortSignal | undefined;
		const original = service.listInventoryOverview;
		const spy = vi
			.spyOn(service, 'listInventoryOverview')
			.mockImplementationOnce((...args) => {
				[, , firstSignal] = args;
				// Nunca resuelve: la consulta queda en vuelo hasta que la sesión se desmonta.
				return new Promise<IInventoryOverviewResponse>(() => {});
			})
			.mockImplementation(original);
		const page = renderPage();
		await waitFor(() => expect(spy).toHaveBeenCalled());

		context.branchId = 6;
		page.update();

		expect(firstSignal?.aborted).toBe(true);
		await waitFor(() => expect(productRows()).toEqual(['Teclado mecánico compacto']));
	});
});
