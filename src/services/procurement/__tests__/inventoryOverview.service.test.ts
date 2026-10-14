import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IInventoryStockRow, IProcurementProduct } from '@/interface/procurement.interface';

/**
 * La fachada elige el doble o la API real según su bandera. La simulación se
 * prueba en `@/mocks/services/__tests__/inventoryOverview.mock.test.ts`; acá,
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

	it('sin datos simulados no ofrece lo que el backend no publica', async () => {
		const facade = await loadFacade({ overview: false, stock: true });

		expect(facade.INVENTORY_OVERVIEW_FEATURES).toEqual({
			sort: false,
			stockStatus: false,
			availability: false,
			threshold: false,
			documentAllocation: false,
			unitTotals: false,
		});
	});

	it('el umbral sigue la bandera de stock, que comparte con Reportes', async () => {
		const simulated = await loadFacade({ overview: false, stock: true });
		const mock = await import('@/mocks/services/inventoryOverview.mock');
		expect(simulated.updateInventoryCriticalThreshold).toBe(
			mock.updateInventoryCriticalThreshold,
		);
		expect(simulated.INVENTORY_OVERVIEW_FEATURES.threshold).toBe(false);

		const real = await loadFacade({ overview: false, stock: false });
		await expect(real.updateInventoryCriticalThreshold(31, 5)).rejects.toBeInstanceOf(
			real.ProcurementEndpointNotPublishedError,
		);
		expect(fetchData).not.toHaveBeenCalled();
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

		const { data } = await listInventoryWarehouseAggregates(4);

		expect(data).toHaveLength(1);
		expect(data[0]).toMatchObject({ warehouse: null, product_count: 7 });
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
		// La bodega 8 no tiene el producto: no aparece en el reparto.
		expect(data.warehouses.map((location) => location.warehouse?.id ?? null)).toEqual([null]);
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
