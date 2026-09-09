import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import StockPorUbicacionView from '@/pages/inventario/abastecimiento/StockPorUbicacion/StockPorUbicacionView';
import * as service from '@/services/procurement/inventoryStock.service';
import { inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import type {
	IInventoryStockResponse,
	IInventoryOriginsResponse,
} from '@/interface/procurement.interface';

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
	reducers: {
		deny(state) {
			state.user.permisos = [];
		},
		allow(state) {
			state.user.permisos = ['view-product'];
		},
	},
});
const renderPage = () => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	const tree = () => (
		<Provider store={store}>
			<MemoryRouter>
				<StockPorUbicacionView />
			</MemoryRouter>
		</Provider>
	);
	const view = render(tree());
	return { ...view, store, update: () => view.rerender(tree()) };
};
const unlocated = async () => {
	fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'unlocated' } });
	await screen.findByRole('button', { name: /Procedencias de Mouse/ });
};
const expandMouse = async () => {
	fireEvent.click(screen.getByRole('button', { name: /Procedencias de Mouse/ }));
	await screen.findByText('10 documentados por factura #1234');
};
const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
beforeEach(() => {
	context.branchId = 4;
	context.subsidiaryId = 2;
	context.enabled = true;
});
afterEach(() => vi.restoreAllMocks());

