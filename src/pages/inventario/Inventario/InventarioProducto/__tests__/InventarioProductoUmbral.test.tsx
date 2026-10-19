import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryOverview from '@/store/slices/procurement/inventoryOverviewSlice';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import products from '@/store/slices/products/productsSlice';
import InventarioProductoView from '@/pages/inventario/Inventario/InventarioProducto/InventarioProductoView';

/**
 * Umbral §13 de la ficha contra la API real (tarea 19 del backend): se lee de
 * `GET B/products/{product}` y se edita con `PATCH B/products/{product}` en la
 * sucursal dueña. Los casos simulados están en `InventarioProducto.test.tsx`.
 */

interface IRequestConfig {
	url: string;
	method?: string;
	params?: Record<string, unknown>;
	data?: Record<string, unknown>;
}

const fetchData = vi.hoisted(() => vi.fn<(config: IRequestConfig) => Promise<unknown>>());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/config/inventoryStock.config', () => ({ default: false }));
vi.mock('@/config/inventoryOverview.config', () => ({ default: false }));
vi.mock('@/config/inventoryReceipts.config', () => ({ default: false }));
vi.mock('@/config/inventoryOperations.config', () => ({ default: false }));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({
		multiLocationEnabled: false,
		isMultiLocation: false,
		isLoading: false,
	}),
}));
// Objeto estable: uno nuevo en cada render rehace la sesión de la ficha.
const branchContext = vi.hoisted(() => ({
	branchId: 4,
	subsidiaryId: 2,
	visibleBranches: [] as { id: number; name: string }[],
}));
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => branchContext }));
vi.mock('@/services/procurement/productPurchases.service', () => {
	const empty = {
		data: [],
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
	};
	return {
		listProductSuppliers: () => Promise.resolve(empty),
		listProductPurchaseHistory: () => Promise.resolve(empty),
	};
});
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

const SERIAL_MESSAGE =
	'Un producto con seguimiento por serie no lleva umbral crítico: su disponibilidad se cuenta por equipos.';

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product', 'edit-product'],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }, { id: 6 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});

const emptyPage = (context: Record<string, unknown>) => ({
	data: {
		data: [],
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
		context,
	},
});

const cardProduct = (serial: boolean) => ({
	id: 31,
	sku: 'MOU-1',
	commercial_sku: null,
	name: 'Mouse inalámbrico',
	short_description: null,
	serial_tracking: serial,
	grade: null,
	currency_code: 'CLP',
	price: '7990.00',
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
});

const stockRow = (serial: boolean) => ({
	product: cardProduct(serial),
	physical_quantity: 4,
	fit_quantity: 2,
	unfit_quantity: 2,
	documented_quantity: 4,
	undocumented_quantity: 0,
});

/** Bloque de la filial: 2 vendibles y 5 reservadas dejan el disponible en −3. */
const criticalBlock = {
	scope: 'subsidiary',
	subsidiary_id: 2,
	physical_quantity: 4,
	fit_quantity: 2,
	unfit_quantity: 2,
	held_quantity: 5,
	available_quantity: -3,
	threshold: 10,
	status: 'critical',
};

interface IFicha {
	serial?: boolean;
	ownerBranchId?: number | null;
	patch?: (config: IRequestConfig) => Promise<unknown>;
}

/** Ruteo de la API: la ficha (origins, filas y bodegas), el producto y su PATCH. */
const routeApi = ({ serial = false, ownerBranchId = 6, patch }: IFicha = {}) =>
	fetchData.mockImplementation((config) => {
		if (config.method === 'patch' && patch) return patch(config);
		if (config.url === '/branches/4/products/31')
			return Promise.resolve({
				data: {
					data: {
						id: 31,
						origin_branch_id: ownerBranchId,
						serial_tracking: serial,
						critical_stock_threshold: serial ? null : 10,
						is_critical_stock: !serial,
						critical_stock: serial ? null : criticalBlock,
					},
				},
			});
		if (config.url === '/branches/4/inventory-stock/31/origins')
			return Promise.resolve(
				emptyPage({
					scope: 'branch',
					branch_id: 4,
					warehouse: null,
					product: cardProduct(serial),
					physical_quantity: 4,
					unattributed_quantity: 0,
				}),
			);
		if (config.url === '/branches/4/warehouses')
			return Promise.resolve({ data: { data: [], meta: { last_page: 1 } } });
		if (config.url === '/branches/4/inventory-stock')
			return Promise.resolve({
				data: {
					...emptyPage({ scope: 'branch', branch_id: 4, warehouse: null }).data,
					data: [stockRow(serial)],
					meta: { ...emptyPage({}).data.meta, total: 1, to: 1, from: 1 },
				},
			});
		return Promise.reject(new Error(`Ruta no esperada: ${config.method} ${config.url}`));
	});

