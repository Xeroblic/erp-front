import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import { resetInventoryStockStoreForTests } from '@/mocks/services/inventoryStock.mock';
import type * as InventoryStockService from '@/services/procurement/inventoryStock.service';
import type {
	IInventoryStockListParams,
	IInventoryStockResponse,
} from '@/interface/procurement.interface';

type TListInventoryStock = (
	branchId: number,
	params?: IInventoryStockListParams,
	signal?: AbortSignal,
) => Promise<IInventoryStockResponse>;

/**
 * El stock pasa por el servicio real salvo que una prueba instale un doble
 * (`stockDouble.list`): así se simula un origen con más de una página sin
 * sembrar cien productos en el mock compartido.
 */
const stockDouble = vi.hoisted(() => ({
	list: null as TListInventoryStock | null,
	calls: [] as IInventoryStockListParams[],
}));
vi.mock('@/services/procurement/inventoryStock.service', async (importOriginal) => {
	const actual = await importOriginal<typeof InventoryStockService>();
	const listInventoryStock: TListInventoryStock = (branchId, params, signal) => {
		stockDouble.calls.push(params ?? {});
		return stockDouble.list
			? stockDouble.list(branchId, params, signal)
			: actual.listInventoryStock(branchId, params, signal);
	};
	return { ...actual, listInventoryStock };
});

vi.mock('@/config/inventoryStock.config', () => ({ default: true }));
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
/**
 * La transición entre pasos del asistente no aporta a estas pruebas y en jsdom
 * demora el cambio de paso: `framer-motion` se sustituye por elementos planos.
 */
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
/**
 * `react-select` no expone sus opciones como controles nativos en jsdom; como
 * en `StockPorUbicacion.test.tsx`, `SelectReact` se sustituye por un `<select>`
 * nativo cableado a las mismas props.
 */
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
			permisos: ['view-product', 'edit-product'] as string[],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid='location'>{location.search}</output>;
};

const renderPage = (entry: string) => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[entry]}>
				<AjustesTrasladosView />
				<LocationProbe />
			</MemoryRouter>
		</Provider>,
	);
};

