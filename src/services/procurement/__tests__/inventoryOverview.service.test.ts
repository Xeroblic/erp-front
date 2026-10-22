import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IInventoryStockRow, IProcurementProduct } from '@/interface/procurement.interface';

/**
 * La fachada elige el doble o la API real según su bandera. Acá se prueba
 * cómo la rama real arma cada pieza con `inventory-stock`, `origins` y el
 * catálogo de bodegas.
 */

interface IRequestConfig {
	url: string;
	params?: Record<string, unknown>;
	signal?: AbortSignal;
}

const fetchData = vi.hoisted(() => vi.fn<(config: IRequestConfig) => Promise<unknown>>());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async ({ overview = false, stock = false } = {}) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryOverview.config', () => ({ default: overview }));
	vi.doMock('@/config/inventoryStock.config', () => ({ default: stock }));
	const facade = await import('@/services/procurement/inventoryOverview.service');
	// Tras resetModules, la clase del error es la del registro nuevo, no la de arriba.
	const { ProcurementEndpointNotPublishedError } = await import(
		'@/utils/procurementEndpoint.util'
	);
	return { ...facade, ProcurementEndpointNotPublishedError };
};

const product = (id: number, sku: string): IProcurementProduct => ({
	id,
	sku,
	commercial_sku: null,
	name: `Producto ${id}`,
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: null,
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
});

const stockRow = (id: number, quantity: number, sku = `SKU-${id}`): IInventoryStockRow => ({
	product: product(id, sku),
	physical_quantity: quantity,
	fit_quantity: quantity - 1,
	unfit_quantity: 1,
	documented_quantity: 1,
	undocumented_quantity: quantity - 1,
});

const stockPage = (rows: IInventoryStockRow[], total = rows.length, lastPage = 1) => ({
	data: {
		data: rows,
		links: { first: null, last: null, prev: null, next: null },
		meta: {
			current_page: 1,
			from: rows.length ? 1 : null,
			last_page: lastPage,
			links: [],
			path: '/api/branches/4/inventory-stock',
			per_page: 15,
			to: rows.length || null,
			total,
		},
		context: { scope: 'branch', branch_id: 4, warehouse: null },
	},
});

const warehousesPage = (rows: Record<string, unknown>[]) => ({
	data: { data: rows, meta: { last_page: 1 } },
});

const axiosError = (status: number) =>
	Object.assign(new Error(`HTTP ${status}`), {
		isAxiosError: true,
		response: { status, data: { message: `HTTP ${status}` } },
	});

const calls = () => fetchData.mock.calls.map(([config]) => config);

afterEach(() => {
	vi.doUnmock('@/config/inventoryOverview.config');
	vi.doUnmock('@/config/inventoryStock.config');
	fetchData.mockReset();
});

describe('inventoryOverview.service (fachada)', () => {
	it('con datos simulados delega en el doble y ofrece todo', async () => {
		const facade = await loadFacade({ overview: true, stock: true });
		const mock = await import('@/mocks/services/inventoryOverview.mock');

		expect(facade.listInventoryOverview).toBe(mock.listInventoryOverview);
		expect(facade.getInventoryStockSummary).toBe(mock.getInventoryStockSummary);
		expect(facade.listInventoryWarehouseAggregates).toBe(mock.listInventoryWarehouseAggregates);
		expect(facade.getInventoryStockDetail).toBe(mock.getInventoryStockDetail);
		expect(facade.updateInventoryCriticalThreshold).toBe(mock.updateInventoryCriticalThreshold);
		expect(Object.values(facade.INVENTORY_OVERVIEW_FEATURES).every(Boolean)).toBe(true);
	});

	it('sin datos simulados ofrece el umbral de la ficha y oculta lo que el backend no publica', async () => {
		const facade = await loadFacade({ overview: false, stock: true });

		expect(facade.INVENTORY_OVERVIEW_FEATURES).toEqual({
			sort: false,
			stockStatus: false,
			availability: false,
			// §13 publicado en el producto, en las dos etapas; la lista no lo trae por fila.
			threshold: true,
			rowThreshold: false,
			unitTotals: false,
		});
		expect(facade.INVENTORY_THRESHOLD_USES_API).toBe(true);
	});

	it('la ficha simulada guarda el umbral en el doble sólo si lee del mismo doble', async () => {
		const simulated = await loadFacade({ overview: true, stock: true });
		expect(simulated.INVENTORY_THRESHOLD_USES_API).toBe(false);
		expect(simulated.INVENTORY_OVERVIEW_FEATURES.threshold).toBe(true);

		const mixed = await loadFacade({ overview: true, stock: false });
		expect(mixed.INVENTORY_OVERVIEW_FEATURES.threshold).toBe(false);

		// Reportes sigue simulado: su umbral es siempre el del doble.
		const real = await loadFacade({ overview: false, stock: false });
		const mock = await import('@/mocks/services/inventoryOverview.mock');
		expect(real.updateInventoryCriticalThreshold).toBe(mock.updateInventoryCriticalThreshold);
	});
});