const renderFicha = () => {
	const store = configureStore({
		reducer: { inventoryOverview, inventoryStock, products, auth: auth.reducer },
	});
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={['/inventario/stock/31']}>
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

const patchCalls = () =>
	fetchData.mock.calls.map(([config]) => config).filter((config) => config.method === 'patch');

beforeEach(() => {
	// Los modales se montan en `#portal-root` (`Portal.tsx`).
	const portalRoot = document.createElement('div');
	portalRoot.id = 'portal-root';
	document.body.appendChild(portalRoot);
});
afterEach(() => {
	document.getElementById('portal-root')?.remove();
	fetchData.mockReset();
});

describe('Ficha de inventario · umbral §13 contra la API real', () => {
	it('muestra el estado del backend y un disponible negativo tal cual, rotulado como de la filial', async () => {
		routeApi();
		renderFicha();

		expect(await kpi('Disponibles en la filial')).toHaveTextContent('-3');
		expect(await kpi('Reservadas en la filial')).toHaveTextContent('5');
		expect(screen.getByText('Avisa con 10 unidades o menos')).toBeInTheDocument();
		expect(screen.getByText('Stock de toda la filial')).toBeInTheDocument();
	});

	it('vaciar el umbral manda `critical_stock_threshold: null` a la sucursal dueña y relee la ficha', async () => {
		routeApi({ patch: () => Promise.resolve({ data: { data: { id: 31 } } }) });
		renderFicha();

		fireEvent.click(await screen.findByRole('button', { name: /Cambiar umbral/i }));
		const dialog = await screen.findByRole('dialog');
		fireEvent.change(within(dialog).getByLabelText('Umbral (unidades)'), {
			target: { value: '' },
		});
		fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar umbral' }));

		await waitFor(() => expect(patchCalls()).toHaveLength(1));
		const [patch] = patchCalls();
		expect(patch.url).toBe('/branches/6/products/31');
		expect(patch.data).toHaveProperty('critical_stock_threshold', null);
		// Relee el producto: el estado depende del umbral nuevo.
		await waitFor(() =>
			expect(
				fetchData.mock.calls.filter(([config]) => config.url === '/branches/4/products/31'),
			).toHaveLength(2),
		);
	});

	it('el 422 de producto con serie queda bajo el campo y el modal sigue abierto', async () => {
		routeApi({
			patch: () =>
				Promise.reject(
					Object.assign(new Error('HTTP 422'), {
						isAxiosError: true,
						response: {
							status: 422,
							data: {
								message: SERIAL_MESSAGE,
								errors: { critical_stock_threshold: [SERIAL_MESSAGE] },
							},
						},
					}),
				),
		});
		renderFicha();

		fireEvent.click(await screen.findByRole('button', { name: /Cambiar umbral/i }));
		const dialog = await screen.findByRole('dialog');
		fireEvent.change(within(dialog).getByLabelText('Umbral (unidades)'), {
			target: { value: '5' },
		});
		fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar umbral' }));

		expect(await within(dialog).findByText(SERIAL_MESSAGE)).toBeInTheDocument();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('un producto con serie no ofrece umbral', async () => {
		routeApi({ serial: true, ownerBranchId: 4 });
		renderFicha();

		expect(await screen.findByText('No aplica a productos con serie')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /umbral/i })).not.toBeInTheDocument();
	});

	it('un producto de filial muestra su umbral pero no lo ofrece editar: no hay ruta que lo acepte', async () => {
		routeApi({ ownerBranchId: null });
		renderFicha();

		expect(await screen.findByText('Avisa con 10 unidades o menos')).toBeInTheDocument();
		expect(
			screen.getByText('El umbral de un producto de la filial aún no se puede editar.'),
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /umbral/i })).not.toBeInTheDocument();
	});
});