describe('Stock por ubicación — integración de vista, hooks, slice y servicio', () => {
	it('muestra los dos desgloses del mismo físico y expande 10 documentados + 5 sin respaldo', async () => {
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
		const row = within(table).getAllByRole('row')[2];
		expect(
			within(row)
				.getAllByRole('cell')
				.slice(1, 6)
				.map((cell) => cell.textContent),
		).toEqual(['15', '13', '2', '10', '5']);
		expect(within(row).getByText('2')).toHaveClass('text-amber-700');
		await expandMouse();
		expect(screen.getByText('5 sin respaldo')).toBeInTheDocument();
		expect(screen.getByText('Procedencia desconocida')).toBeInTheDocument();
		expect(screen.getByText('Fecha desconocida')).toBeInTheDocument();
		expect(screen.queryByText('15 documentados por factura #1234')).not.toBeInTheDocument();
		const trigger = screen.getByRole('button', { name: /Procedencias de Mouse/ });
		await waitFor(() => expect(trigger).toBeEnabled());
		trigger.focus();
		expect(trigger).toHaveFocus();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		fireEvent.click(trigger);
		expect(
			screen.queryByRole('region', { name: 'Procedencias del producto' }),
		).not.toBeInTheDocument();
	});

	it('filtra procedencias por proveedor y documento sin alterar el físico del producto', async () => {
		renderPage();
		await unlocated();
		await expandMouse();
		fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '7' } });
		await waitFor(() => expect(screen.queryByText('5 sin respaldo')).not.toBeInTheDocument());
		await screen.findByText('10 documentados por factura #1234');
		fireEvent.change(screen.getByLabelText('Documento de compra'), { target: { value: '24' } });
		await screen.findByText('10 documentados por factura #1234');
		expect(
			within(screen.getByRole('table', { name: 'Stock físico por ubicación' })).getByRole(
				'cell',
				{ name: '15' },
			),
		).toBeInTheDocument();
	});

	it('cierra la expansión y reinicia página al cambiar búsqueda o ubicación, sin enviar ambos filtros', async () => {
		const spy = vi.spyOn(service, 'listInventoryStock');
		renderPage();
		await unlocated();
		await expandMouse();
		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'warehouse:8' } });
		expect(screen.queryByText('10 documentados por factura #1234')).not.toBeInTheDocument();
		await waitFor(() => expect(screen.queryByText('Cargando stock…')).not.toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
		await waitFor(() => expect(spy.mock.calls.at(-1)?.[1]?.page).toBe(2));
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'inexistente' },
		});
		await screen.findByText('Sin productos para esta ubicación o búsqueda.');
		expect(spy.mock.calls.at(-1)?.[1]?.page).toBe(1);
		expect(
			spy.mock.calls.every(([, params]) => !(params?.warehouse_id && params?.unlocated)),
		).toBe(true);
	});

	it('cambia sucursal sin pintar filtros, opciones ni procedencias del contexto anterior', async () => {
		const page = renderPage();
		await unlocated();
		await expandMouse();
		context.branchId = 6;
		page.update();
		expect(screen.getByLabelText('Ubicación')).toHaveValue('branch');
		expect(screen.getByLabelText('Buscar por nombre o SKU')).toHaveValue('');
		expect(screen.queryByText('10 documentados por factura #1234')).not.toBeInTheDocument();
		expect(screen.queryByRole('option', { name: 'Bodega Central' })).not.toBeInTheDocument();
		await waitFor(() =>
			expect(page.store.getState().inventoryStock.list.response?.context.branch_id).toBe(6),
		);
	});

	it('pérdida de permiso desmonta la consulta, cancela solicitudes y no deja datos al recuperar acceso', async () => {
		const page = renderPage();
		await unlocated();
		const pending = deferred<IInventoryOriginsResponse>();
		const spy = vi.spyOn(service, 'listInventoryOrigins').mockReturnValueOnce(pending.promise);
		fireEvent.click(screen.getByRole('button', { name: /Procedencias de Mouse/ }));
		await waitFor(() => expect(spy).toHaveBeenCalled());
		act(() => {
			page.store.dispatch(auth.actions.deny());
		});
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		expect(spy.mock.calls[0][3]?.aborted).toBe(true);
		await act(async () => {
			pending.resolve({
				data: [],
				context: {
					scope: 'unlocated',
					branch_id: 4,
					warehouse: null,
					product: inventoryStockEnvelope.data[0].product,
				},
				links: inventoryStockEnvelope.links,
				meta: inventoryStockEnvelope.meta,
			});
			await pending.promise;
		});
		act(() => {
			page.store.dispatch(auth.actions.allow());
		});
		expect(screen.getByLabelText('Ubicación')).toHaveValue('branch');
		expect(
			screen.queryByRole('region', { name: 'Procedencias del producto' }),
		).not.toBeInTheDocument();
	});

	it('ignora una respuesta tardía de búsqueda y permite reintentar el error vigente', async () => {
		const pending = deferred<IInventoryStockResponse>();
		const spy = vi.spyOn(service, 'listInventoryStock').mockReturnValueOnce(pending.promise);
		renderPage();
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'inexistente' },
		});
		await screen.findByText('Sin productos para esta ubicación o búsqueda.');
		await act(async () => {
			pending.resolve({
				...inventoryStockEnvelope,
				context: { scope: 'branch', branch_id: 4, warehouse: null },
			});
			await pending.promise;
		});
		expect(
			screen.queryByRole('button', { name: /Procedencias de Mouse/ }),
		).not.toBeInTheDocument();
		spy.mockRejectedValueOnce(new Error('Fallo simulado'));
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'mouse' },
		});
		await screen.findByText('No pudimos cargar el stock');
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar stock' }));
		await screen.findByRole('button', { name: /Procedencias de Mouse/ });
	});

	it('cerrar cancela una procedencia pendiente y una reapertura permite reintentar sin restaurar la anterior', async () => {
		const canonical = await service.listInventoryOrigins(4, 31, { unlocated: 1 });
		renderPage();
		await unlocated();
		const pending = deferred<IInventoryOriginsResponse>();
		const spy = vi
			.spyOn(service, 'listInventoryOrigins')
			.mockReturnValueOnce(pending.promise)
			.mockRejectedValueOnce(new Error('Fallo de procedencias'));
		const trigger = screen.getByRole('button', { name: /Procedencias de Mouse/ });
		fireEvent.click(trigger);
		await screen.findByText('Cargando procedencias…');
		await waitFor(() => expect(trigger).toBeEnabled());
		fireEvent.click(trigger);
		expect(spy.mock.calls[0][3]?.aborted).toBe(true);
		await waitFor(() => expect(trigger).toBeEnabled());
		fireEvent.click(trigger);
		await screen.findByText('No pudimos cargar las procedencias');
		await act(async () => {
			pending.resolve(canonical);
			await pending.promise;
		});
		expect(screen.queryByText('10 documentados por factura #1234')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar procedencias' }));
		await screen.findByText('10 documentados por factura #1234');
	});

	it('ofrece filtros de todas las procedencias y vuelve a página uno al seleccionar documento', async () => {
		const spy = vi.spyOn(service, 'listInventoryOrigins');
		renderPage();
		fireEvent.change(screen.getByLabelText('Ubicación'), { target: { value: 'warehouse:8' } });
		fireEvent.change(screen.getByLabelText('Buscar por nombre o SKU'), {
			target: { value: 'KB-001' },
		});
		fireEvent.click(await screen.findByRole('button', { name: /Procedencias de Teclado/ }));
		const region = await screen.findByRole('region', { name: 'Procedencias del producto' });
		await waitFor(() =>
			expect(within(region).queryByText('Cargando procedencias…')).not.toBeInTheDocument(),
		);
		expect(within(region).getByRole('option', { name: 'Factura #1234' })).toBeInTheDocument();
		expect(
			within(region).queryByText('1 documentados por factura #1234'),
		).not.toBeInTheDocument();
		fireEvent.click(within(region).getByRole('button', { name: 'Siguiente' }));
		await screen.findByText('1 documentados por factura #1234');
		expect(spy.mock.calls.at(-1)?.[2]?.page).toBe(2);
		fireEvent.change(screen.getByLabelText('Documento de compra'), { target: { value: '24' } });
		await waitFor(() => expect(spy.mock.calls.at(-1)?.[2]?.page).toBe(1));
		await screen.findByText('1 documentados por factura #1234');
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