describe('inventoryOverview.service (API real)', () => {
	it('lista con `inventory-stock` y omite lo que la ruta no entiende', async () => {
		fetchData.mockResolvedValue(stockPage([stockRow(31, 5)]));
		const { listInventoryOverview } = await loadFacade();
		const controller = new AbortController();

		const response = await listInventoryOverview(
			4,
			{
				include: 'warehouses',
				warehouse_id: 8,
				search: '  mouse ',
				stock_status: 'critical',
				sort: '-physical_quantity',
				page: 2,
				per_page: 20,
			},
			controller.signal,
		);

		expect(calls()).toEqual([
			{
				url: '/branches/4/inventory-stock',
				method: 'get',
				params: { warehouse_id: 8, search: 'mouse', page: 2, per_page: 20 },
				signal: controller.signal,
			},
		]);
		expect(response.data[0]).toMatchObject({ warehouses: null, critical_stock: null });
		expect(response.data[0].physical_quantity).toBe(5);
	});

	it('«Sin ubicación» se manda como `unlocated=1`, sin bodega', async () => {
		fetchData.mockResolvedValue(stockPage([]));
		const { listInventoryOverview } = await loadFacade();

		await listInventoryOverview(4, { include: 'warehouses', unlocated: 1 });
		await listInventoryOverview(4, { include: 'warehouses' });

		expect(calls().map((config) => config.params)).toEqual([
			{ unlocated: 1, page: undefined, per_page: undefined },
			{ page: undefined, per_page: undefined },
		]);
	});

	it('el resumen sólo cuenta productos: de la sucursal y de «Sin ubicación»', async () => {
		fetchData.mockImplementation((config) =>
			Promise.resolve(stockPage([], config.params?.unlocated === 1 ? 3 : 12)),
		);
		const { getInventoryStockSummary } = await loadFacade();

		const { data } = await getInventoryStockSummary(4);

		expect(calls().map((config) => config.params)).toEqual([
			{ page: 1, per_page: 1 },
			{ unlocated: 1, page: 1, per_page: 1 },
		]);
		expect(data).toEqual({
			products_count: 12,
			unlocated_products_count: 3,
			physical_quantity: null,
			unfit_quantity: null,
			undocumented_quantity: null,
			unlocated_quantity: null,
			critical_count: null,
			out_count: null,
			unconfigured_count: null,
		});
	});

	it('Por bodega: bodegas reales con sus productos, «Sin ubicación» primero', async () => {
		fetchData.mockImplementation((config) => {
			if (config.url === '/branches/4/warehouses')
				return Promise.resolve(
					warehousesPage([
						{
							id: 8,
							name: 'Central',
							is_active: true,
							code: 'BC',
							maximum_capacity: 500,
						},
						{ id: 9, name: 'Cerrada', is_active: false },
						{ id: 10, name: 'Vieja', is_active: false },
					]),
				);
			const totals: Record<string, number> = { unlocated: 4, '8': 2, '9': 0, '10': 1 };
			const key =
				config.params?.unlocated === 1 ? 'unlocated' : String(config.params?.warehouse_id);
			return Promise.resolve(stockPage([], totals[key]));
		});
		const { listInventoryWarehouseAggregates } = await loadFacade();

		const { data } = await listInventoryWarehouseAggregates(4);

		expect(
			data.map((aggregate) => [aggregate.warehouse?.id ?? null, aggregate.product_count]),
		).toEqual([
			[null, 4],
			[8, 2],
			// La inactiva sin productos no aparece; la que todavía guarda, sí.
			[10, 1],
		]);
		expect(data[1]).toMatchObject({
			warehouse: { id: 8, name: 'Central', code: 'BC', is_active: true },
			maximum_capacity: 500,
			physical_quantity: null,
			critical_count: null,
		});
	});

	it('sin permiso para el catálogo de bodegas sigue con «Sin ubicación»', async () => {
		fetchData.mockImplementation((config) =>
			config.url === '/branches/4/warehouses'
				? Promise.reject(axiosError(403))
				: Promise.resolve(stockPage([], 7)),
		);
		const { listInventoryWarehouseAggregates } = await loadFacade();

		const response = await listInventoryWarehouseAggregates(4);
		const { data } = response;

		expect(data).toHaveLength(1);
		expect(data[0]).toMatchObject({ warehouse: null, product_count: 7 });
		expect(response.warehouses_complete).toBe(false);
	});

	it('la ficha sin catálogo de bodegas declara el reparto incompleto, no vacío', async () => {
		const mouse = stockRow(31, 9, 'MOU-1');
		fetchData.mockImplementation((config) => {
			if (config.url === '/branches/4/warehouses') return Promise.reject(axiosError(403));
			if (config.url.endsWith('/origins'))
				return Promise.resolve({
					data: {
						...stockPage([]).data,
						context: {
							scope: 'branch',
							branch_id: 4,
							warehouse: null,
							product: mouse.product,
							physical_quantity: 9,
							unattributed_quantity: 0,
						},
					},
				});
			// Las 9 unidades están en una bodega: «Sin ubicación» no lo tiene.
			return Promise.resolve(stockPage(config.params?.unlocated === 1 ? [] : [mouse]));
		});
		const { getInventoryStockDetail } = await loadFacade();

		const { data } = await getInventoryStockDetail(4, 31);

		expect(data).toMatchObject({
			physical_quantity: 9,
			warehouses: [],
			warehouses_complete: false,
		});
	});

	it('la ficha toma el producto de `origins` y sus cifras de su fila en cada ubicación', async () => {
		const mouse = stockRow(31, 9, 'MOU-1');
		fetchData.mockImplementation((config) => {
			if (config.url === '/branches/4/inventory-stock/31/origins')
				return Promise.resolve({
					data: {
						...stockPage([]).data,
						context: {
							scope: 'branch',
							branch_id: 4,
							warehouse: null,
							product: mouse.product,
							physical_quantity: 9,
							unattributed_quantity: 0,
						},
					},
				});
			if (config.url === '/branches/4/warehouses')
				return Promise.resolve(
					warehousesPage([{ id: 8, name: 'Central', is_active: true }]),
				);
			// La búsqueda por SKU trae otros productos parecidos: se elige por id.
			const other = stockRow(32, 1, 'MOU-10');
			if (config.params?.warehouse_id === 8) return Promise.resolve(stockPage([other]));
			if (config.params?.unlocated === 1)
				return Promise.resolve(stockPage([other, { ...mouse, physical_quantity: 9 }]));
			return Promise.resolve(stockPage([other, mouse]));
		});
		const { getInventoryStockDetail } = await loadFacade();

		const { data } = await getInventoryStockDetail(4, 31);

		expect(
			calls()
				.filter((config) => config.url === '/branches/4/inventory-stock')
				.every(
					(config) =>
						config.params?.search === 'MOU-1' && config.params?.per_page === 100,
				),
		).toBe(true);
		expect(data).toMatchObject({
			product: { id: 31, critical_stock_threshold: null },
			physical_quantity: 9,
			critical_stock: null,
			series_summary: null,
		});
		// La bodega 8 no tiene el producto: no aparece en el reparto, que está completo.
		expect(data.warehouses.map((location) => location.warehouse?.id ?? null)).toEqual([null]);
		expect(data.warehouses_complete).toBe(true);
	});

	describe('umbral §13 de la ficha', () => {
		const mouse = stockRow(31, 9, 'MOU-1');
		/** `GET B/products/31` responde `resource`; el resto, como una ficha sin bodegas. */
		const routeFicha = (resource: () => Promise<unknown>) =>
			fetchData.mockImplementation((config) => {
				if (config.url === '/branches/4/products/31') return resource();
				if (config.url.endsWith('/origins'))
					return Promise.resolve({
						data: {
							...stockPage([]).data,
							context: {
								scope: 'branch',
								branch_id: 4,
								warehouse: null,
								product: mouse.product,
								physical_quantity: 9,
								unattributed_quantity: 0,
							},
						},
					});
				if (config.url === '/branches/4/warehouses')
					return Promise.resolve(warehousesPage([]));
				return Promise.resolve(stockPage([mouse]));
			});
		const block = {
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

		it('toma el umbral y el bloque de la filial del producto, con el disponible negativo tal cual', async () => {
			routeFicha(() =>
				Promise.resolve({
					data: {
						data: {
							id: 31,
							origin_branch_id: 6,
							serial_tracking: false,
							critical_stock_threshold: 10,
							is_critical_stock: true,
							critical_stock: block,
						},
					},
				}),
			);
			const { getInventoryStockDetail } = await loadFacade();

			const { data } = await getInventoryStockDetail(4, 31);

			expect(data.product.critical_stock_threshold).toBe(10);
			expect(data.critical_stock).toEqual(block);
			// La edición va a la sucursal dueña, no a la consultada.
			expect(data.threshold_branch_id).toBe(6);
		});

		it('un producto con serie no lleva umbral aunque el resource traiga un bloque', async () => {
			routeFicha(() =>
				Promise.resolve({
					data: {
						data: {
							id: 31,
							origin_branch_id: 4,
							serial_tracking: true,
							critical_stock_threshold: 3,
							critical_stock: block,
						},
					},
				}),
			);
			const { getInventoryStockDetail } = await loadFacade();

			const { data } = await getInventoryStockDetail(4, 31);

			expect(data).toMatchObject({
				product: { critical_stock_threshold: null },
				critical_stock: null,
				threshold_branch_id: null,
			});
		});

		it('si la ruta del producto no lo muestra (404) la ficha sigue, sin umbral ni edición', async () => {
			routeFicha(() => Promise.reject(axiosError(404)));
			const { getInventoryStockDetail } = await loadFacade();

			const { data } = await getInventoryStockDetail(4, 31);

			expect(data).toMatchObject({
				physical_quantity: 9,
				critical_stock: null,
				threshold_branch_id: null,
			});
		});
	});

	it('la ficha de un producto con serie o de otra filial es un 404 reconocible', async () => {
		fetchData.mockImplementation((config) =>
			config.url.endsWith('/origins')
				? Promise.reject(axiosError(404))
				: Promise.resolve(warehousesPage([])),
		);
		const { getInventoryStockDetail, isInventoryDetailNotFound } = await loadFacade();

		const error = await getInventoryStockDetail(4, 44).catch((reason: unknown) => reason);

		expect(isInventoryDetailNotFound(error)).toBe(true);
		expect(isInventoryDetailNotFound(axiosError(500))).toBe(false);
	});
});