afterEach(() => {
	stockDouble.list = null;
	stockDouble.calls = [];
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Ajustes y traslados — una página con dos pestañas', () => {
	it('abre la pestaña de ajuste por omisión y sin montar el traslado', () => {
		renderPage('/');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
		// El traslado no carga su stock hasta que se abre su pestaña.
		expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument();
	});

	it('respeta `?tab=traslado` y descarta un valor desconocido', () => {
		const { unmount } = renderPage('/?tab=traslado');
		expect(screen.getByRole('tab', { name: 'Traslados internos' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		unmount();

		renderPage('/?tab=otra');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
	});

	it('cambia de pestaña en la URL y reinicia el progreso de la otra', () => {
		renderPage('/?tab=ajuste');
		fireEvent.change(screen.getByLabelText('Ubicación'), {
			target: { value: 'unlocated' },
		});

		fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=traslado');
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();
		// Sólo la pestaña activa queda montada.
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Ajuste de inventario' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=ajuste');
		expect(screen.getByLabelText('Ubicación')).toHaveValue('');
	});

	it('nombra el paso de la pestaña activa con un título dentro de su sección', () => {
		renderPage('/?tab=ajuste');
		fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));

		const sections = [...document.querySelectorAll('section[aria-labelledby]')];
		expect(sections).toHaveLength(1);
		const titleId = sections[0].getAttribute('aria-labelledby') ?? '';
		expect(sections[0]).toContainElement(document.getElementById(titleId));
		expect(screen.getByRole('region', { name: /Origen y destino/ })).toBeInTheDocument();
		expect(
			screen.queryByRole('region', { name: /Paso 1 de 3: Ubicación/ }),
		).not.toBeInTheDocument();
	});
	describe('preselección por URL', () => {
		const MOUSE_ID = 31;
		/** Estante A3, bodega de la sucursal 4 con stock del mouse. */
		const SHELF_ID = 12;
		/** Bodega Sucursal Sur: existe, pero es de la sucursal 6. */
		const SOUTH_BRANCH_WAREHOUSE_ID = 15;

		it('abre el ajuste en «Productos» con la ubicación y el producto elegidos', async () => {
			renderPage(`/?tab=ajuste&warehouse_id=${SHELF_ID}&product_id=${MOUSE_ID}`);

			expect(
				await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ }),
			).toBeInTheDocument();
			expect(screen.getByText('Estante A3')).toBeInTheDocument();
			expect(screen.getByLabelText('Producto de la línea 1')).toHaveValue(String(MOUSE_ID));
		});

		it('«Sin ubicación» viaja como `warehouse_id=unlocated`', async () => {
			renderPage(`/?tab=ajuste&warehouse_id=unlocated&product_id=${MOUSE_ID}`);

			await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ });
			expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
			expect(screen.getByLabelText('Producto de la línea 1')).toHaveValue(String(MOUSE_ID));
		});

		it.each([
			['un id que no es numérico', 'warehouse_id=abc&product_id=31'],
			['un id con signo o decimales', 'warehouse_id=-12&product_id=31.5'],
			[
				'una bodega de otra sucursal',
				`warehouse_id=${SOUTH_BRANCH_WAREHOUSE_ID}&product_id=31`,
			],
			['un producto sin ubicación', `product_id=${MOUSE_ID}`],
		])('ignora %s y abre el asistente vacío', (_caso, query) => {
			renderPage(`/?tab=ajuste&${query}`);

			expect(
				screen.getByRole('heading', { name: /Paso 1 de 3: Ubicación/ }),
			).toBeInTheDocument();
			expect(screen.getByLabelText('Ubicación')).toHaveValue('');
		});

		it('conserva la ubicación válida e ignora un producto que no está en el catálogo', async () => {
			renderPage(`/?tab=ajuste&warehouse_id=${SHELF_ID}&product_id=999999`);

			await screen.findByRole('heading', { name: /Paso 2 de 3: Productos/ });
			expect(screen.getByLabelText('Producto de la línea 1')).toHaveValue('');
		});

		it('el traslado toma la bodega como origen y elige el producto cuando el origen lo tiene', async () => {
			renderPage(`/?tab=traslado&warehouse_id=${SHELF_ID}&product_id=${MOUSE_ID}`);

			expect(screen.getByLabelText('Origen')).toHaveValue(`warehouse:${SHELF_ID}`);
			fireEvent.change(screen.getByLabelText('Destino'), {
				target: { value: 'warehouse:8' },
			});
			const next = screen.getByRole('button', { name: 'Siguiente' });
			await waitFor(() => expect(next).toBeEnabled());
			fireEvent.click(next);

			const product = await screen.findByLabelText('Producto de la línea 1');
			await waitFor(() => expect(product).toHaveValue(String(MOUSE_ID)));
		});

		it('el traslado descarta un producto que el origen no tiene', async () => {
			renderPage(`/?tab=traslado&warehouse_id=${SHELF_ID}&product_id=999999`);

			fireEvent.change(screen.getByLabelText('Destino'), {
				target: { value: 'warehouse:8' },
			});
			const next = screen.getByRole('button', { name: 'Siguiente' });
			await waitFor(() => expect(next).toBeEnabled());
			fireEvent.click(next);

			const product = await screen.findByLabelText('Producto de la línea 1');
			// Espera a que cargue el stock del origen antes de afirmar que quedó vacío.
			await waitFor(() => expect(product).toBeEnabled());
			expect(product).toHaveValue('');
		});

		it('el traslado ignora un origen de otra sucursal', async () => {
			renderPage(`/?tab=traslado&warehouse_id=${SOUTH_BRANCH_WAREHOUSE_ID}&product_id=31`);

			// El `<select>` no tiene opción para esa bodega y se vería vacío aunque
			// el formulario la guardara: lo que prueba que se ignoró es que el
			// asistente no avanza sin origen.
			fireEvent.change(screen.getByLabelText('Destino'), {
				target: { value: 'warehouse:8' },
			});
			const next = screen.getByRole('button', { name: 'Siguiente' });
			await waitFor(() => expect(next).toBeEnabled());
			fireEvent.click(next);
			await waitFor(() => expect(next).toBeEnabled());

			expect(
				screen.getByRole('heading', { name: /Paso 1 de 3: Origen y destino/ }),
			).toBeInTheDocument();
			expect(screen.getByLabelText('Origen')).toHaveValue('');
		});

		it('cambiar de pestaña descarta la preselección', async () => {
			renderPage(`/?tab=ajuste&warehouse_id=${SHELF_ID}&product_id=${MOUSE_ID}`);
			// Deja terminar la carga del stock del ajuste antes de desmontarlo: el
			// saldo de la línea pasa de «—» a una cifra.
			const lines = await screen.findByRole('table', { name: 'Líneas del ajuste' });
			await waitFor(() =>
				expect(within(lines).getAllByRole('cell')[2]).toHaveTextContent(/^\d+$/),
			);

			fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));
			expect(screen.getByTestId('location')).toHaveTextContent(/^\?tab=traslado$/);
			expect(screen.getByLabelText('Origen')).toHaveValue('');
		});
	});
	describe('preselección de traslado con el origen paginado', () => {
		const SHELF_ID = 12;
		/** 150 productos en el origen: con 100 por página, el 130 cae en la página 2. */
		const PAGED_PRODUCT_ID = 5130;

		/**
		 * Origen simulado de 150 productos, paginado como el servicio: parte de
		 * una respuesta real del Estante A3 y sólo reemplaza filas y `meta`.
		 */
		const installPagedOrigin = async () => {
			const { listInventoryStock } = await vi.importActual<typeof InventoryStockService>(
				'@/services/procurement/inventoryStock.service',
			);
			const base = await listInventoryStock(4, { warehouse_id: SHELF_ID });
			const template = base.data[0];
			const rows = Array.from({ length: 150 }, (_, index) => ({
				...template,
				product: {
					...template.product,
					id: 5001 + index,
					name: `Producto ${String(index + 1).padStart(3, '0')}`,
					sku: `PAG-${5001 + index}`,
				},
			}));
			stockDouble.list = (_branchId, params) => {
				const perPage = params?.per_page ?? 15;
				const lastPage = Math.ceil(rows.length / perPage);
				const current = Math.min(params?.page ?? 1, lastPage);
				const data = rows.slice((current - 1) * perPage, current * perPage);
				return Promise.resolve({
					...base,
					data,
					meta: {
						...base.meta,
						current_page: current,
						last_page: lastPage,
						per_page: perPage,
						total: rows.length,
					},
				});
			};
		};

		const goToItems = async () => {
			fireEvent.change(screen.getByLabelText('Destino'), {
				target: { value: 'warehouse:8' },
			});
			const next = screen.getByRole('button', { name: 'Siguiente' });
			await waitFor(() => expect(next).toBeEnabled());
			fireEvent.click(next);
			return screen.findByLabelText('Producto de la línea 1');
		};

		it('busca en las páginas siguientes un producto que no está en la primera', async () => {
			await installPagedOrigin();
			renderPage(`/?tab=traslado&warehouse_id=${SHELF_ID}&product_id=${PAGED_PRODUCT_ID}`);

			const product = await goToItems();
			await waitFor(() => expect(product).toHaveValue(String(PAGED_PRODUCT_ID)));
			// También se ofrece en el selector, con su saldo de la página 2.
			expect(
				within(product).getByRole('option', {
					name: `PAG-${PAGED_PRODUCT_ID} · Producto 130`,
				}),
			).toBeInTheDocument();
			expect(stockDouble.calls).toContainEqual(
				expect.objectContaining({ warehouse_id: SHELF_ID, page: 2, per_page: 100 }),
			);
		});

		it('cambiar el origen mientras se busca descarta el producto', async () => {
			await installPagedOrigin();
			const paged = stockDouble.list;
			let releasePage2: () => void = () => {};
			const page2Gate = new Promise<void>((resolve) => {
				releasePage2 = resolve;
			});
			stockDouble.list = async (branchId, params, signal) => {
				if (params?.page === 2) await page2Gate;
				if (!paged) throw new Error('Falta el origen paginado.');
				return paged(branchId, params, signal);
			};
			renderPage(`/?tab=traslado&warehouse_id=${SHELF_ID}&product_id=${PAGED_PRODUCT_ID}`);

			await waitFor(() =>
				expect(stockDouble.calls).toContainEqual(expect.objectContaining({ page: 2 })),
			);
			fireEvent.change(screen.getByLabelText('Origen'), { target: { value: 'unlocated' } });
			releasePage2();

			const product = await goToItems();
			await waitFor(() => expect(product).toBeEnabled());
			expect(product).toHaveValue('');
		});

		it('recorre todas las páginas antes de descartar un producto que el origen no tiene', async () => {
			await installPagedOrigin();
			renderPage(`/?tab=traslado&warehouse_id=${SHELF_ID}&product_id=999999`);

			const product = await goToItems();
			await waitFor(() => expect(product).toBeEnabled());
			expect(product).toHaveValue('');
			expect(stockDouble.calls).toContainEqual(expect.objectContaining({ page: 2 }));
		});
	});
	describe('saldo del ajuste con la ubicación paginada', () => {
		const SHELF_ID = 12;
		const MOUSE_ID = 31;

		/**
		 * Estante A3 con 120 productos de relleno delante de sus filas reales: con
		 * 100 por página, el mouse cae en la página 2.
		 */
		const installPagedShelf = async () => {
			const { listInventoryStock } = await vi.importActual<typeof InventoryStockService>(
				'@/services/procurement/inventoryStock.service',
			);
			const base = await listInventoryStock(4, { warehouse_id: SHELF_ID });
			const template = base.data[0];
			const fillers = Array.from({ length: 120 }, (_, index) => ({
				...template,
				product: { ...template.product, id: 7001 + index, sku: `REL-${7001 + index}` },
			}));
			const rows = [...fillers, ...base.data];
			stockDouble.list = (_branchId, params) => {
				const perPage = params?.per_page ?? 15;
				const lastPage = Math.ceil(rows.length / perPage);
				const current = Math.min(params?.page ?? 1, lastPage);
				return Promise.resolve({
					...base,
					data: rows.slice((current - 1) * perPage, current * perPage),
					meta: {
						...base.meta,
						current_page: current,
						last_page: lastPage,
						per_page: perPage,
						total: rows.length,
					},
				});
			};
			return base.data.find((row) => row.product.id === MOUSE_ID)?.fit_quantity ?? 0;
		};

		it('muestra el saldo de un producto que está fuera de la primera página', async () => {
			const mouseFit = await installPagedShelf();
			expect(mouseFit).toBeGreaterThan(0);
			renderPage(`/?tab=ajuste&warehouse_id=${SHELF_ID}&product_id=${MOUSE_ID}`);

			const lines = await screen.findByRole('table', { name: 'Líneas del ajuste' });
			await waitFor(() =>
				expect(within(lines).getAllByRole('cell')[2]).toHaveTextContent(
					new RegExp(`^${mouseFit}$`),
				),
			);
			expect(stockDouble.calls).toContainEqual(
				expect.objectContaining({ warehouse_id: SHELF_ID, page: 2, per_page: 100 }),
			);
		});

		it('si falla la búsqueda en otras páginas, el saldo queda desconocido y no en cero', async () => {
			await installPagedShelf();
			const paged = stockDouble.list;
			stockDouble.list = (branchId, params, signal) => {
				if (params?.page === 2) return Promise.reject(new Error('Sin red'));
				if (!paged) throw new Error('Falta la ubicación paginada.');
				return paged(branchId, params, signal);
			};
			renderPage(`/?tab=ajuste&warehouse_id=${SHELF_ID}&product_id=${MOUSE_ID}`);

			expect(
				await screen.findByText(
					'No se pudo consultar el saldo de todos los productos elegidos.',
				),
			).toBeInTheDocument();
			const lines = screen.getByRole('table', { name: 'Líneas del ajuste' });
			expect(within(lines).getAllByRole('cell')[2]).toHaveTextContent(/^—$/);
		});
	});
});
