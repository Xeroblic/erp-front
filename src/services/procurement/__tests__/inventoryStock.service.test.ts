import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (
	useMocks: boolean,
	transferMocks = useMocks,
	overviewMocks = useMocks,
) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryStock.config', () => ({ default: useMocks }));
	vi.doMock('@/config/inventoryOverview.config', () => ({ default: overviewMocks }));
	vi.doMock('@/config/inventoryAdjustments.config', () => ({ default: useMocks }));
	vi.doMock('@/config/inventoryTransfers.config', () => ({ default: transferMocks }));
	const facade = await import('@/services/procurement/inventoryStock.service');
	// Tras resetModules, la clase del error es la del registro nuevo, no la de arriba.
	const { ProcurementEndpointNotPublishedError } = await import(
		'@/utils/procurementEndpoint.util'
	);
	return { ...facade, ProcurementEndpointNotPublishedError };
};

const page = <T>(data: T[], total = data.length) => ({
	data,
	links: { first: null, last: null, prev: null, next: null },
	meta: { current_page: 1, last_page: 1, per_page: 20, total },
});

afterEach(() => {
	vi.doUnmock('@/config/inventoryStock.config');
	vi.doUnmock('@/config/inventoryOverview.config');
	vi.doUnmock('@/config/inventoryAdjustments.config');
	vi.doUnmock('@/config/inventoryTransfers.config');
	fetchData.mockReset();
});

