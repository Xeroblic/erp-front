import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 * La simulación se prueba en `@/mocks/services/__tests__/inventoryOverview.mock.test.ts`.
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryStock.config', () => ({ default: useMocks }));
	const facade = await import('@/services/procurement/inventoryOverview.service');
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

describe('inventoryOverview.service (fachada)', () => {
	it('con datos simulados delega en el doble, sin pasar por la API', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryOverview.mock');

		expect(facade.listInventoryOverview).toBe(mock.listInventoryOverview);
		expect(facade.getInventoryStockSummary).toBe(mock.getInventoryStockSummary);
		expect(facade.listInventoryWarehouseAggregates).toBe(mock.listInventoryWarehouseAggregates);
		expect(facade.getInventoryStockDetail).toBe(mock.getInventoryStockDetail);
		expect(facade.updateInventoryCriticalThreshold).toBe(mock.updateInventoryCriticalThreshold);
		expect(fetchData).not.toHaveBeenCalled();
	});

	it('sin datos simulados rechaza con un error tipado y nunca inventa datos', async () => {
		const facade = await loadFacade(false);

		const results = await Promise.allSettled([
			facade.listInventoryOverview(4, { include: 'warehouses' }),
			facade.getInventoryStockSummary(4),
			facade.listInventoryWarehouseAggregates(4),
			facade.getInventoryStockDetail(4, 31),
			facade.updateInventoryCriticalThreshold(31, 5),
		]);

		results.forEach((result) => {
			expect(result.status).toBe('rejected');
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(facade.ProcurementEndpointNotPublishedError);
			}
		});
		expect(fetchData).not.toHaveBeenCalled();
	});
});
