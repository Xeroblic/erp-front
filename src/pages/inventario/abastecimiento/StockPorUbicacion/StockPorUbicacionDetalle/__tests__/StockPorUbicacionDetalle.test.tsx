import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import StockPorUbicacionDetalleView from '@/pages/inventario/abastecimiento/StockPorUbicacion/StockPorUbicacionDetalle/StockPorUbicacionDetalleView';
import * as service from '@/services/procurement/inventoryStock.service';
import type {
	IInventoryOriginsResponse,
	IInventoryStockRow,
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
/**
 * `react-select` no expone sus opciones como controles nativos accesibles por
 * teclado en jsdom sin `pointer capture`; el resto de la suite del repo
 * resuelve esto sustituyendo `SelectReact` por un `<select>` nativo cableado
 * a las mismas props (`options`/`value`/`onChange`) que usa
 * `DocumentInitialStockModal`.
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

const MOUSE_PRODUCT_ID = 31;
const TECLADO_PRODUCT_ID = 67;
const CABLE_HDMI_PRODUCT_ID = 58;

const renderDetalle = (
	path: string,
	state?: { location: string; owner: string; row: IInventoryStockRow },
) => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	const [pathname, search = ''] = path.split('?');
	const app = () => (
		<Provider store={store}>
			<MemoryRouter
				initialEntries={[
					{
						pathname,
						search: search === '' ? '' : `?${search}`,
						state,
					},
				]}>
				<Routes>
					<Route
						path='/inventario/abastecimiento/stock/:productId'
						element={<StockPorUbicacionDetalleView />}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>
	);
	const view = render(app());
	return { ...view, store, rerenderDetalle: () => view.rerender(app()) };
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
	// `DocumentInitialStockModal` renderiza vía `Portal`, que busca
	// `#portal-root` en el DOM (`Portal.tsx`) — sin él el modal se monta como
	// `null` en silencio, igual criterio que `Modal.test.tsx`.
	const portalRoot = document.createElement('div');
	portalRoot.id = 'portal-root';
	document.body.appendChild(portalRoot);
});
afterEach(() => {
	document.getElementById('portal-root')?.remove();
	vi.restoreAllMocks();
});

describe('Ficha de stock por ubicación — procedencias y documentar', () => {
	it('no consulta procedencias ni muestra datos simulados cuando el flag está apagado', async () => {
		context.enabled = false;
		const spy = vi.spyOn(service, 'listInventoryOrigins');

		renderDetalle(`/inventario/abastecimiento/stock/${MOUSE_PRODUCT_ID}?location=unlocated`);

		expect(await screen.findByText('Consulta no habilitada')).toBeInTheDocument();
		expect(spy).not.toHaveBeenCalled();
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
	});

	it('oculta el resumen navegado al cambiar de contexto antes de pintar cifras ajenas', async () => {
		const response = await service.listInventoryStock(4, {
			warehouse_id: 8,
			search: 'CBL-HDMI-2',
		});
		const row = response.data.find((item) => item.product.id === CABLE_HDMI_PRODUCT_ID);
		if (!row) throw new Error('Falta el fixture de stock para el cable HDMI.');
		const page = renderDetalle(
			`/inventario/abastecimiento/stock/${CABLE_HDMI_PRODUCT_ID}?location=warehouse:8`,
			{ row, location: 'warehouse:8', owner: '1:2:4' },
		);

		expect(screen.getByText('Resumen')).toBeInTheDocument();
		context.branchId = 6;
		page.rerenderDetalle();

		expect(screen.queryByText('Resumen')).not.toBeInTheDocument();
		expect(screen.getByText('Ubicación no válida')).toBeInTheDocument();
		expect(
			screen.queryByRole('region', { name: 'Procedencias del producto' }),
		).not.toBeInTheDocument();
	});

	it('carga las procedencias del producto en la ubicación de la URL y expone Documentar cuando corresponde', async () => {
		renderDetalle(`/inventario/abastecimiento/stock/${MOUSE_PRODUCT_ID}?location=unlocated`);
		await screen.findByText('5 sin respaldo');
		expect(screen.getByText('Procedencia desconocida')).toBeInTheDocument();
		expect(screen.getByText('Fecha desconocida')).toBeInTheDocument();
	});

	it('filtra procedencias por proveedor y documento sin necesitar el listado', async () => {
		renderDetalle(`/inventario/abastecimiento/stock/${MOUSE_PRODUCT_ID}?location=unlocated`);
		await screen.findByText('5 sin respaldo');
		fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '7' } });
		await waitFor(() => expect(screen.queryByText('5 sin respaldo')).not.toBeInTheDocument());
		await screen.findByText('10 documentados por factura #1234');
		fireEvent.change(screen.getByLabelText('Documento de compra'), { target: { value: '24' } });
		await screen.findByText('10 documentados por factura #1234');
	});

	it('pérdida de permiso cancela la solicitud en curso y no deja procedencias al recuperar acceso', async () => {
		const pending = deferred<IInventoryOriginsResponse>();
		const spy = vi.spyOn(service, 'listInventoryOrigins').mockReturnValueOnce(pending.promise);
		const page = renderDetalle(
			`/inventario/abastecimiento/stock/${MOUSE_PRODUCT_ID}?location=unlocated`,
		);
		await waitFor(() => expect(spy).toHaveBeenCalled());
		act(() => {
			page.store.dispatch(auth.actions.deny());
		});
		expect(screen.getByText('Sin permiso')).toBeInTheDocument();
		expect(spy.mock.calls[0][3]?.aborted).toBe(true);
		await act(async () => {
			pending.resolve({
				data: [],
				context: {
					scope: 'unlocated',
					branch_id: 4,
					warehouse: null,
					product: { id: MOUSE_PRODUCT_ID } as never,
				},
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
		act(() => {
			page.store.dispatch(auth.actions.allow());
		});
		// La respuesta resuelta después de perder el permiso no debe quedar
		// pintada: recuperar el acceso vuelve a pedir las procedencias desde
		// cero, no reutiliza la respuesta tardía (vacía) de la solicitud
		// abortada.
		expect(
			screen.queryByText('Sin procedencias para los filtros aplicados'),
		).not.toBeInTheDocument();
		await screen.findByText('5 sin respaldo');
	});

	it('cancela la solicitud de procedencias en curso al salir de la ficha', async () => {
		const pending = deferred<IInventoryOriginsResponse>();
		const spy = vi.spyOn(service, 'listInventoryOrigins').mockReturnValueOnce(pending.promise);
		const page = renderDetalle(
			`/inventario/abastecimiento/stock/${MOUSE_PRODUCT_ID}?location=unlocated`,
		);
		await waitFor(() => expect(spy).toHaveBeenCalled());
		page.unmount();
		expect(spy.mock.calls[0][3]?.aborted).toBe(true);
	});

	it('ofrece filtros de todas las procedencias y vuelve a página uno al seleccionar documento', async () => {
		const spy = vi.spyOn(service, 'listInventoryOrigins');
		renderDetalle(
			`/inventario/abastecimiento/stock/${TECLADO_PRODUCT_ID}?location=warehouse:8`,
		);
		const region = await screen.findByRole('region', { name: 'Procedencias del producto' });
		await waitFor(() =>
			expect(within(region).queryByText('Cargando procedencias…')).not.toBeInTheDocument(),
		);
		expect(within(region).getByRole('option', { name: 'Factura #1234' })).toBeInTheDocument();
		expect(within(region).getByRole('button', { name: 'Primera página' })).toBeDisabled();
		expect(within(region).getByRole('button', { name: 'Anterior' })).toBeDisabled();
		expect(within(region).getByRole('button', { name: 'Última página' })).toBeEnabled();
		expect(within(region).getByRole('textbox', { name: 'Página' })).toHaveValue('1');
		expect(within(region).getByRole('combobox', { name: 'Por página' })).toBeEnabled();
		fireEvent.click(within(region).getByRole('button', { name: 'Siguiente' }));
		await screen.findByText('1 documentados por factura #1234');
		expect(spy.mock.calls.at(-1)?.[2]?.page).toBe(2);
		fireEvent.change(screen.getByLabelText('Documento de compra'), { target: { value: '24' } });
		await waitFor(() => expect(spy.mock.calls.at(-1)?.[2]?.page).toBe(1));
		await screen.findByText('1 documentados por factura #1234');
	});

	it('documentar respalda unidades sin factura y el panel de procedencias refleja el nuevo desglose', async () => {
		const response = await service.listInventoryStock(4, {
			warehouse_id: 8,
			search: 'CBL-HDMI-2',
		});
		const row = response.data.find((item) => item.product.id === CABLE_HDMI_PRODUCT_ID);
		if (!row) throw new Error('Falta el fixture de stock para el cable HDMI.');
		renderDetalle(
			`/inventario/abastecimiento/stock/${CABLE_HDMI_PRODUCT_ID}?location=warehouse:8`,
			{ row, location: 'warehouse:8', owner: '1:2:4' },
		);
		await screen.findByText('100 sin respaldo');
		const getSummaryValue = (label: string) => {
			// StockSummaryKpis (caja + ícono, estilo pagos diferidos): la etiqueta
			// y el valor son dos <p> hermanos, no un <dl>/<dt>/<dd>.
			const value = screen.getByText(label).nextElementSibling;
			if (!(value instanceof HTMLElement)) throw new Error(`Falta el resumen ${label}.`);
			return value;
		};
		expect(getSummaryValue('Documentado')).toHaveTextContent('0');
		expect(getSummaryValue('Sin documento')).toHaveTextContent('100');

		fireEvent.click(screen.getByRole('button', { name: 'Documentar' }));
		const dialog = await screen.findByRole('dialog', { name: 'Documentar stock inicial' });
		// El picker carga los documentos confirmados de forma asíncrona
		// (`usePurchaseDocumentPicker`): hay que esperar a que la opción exista
		// antes de disparar el `change`, o el `<select>` no tiene nada que
		// seleccionar todavía.
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
		await screen.findByText('90 sin respaldo');
		await screen.findByText('10 documentados por boleta #7788');
		await waitFor(() => expect(getSummaryValue('Documentado')).toHaveTextContent('10'));
		expect(getSummaryValue('Sin documento')).toHaveTextContent('90');
	});
});