describe('inventoryStock.service (fachada)', () => {
	it('con datos simulados delega en el doble', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryStock.mock');

		expect(facade.listInventoryStock).toBe(mock.listInventoryStock);
		expect(facade.listInventoryOrigins).toBe(mock.listInventoryOrigins);
		expect(facade.searchInventoryAdjustableProducts).toBe(
			mock.searchInventoryAdjustableProducts,
		);
		expect(facade.createWarehouseStockMovement).toBe(mock.createWarehouseStockMovement);
		expect(facade.createInventoryAdjustment).toBe(mock.createInventoryAdjustment);
		expect(facade.createInventoryDocumentAllocation).toBe(
			mock.createInventoryDocumentAllocation,
		);
		expect(facade.getAdjustmentWarehouses).toBe(mock.getInventoryWarehouses);
	});

	it('con datos simulados ofrece al traslado las bodegas del doble, todas activas', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryStock.mock');

		const warehouses = await facade.listTransferWarehouses(4);

		expect(warehouses).toEqual(
			mock.getInventoryWarehouses(4).map((warehouse) => ({ ...warehouse, is_active: true })),
		);
		expect(fetchData).not.toHaveBeenCalled();
	});

	it('el traslado sigue su propia bandera, no la del resto de Inventario', async () => {
		const facade = await loadFacade(true, false);
		const mock = await import('@/mocks/services/inventoryStock.mock');

		expect(facade.listInventoryStock).toBe(mock.listInventoryStock);
		expect(facade.listTransferStock).not.toBe(mock.listInventoryStock);
		expect(facade.createWarehouseStockMovement).not.toBe(mock.createWarehouseStockMovement);
	});

	it('las pantallas de Inventario leen stock y procedencias con su bandera, no con la de stock', async () => {
		const facade = await loadFacade(true, true, false);
		const mock = await import('@/mocks/services/inventoryStock.mock');

		expect(facade.listInventoryStock).not.toBe(mock.listInventoryStock);
		expect(facade.listInventoryOrigins).not.toBe(mock.listInventoryOrigins);
		expect(facade.getInventoryOriginFilterOptions(4, 31, {})).toBeNull();
		// Respaldar sigue a la ficha: el origen sale de sus procedencias reales.
		expect(facade.createInventoryDocumentAllocation).not.toBe(
			mock.createInventoryDocumentAllocation,
		);
	});

	it('la lista de respaldos de un documento usa siempre la API real', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryStock.mock');

		expect(facade.listInitialStockAllocationsForPurchaseDocument).not.toBe(
			mock.listInitialStockAllocationsForPurchaseDocument,
		);
	});

	describe('sin datos simulados', () => {
		it('lista el stock de la sucursal con los filtros tal cual y la señal de cancelación', async () => {
			const facade = await loadFacade(false);
			const body = {
				...page([]),
				context: { scope: 'unlocated', branch_id: 4, warehouse: null },
			};
			fetchData.mockResolvedValueOnce({ data: body });
			const controller = new AbortController();

			const response = await facade.listInventoryStock(
				4,
				{ unlocated: 1, search: 'mouse', page: 2, per_page: 50 },
				controller.signal,
			);

			expect(response).toBe(body);
			expect(fetchData).toHaveBeenCalledWith({
				url: '/branches/4/inventory-stock',
				method: 'get',
				params: { unlocated: 1, search: 'mouse', page: 2, per_page: 50 },
				signal: controller.signal,
			});
		});

		it('lista las procedencias de un producto con sus filtros', async () => {
			const facade = await loadFacade(false);
			const body = {
				...page([]),
				context: {
					scope: 'warehouse',
					branch_id: 4,
					warehouse: { id: 8, name: 'Bodega' },
					physical_quantity: 8,
					unattributed_quantity: 3,
				},
			};
			fetchData.mockResolvedValueOnce({ data: body });

			const response = await facade.listInventoryOrigins(4, 31, {
				warehouse_id: 8,
				supplier_id: 7,
			});

			expect(response.context).toMatchObject({ unattributed_quantity: 3 });
			expect(fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/branches/4/inventory-stock/31/origins',
					method: 'get',
					params: { warehouse_id: 8, supplier_id: 7 },
				}),
			);
		});

		it('busca productos corregibles con include_empty y avisa si hay más', async () => {
			const facade = await loadFacade(false);
			const row = { product: { id: 31, name: 'Mouse USB' }, physical_quantity: 0 };
			fetchData.mockResolvedValueOnce({ data: { ...page([row], 45), context: {} } });

			const result = await facade.searchInventoryAdjustableProducts(
				4,
				2,
				{ unlocated: 1 },
				'  mou ',
			);

			expect(result).toEqual({ data: [row], has_more: true });
			expect(fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/branches/4/inventory-stock',
					params: {
						unlocated: 1,
						search: 'mou',
						include_empty: 1,
						page: 1,
						per_page: 20,
					},
				}),
			);
		});

		it('valida un producto preseleccionado por elegibilidad, no por saldo', async () => {
			const facade = await loadFacade(false);
			fetchData
				.mockResolvedValueOnce({
					data: { data: { id: 58, sku: 'CBL', name: 'Cable', serial_tracking: false } },
				})
				.mockResolvedValueOnce({
					data: { data: { id: 7, sku: 'NB', name: 'Notebook', serial_tracking: true } },
				})
				.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404, data: {} } })
				.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500, data: {} } })
				.mockResolvedValueOnce({ data: '<html>' });

			await expect(facade.getInventoryAdjustableProduct(2, 58)).resolves.toEqual({
				id: 58,
				sku: 'CBL',
				name: 'Cable',
			});
			// Serializado o de otra filial (404): el backend rechazaría la línea.
			await expect(facade.getInventoryAdjustableProduct(2, 7)).resolves.toBeNull();
			await expect(facade.getInventoryAdjustableProduct(2, 99)).resolves.toBeNull();
			// Un 500 o un cuerpo ilegible no prueban nada: se propaga como incierto.
			await expect(facade.getInventoryAdjustableProduct(2, 58)).rejects.toBeDefined();
			await expect(facade.getInventoryAdjustableProduct(2, 58)).rejects.toThrow();
			expect(fetchData).toHaveBeenCalledWith(
				expect.objectContaining({ url: '/subsidiaries/2/products/58', method: 'get' }),
			);
		});

		it('recorta la búsqueda a los 100 caracteres que admite el backend', async () => {
			const facade = await loadFacade(false);
			fetchData.mockResolvedValueOnce({ data: { ...page([]), context: {} } });

			await facade.searchInventoryAdjustableProducts(4, 2, { unlocated: 1 }, 'x'.repeat(150));

			const [[request]] = fetchData.mock.calls as [[{ params: { search: string } }]];
			expect(request.params.search).toHaveLength(100);
		});

		it('registra el ajuste con su Idempotency-Key y devuelve la operación', async () => {
			const facade = await loadFacade(false);
			const operation = { id: 'uuid', operation_type: 'inventory_adjustment', items: [] };
			fetchData.mockResolvedValueOnce({ data: { data: operation } });
			const payload = {
				warehouse_id: null,
				reason: 'Conteo físico semanal',
				notes: null,
				items: [{ product_id: 31, quantity_delta: -2, condition: 'fit' as const }],
			};

			const response = await facade.createInventoryAdjustment(4, payload, {
				idempotencyKey: 'key-1',
			});

			expect(response).toEqual({ data: operation });
			expect(fetchData).toHaveBeenCalledWith({
				url: '/branches/4/inventory-adjustments',
				method: 'post',
				data: payload,
				headers: { 'Idempotency-Key': 'key-1' },
			});
		});

		it('etapa 1: el ajuste no ofrece bodegas y el disponible no se conoce', async () => {
			const facade = await loadFacade(false);

			expect(facade.getAdjustmentWarehouses(4)).toEqual([]);
			expect(facade.getInventoryStockAvailability(4, 31)).toBeNull();
		});

		it('registra el traslado con su Idempotency-Key y devuelve la operación', async () => {
			const facade = await loadFacade(false);
			const movement = {
				id: 'uuid',
				operation_type: 'warehouse_stock_placement',
				branch_id: 4,
				from_warehouse_id: null,
				to_warehouse_id: 8,
				reason: 'Ubicar productos del conteo inicial',
				global_stock_delta: 0,
				created_at: '2026-09-23T10:15:00-04:00',
				items: [
					{
						product_id: 31,
						quantity: 5,
						condition: 'fit',
						origin_quantity_after: 0,
						destination_quantity_after: 5,
					},
				],
			};
			fetchData.mockResolvedValueOnce({ data: { data: movement } });
			const payload = {
				from_warehouse_id: null,
				to_warehouse_id: 8,
				reason: 'Ubicar productos del conteo inicial',
				items: [{ product_id: 31, quantity: 5, condition: 'fit' as const }],
			};

			const response = await facade.createWarehouseStockMovement(4, payload, {
				idempotencyKey: 'key-2',
			});

			expect(response).toEqual({ data: movement });
			expect(fetchData).toHaveBeenCalledWith({
				url: '/branches/4/warehouse-stock-movements',
				method: 'post',
				data: payload,
				headers: { 'Idempotency-Key': 'key-2' },
			});
		});

		it('lee todas las páginas de bodegas, con su estado, y descarta las filas ilegibles', async () => {
			const facade = await loadFacade(false);
			const warehousePage = (data: unknown[], currentPage: number) => ({
				data: {
					data,
					meta: { current_page: currentPage, last_page: 2, per_page: 100, total: 3 },
				},
			});
			fetchData
				.mockResolvedValueOnce(
					warehousePage(
						[
							{ id: 8, name: 'Bodega Central', is_active: true, branch_id: 4 },
							{ id: 9, name: 'Sin estado' },
						],
						1,
					),
				)
				.mockResolvedValueOnce(
					warehousePage([{ id: 12, name: 'Bodega Vieja', is_active: false }], 2),
				);
			const controller = new AbortController();

			const warehouses = await facade.listTransferWarehouses(4, controller.signal);

			expect(warehouses).toEqual([
				{ id: 8, name: 'Bodega Central', is_active: true },
				{ id: 12, name: 'Bodega Vieja', is_active: false },
			]);
			expect(fetchData).toHaveBeenNthCalledWith(1, {
				url: '/branches/4/warehouses',
				method: 'get',
				params: { page: 1, per_page: 100 },
				signal: controller.signal,
			});
			expect(fetchData).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({ params: { page: 2, per_page: 100 } }),
			);
		});

		it('las opciones de filtro de procedencias no existen: la ficha oculta esos filtros', async () => {
			const facade = await loadFacade(false);

			expect(facade.getInventoryOriginFilterOptions(4, 31, {})).toBeNull();
			expect(fetchData).not.toHaveBeenCalled();
		});

		it('respalda stock inicial con POST a la sucursal y al producto, con su clave', async () => {
			const facade = await loadFacade(false);
			const allocation = {
				id: 77,
				product_id: 31,
				branch_id: 3,
				warehouse_id: null,
				original_origin_id: 51,
				documented_origin_id: 77,
				quantity: 10,
				remaining_undocumented_quantity: 90,
				physical_stock_delta: 0,
			};
			fetchData.mockResolvedValueOnce({ data: { data: allocation } });
			const payload = {
				origin_id: 51,
				warehouse_id: null,
				purchase_document_line_id: 101,
				quantity: 10,
				reason: 'Respaldo parcial del conteo inicial',
			};

			const result = await facade.createInventoryDocumentAllocation(1, 3, 31, payload, {
				idempotencyKey: 'k-alloc',
			});

			expect(fetchData).toHaveBeenCalledWith({
				url: '/branches/3/inventory-stock/31/document-allocations',
				method: 'post',
				data: payload,
				headers: { 'Idempotency-Key': 'k-alloc' },
			});
			expect(result).toEqual({ data: allocation });
		});

		it('lista los respaldos de un documento con la página pedida', async () => {
			const facade = await loadFacade(false);
			const body = page([{ id: 77 }], 1);
			fetchData.mockResolvedValueOnce({ data: body });

			const response = await facade.listInitialStockAllocationsForPurchaseDocument(1, 24, {
				page: 2,
				per_page: 10,
			});

			expect(fetchData).toHaveBeenCalledWith({
				url: '/subsidiaries/1/procurement/purchase-documents/24/initial-stock-allocations',
				method: 'get',
				params: { page: 2, per_page: 10 },
			});
			expect(response).toBe(body);
		});
	});
});
