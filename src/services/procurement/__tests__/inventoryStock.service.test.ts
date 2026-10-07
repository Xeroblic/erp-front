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
		expect(facade.createWarehouseStockMovement).toBe(mock.createWarehouseStockMovement);
		expect(facade.createInventoryAdjustment).toBe(mock.createInventoryAdjustment);
		expect(facade.createInventoryDocumentAllocation).toBe(
			mock.createInventoryDocumentAllocation,
		);
		expect(facade.getInventoryWarehouses).toBe(mock.getInventoryWarehouses);
	});

	it('sin datos simulados rechaza con un error tipado y nunca inventa datos', async () => {
		const facade = await loadFacade(false);

		const results = await Promise.allSettled([
			facade.listInventoryStock(4),
			facade.listInventoryOrigins(4, 31),
			facade.createWarehouseStockMovement(4, {
				from_warehouse_id: 8,
				to_warehouse_id: 15,
				reason: 'Orden de bodega',
				items: [],
			}),
			facade.createInventoryAdjustment(4, {
				warehouse_id: 8,
				reason: 'Conteo',
				items: [],
			}),
			facade.listInitialStockAllocationsForPurchaseDocument(1, 24),
		]);

		results.forEach((result) => {
			expect(result.status).toBe('rejected');
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(facade.ProcurementEndpointNotPublishedError);
			}
		});
		expect(fetchData).not.toHaveBeenCalled();
		expect(() => facade.getInventoryWarehouses(4)).toThrow(
			facade.ProcurementEndpointNotPublishedError,
		);
		expect(() => facade.getInventoryAdjustableProducts(1)).toThrow(
			facade.ProcurementEndpointNotPublishedError,
		);
		expect(() => facade.getInventoryStockAvailability(4, 31)).toThrow(
			facade.ProcurementEndpointNotPublishedError,
		);
	});

	it('el rechazo nombra la ruta pendiente del contrato', async () => {
		const facade = await loadFacade(false);

		const error = await facade.listInventoryStock(4).catch((reason: unknown) => reason);

		expect(error).toMatchObject({ endpoint: 'GET /branches/{branch}/inventory-stock' });
	});
});
