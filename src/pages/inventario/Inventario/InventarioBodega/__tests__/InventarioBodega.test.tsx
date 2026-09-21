import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryOverview from '@/store/slices/procurement/inventoryOverviewSlice';
import InventarioBodegaView from '@/pages/inventario/Inventario/InventarioBodega/InventarioBodegaView';
import * as service from '@/services/procurement/inventoryOverview.service';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';

const context = vi.hoisted(() => ({
	branchId: 4 as number | null,
	subsidiaryId: 2,
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
	reducers: {},
});

const LocationProbe = () => {
	const location = useLocation();
	return (
		<div data-testid='location' data-from={JSON.stringify(location.state)}>
			{`${location.pathname}${location.search}`}
		</div>
	);
};

const renderBodega = (path: string) => {
	const store = configureStore({ reducer: { inventoryOverview, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route path='/inventario/stock' element={<p>Inventario</p>} />
					<Route
						path='/inventario/stock/bodegas/:bodegaId'
						element={<InventarioBodegaView />}
					/>
					<Route path='/inventario/stock/:productId' element={<p>Ficha</p>} />
				</Routes>
				<LocationProbe />
			</MemoryRouter>
		</Provider>,
	);
};

const table = () => screen.getByRole('table', { name: 'Productos de la bodega' });

const productRows = () =>
	within(table())
		.queryAllByRole('button', { name: /detalle de/ })
		.map((button) =>
			button.getAttribute('aria-label')?.replace(/^(Mostrar|Ocultar) detalle de /, ''),
		);

const rowOf = (element: HTMLElement): HTMLElement => {
	const row = element.closest('tr');
	if (!row) throw new Error('El elemento no está dentro de una fila.');
	return row;
};

const location = () => screen.getByTestId('location');

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
});
afterEach(() => {
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Ficha de inventario de bodega', () => {
	it('muestra el resumen y la lista de producto, SKU, marca, stock y estado', async () => {
		const summary = vi.spyOn(service, 'getInventoryStockSummary');
		renderBodega('/inventario/stock/bodegas/12');

		const dato = async (label: string) =>
			(await screen.findByText(label, { selector: 'p' })).nextElementSibling;
		expect(await dato('Productos')).toHaveTextContent('1');
		expect(await dato('Unidades')).toHaveTextContent('4');
		expect(await dato('Bajo el umbral')).toHaveTextContent('1');
		// Datos de la bodega: los que no tiene se dicen, no se ocultan.
		expect(await dato('Tipo')).toHaveTextContent('Estante');
		expect(await dato('Encargado')).toHaveTextContent('Sin encargado');
		expect(screen.getByText('Código EST-A3')).toBeInTheDocument();
		expect(screen.getByRole('progressbar', { name: 'Capacidad usada 7%' })).toBeInTheDocument();
		await waitFor(() => expect(productRows()).toEqual(['Mouse USB']));

		expect(
			within(table())
				.getAllByRole('columnheader')
				.map((header) => header.textContent),
		).toEqual(['Detalle', 'Producto', 'SKU', 'Marca', 'Stock', 'Estado']);
		const row = rowOf(screen.getByRole('button', { name: 'Mostrar detalle de Mouse USB' }));
		expect(row).toHaveTextContent('MOUSE-001');
		expect(row).toHaveTextContent('Logitech');
		expect(row).toHaveTextContent('4');
		// Las reservas son de la sucursal, pero se dicen: si no, el estado no se entiende.
		expect(within(row).getByText('16 reservadas en la sucursal')).toBeInTheDocument();
		expect(screen.getByText('Productos en Estante A3')).toBeInTheDocument();
		// En la ficha la ubicación es fija: no se ofrece el select.
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		expect(summary).not.toHaveBeenCalled();
	});

	it('al hacer clic en la fila despliega el detalle y desde ahí se va a la ficha', async () => {
		renderBodega('/inventario/stock/bodegas/sin-ubicacion');
		const toggle = await screen.findByRole('button', { name: 'Mostrar detalle de Mouse USB' });
		expect(
			screen.queryByRole('button', { name: 'Ver ficha de Mouse USB' }),
		).not.toBeInTheDocument();

		// Clic en cualquier celda de la fila, no sólo en la flecha.
		fireEvent.click(within(rowOf(toggle)).getByText('Mouse USB'));

		expect(
			screen.getByRole('button', { name: 'Ocultar detalle de Mouse USB' }),
		).toHaveAttribute('aria-expanded', 'true');
		const dato = (label: string) =>
			screen.getByText(label, { selector: 'dt' }).nextElementSibling;
		// Sin ubicación: 15 unidades, 13 vendibles, 2 no vendibles, 10 con documento, 5 sin.
		expect(dato('Vendibles')).toHaveTextContent('13');
		expect(dato('No vendibles')).toHaveTextContent('2');
		expect(dato('Con documento')).toHaveTextContent('10');
		expect(dato('Sin documento')).toHaveTextContent('5');
		// Dentro del panel: la fila y el KPI de arriba también dicen «Bajo el umbral».
		const panel = document.getElementById('bodega-producto-31');
		if (!panel) throw new Error('Falta el panel desplegado.');
		expect(within(panel).getByText('Bajo el umbral')).toBeInTheDocument();
		expect(panel).toHaveTextContent(
			'16 unidades reservadas en la sucursal · 1 disponible para vender.',
		);
		expect(
			screen.getByText('Avisa con 10 o menos disponibles en la sucursal (hoy 1).'),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Ver ficha de Mouse USB' }));

		await waitFor(() => expect(location()).toHaveTextContent('/inventario/stock/31'));
		expect(location()).toHaveAttribute(
			'data-from',
			JSON.stringify({ from: '/inventario/stock/bodegas/sin-ubicacion' }),
		);
	});

	it('la flecha vuelve a plegar el detalle', async () => {
		renderBodega('/inventario/stock/bodegas/12');
		fireEvent.click(
			await screen.findByRole('button', { name: 'Mostrar detalle de Mouse USB' }),
		);
		fireEvent.click(screen.getByRole('button', { name: 'Ocultar detalle de Mouse USB' }));
		expect(screen.queryByText('Vendibles')).not.toBeInTheDocument();
	});

	it('filtra por estado dentro de la bodega', async () => {
		renderBodega('/inventario/stock/bodegas/8?per_page=50');
		await waitFor(() => expect(productRows()).toHaveLength(18));

		fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'healthy' } });

		await waitFor(() => expect(location()).toHaveTextContent('estado=healthy'));
		await waitFor(() =>
			expect(productRows()).toEqual(['Cable HDMI 2 m', 'Teclado mecánico compacto']),
		);
	});

	it('avisa si la bodega no pertenece a la sucursal', async () => {
		renderBodega('/inventario/stock/bodegas/999');
		expect(await screen.findByText('Bodega no encontrada')).toBeInTheDocument();
	});

	it('rechaza un segmento que no es bodega', () => {
		renderBodega('/inventario/stock/bodegas/abc');
		expect(screen.getByText('Bodega inválida')).toBeInTheDocument();
	});
});
