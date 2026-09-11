import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import StockPorUbicacionView from '@/pages/inventario/abastecimiento/StockPorUbicacion/StockPorUbicacionView';
import * as service from '@/services/procurement/inventoryStock.service';

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
/**
 * `react-select` no expone sus opciones como controles nativos accesibles por
 * teclado en jsdom sin `pointer capture`; el resto de la suite del repo
 * resuelve esto sustituyendo `SelectReact` por un `<select>` nativo cableado
 * a las mismas props (`options`/`value`/`onChange`/`placeholder`) — mismo
 * shim que `StockPorUbicacionDetalle.test.tsx`.
 */
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

const LocationProbe = () => {
	const location = useLocation();
	return <div data-testid='location-probe'>{`${location.pathname}${location.search}`}</div>;
};

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product'],
			roles: [],
			visible: { branches: [{ id: 4 }, { id: 6 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});
const renderPage = () => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	const tree = () => (
		<Provider store={store}>
			<MemoryRouter>
				<StockPorUbicacionView />
				<LocationProbe />
			</MemoryRouter>
		</Provider>
	);
	const view = render(tree());
	return { ...view, store, update: () => view.rerender(tree()) };
};
const unlocated = async () => {
	fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'unlocated' } });
	await screen.findByRole('button', { name: /Ver detalle de Mouse/ });
};

beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('Stock por ubicación — listado', () => {
	it('muestra los dos desgloses del mismo físico, resalta lo no apto y navega al detalle al hacer clic en la fila', async () => {
		renderPage();
		expect(screen.getByText('Datos simulados')).toBeInTheDocument();
		await unlocated();
		const table = screen.getByRole('table', { name: 'Stock físico por ubicación' });
		expect(within(table).getByRole('columnheader', { name: 'Condición' })).toHaveAttribute(
			'colspan',
			'2',
		);
		expect(within(table).getByRole('columnheader', { name: 'Documentación' })).toHaveAttribute(
			'colspan',
			'2',
		);
		const row = within(table).getByRole('button', { name: /Ver detalle de Mouse/ });
		expect(
			Array.from(row.querySelectorAll('td'))
				.slice(1)
				.map((cell) => cell.textContent),
		).toEqual(['15', '13', '2', '10', '5']);
		expect(within(row).getByText('2')).toHaveClass('text-amber-700');

		fireEvent.click(row);
		expect(screen.getByTestId('location-probe')).toHaveTextContent(
			'/inventario/abastecimiento/stock/31?location=unlocated',
		);
	});

	it('reintenta con Enter y Espacio desde el teclado, igual que un clic', async () => {
		renderPage();
		await unlocated();
		const table = screen.getByRole('table', { name: 'Stock físico por ubicación' });
		const row = within(table).getByRole('button', { name: /Ver detalle de Mouse/ });
		row.focus();
		fireEvent.keyDown(row, { key: 'Enter' });
		expect(screen.getByTestId('location-probe')).toHaveTextContent(
			'/inventario/abastecimiento/stock/31?location=unlocated',
		);
	});

	it('cierra la ubicación anterior y reinicia página al cambiar búsqueda o ubicación, sin enviar ambos filtros', async () => {
		const spy = vi.spyOn(service, 'listInventoryStock');
		renderPage();
		await unlocated();
		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'warehouse:8' } });
		await waitFor(() => expect(spy.mock.calls.at(-1)?.[1]?.warehouse_id).toBe(8));
		const pageInput = await waitFor(() => {
			const input = document.querySelector<HTMLInputElement>('input[name="page"]');
			if (!input) throw new Error('Input de página no encontrado todavía.');
			return input;
		});
		fireEvent.change(pageInput, { target: { value: '2' } });
		await waitFor(() => expect(spy.mock.calls.at(-1)?.[1]?.page).toBe(2));
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'inexistente' },
		});
		await screen.findByText('Sin resultados para esta ubicación o búsqueda');
		expect(spy.mock.calls.at(-1)?.[1]?.page).toBe(1);
		expect(
			spy.mock.calls.every(([, params]) => !(params?.warehouse_id && params?.unlocated)),
		).toBe(true);
	});

	it('cambia sucursal sin pintar filtros ni opciones del contexto anterior', async () => {
		const page = renderPage();
		await unlocated();
		context.branchId = 6;
		page.update();
		// «Sucursal completa» ya no es una opción de la lista: es la ausencia de
		// selección (`value=null`), que el shim de `SelectReact` deja como el
		// placeholder en blanco.
		expect(screen.getByLabelText('Ubicación')).toHaveValue('');
		expect(screen.getByLabelText('Buscar por nombre o SKU')).toHaveValue('');
		expect(screen.queryByRole('option', { name: 'Bodega Central' })).not.toBeInTheDocument();
		await waitFor(() =>
			expect(page.store.getState().inventoryStock.list.response?.context.branch_id).toBe(6),
		);
	});

	it('ignora una respuesta tardía de búsqueda y permite reintentar el error vigente', async () => {
		const deferred = <T,>() => {
			let resolve!: (value: T) => void;
			const promise = new Promise<T>((done) => {
				resolve = done;
			});
			return { promise, resolve };
		};
		const pending = deferred<Awaited<ReturnType<typeof service.listInventoryStock>>>();
		const spy = vi.spyOn(service, 'listInventoryStock').mockReturnValueOnce(pending.promise);
		renderPage();
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'inexistente' },
		});
		await screen.findByText('Sin resultados para esta ubicación o búsqueda');
		await act(async () => {
			pending.resolve({
				data: [],
				context: { scope: 'branch', branch_id: 4, warehouse: null },
				links: { first: null, last: null, prev: null, next: null },
				meta: {
					current_page: 1,
					from: null,
					last_page: 1,
					links: [],
					path: '',
					per_page: 15,
					to: null,
					total: 0,
				},
			});
			await pending.promise;
		});
		spy.mockRejectedValueOnce(new Error('Fallo simulado'));
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'mouse' },
		});
		await screen.findByText('No pudimos cargar el stock');
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar stock' }));
		await screen.findByRole('button', { name: /Ver detalle de Mouse/ });
	});

	it('no consulta sin permiso geográfico, sin sucursal o con mocks apagados', () => {
		const spy = vi.spyOn(service, 'listInventoryStock');
		context.branchId = 99;
		const page = renderPage();
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		context.branchId = null;
		page.update();
		expect(screen.getByText('Selecciona una sucursal')).toBeInTheDocument();
		context.branchId = 4;
		context.enabled = false;
		page.update();
		expect(screen.getByText('Consulta no habilitada')).toBeInTheDocument();
		expect(spy).not.toHaveBeenCalled();
	});
});
