import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 * La simulación se prueba en `@/mocks/services/__tests__/inventoryStock.mock.test.ts`.
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryStock.config', () => ({ default: useMocks }));
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
		expect(facade.getInventoryWarehouses).toBe(mock.getInventoryWarehouses);
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

		it('etapa 1: sin bodegas ni disponible', async () => {
			const facade = await loadFacade(false);

			expect(facade.getInventoryWarehouses(4)).toEqual([]);
			expect(facade.getInventoryStockAvailability(4, 31)).toBeNull();
		});

		it('rechaza con un error tipado lo que el backend no publica, sin llamar a la red', async () => {
			const facade = await loadFacade(false);

			const results = await Promise.allSettled([
				facade.createWarehouseStockMovement(4, {
					from_warehouse_id: 8,
					to_warehouse_id: 15,
					reason: 'Orden de bodega',
					items: [],
				}),
				facade.listInitialStockAllocationsForPurchaseDocument(1, 24),
			]);

			results.forEach((result) => {
				expect(result.status).toBe('rejected');
				if (result.status === 'rejected') {
					expect(result.reason).toBeInstanceOf(
						facade.ProcurementEndpointNotPublishedError,
					);
				}
			});
			expect(fetchData).not.toHaveBeenCalled();
			expect(() => facade.getInventoryOriginFilterOptions(4, 31, {})).toThrow(
				facade.ProcurementEndpointNotPublishedError,
			);
		});

		it('el rechazo nombra la ruta pendiente del contrato', async () => {
			const facade = await loadFacade(false);

			const error = await facade
				.createWarehouseStockMovement(4, {
					from_warehouse_id: 8,
					to_warehouse_id: 15,
					reason: 'x',
					items: [],
				})
				.catch((reason: unknown) => reason);

			expect(error).toMatchObject({
				endpoint: 'POST /branches/{branch}/warehouse-stock-movements',
			});
		});
	});
});
