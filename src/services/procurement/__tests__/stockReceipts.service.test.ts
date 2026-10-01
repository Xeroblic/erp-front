import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 * La simulación se prueba en `@/mocks/services/__tests__/stockReceipts.mock.test.ts`.
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryStock.config', () => ({ default: useMocks }));
	return import('@/services/procurement/stockReceipts.service');
};

afterEach(() => {
	vi.doUnmock('@/config/inventoryStock.config');
	fetchData.mockReset();
});

describe('stockReceipts.service (fachada)', () => {
	it('con datos simulados delega en el doble, sin pasar por la API', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/stockReceipts.mock');

		expect(facade.listStockReceipts).toBe(mock.listStockReceipts);
		expect(facade.getStockReceipt).toBe(mock.getStockReceipt);
		expect(facade.createStockReceipt).toBe(mock.createStockReceipt);
		expect(facade.postStockReceipt).toBe(mock.postStockReceipt);
		expect(facade.reverseStockReceipt).toBe(mock.reverseStockReceipt);
		expect(facade.listWarehousesForStockReceipts).toBe(mock.listWarehousesForStockReceipts);
		expect(facade.listStockReceiptSuppliers).toBe(mock.listStockReceiptSuppliers);
		expect(fetchData).not.toHaveBeenCalled();
	});

	it('sin datos simulados rechaza con un error tipado y nunca inventa datos', async () => {
		const facade = await loadFacade(false);

		const calls = [
			facade.listStockReceipts(1),
			facade.getStockReceipt(1, 80),
			facade.listStockReceiptsForPurchaseDocument(1, 24),
			facade.postStockReceipt(1, 80, { id: 7, name: 'Ana Soto' }),
			facade.reverseStockReceipt(1, 80, { reason: 'Error de digitación' }),
		];
		const results = await Promise.allSettled(calls);

		results.forEach((result) => {
			expect(result.status).toBe('rejected');
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(facade.StockReceiptsEndpointNotPublishedError);
			}
		});
		expect(fetchData).not.toHaveBeenCalled();
		expect(() => facade.listWarehousesForStockReceipts([4])).toThrow(
			facade.StockReceiptsEndpointNotPublishedError,
		);
		expect(() => facade.getStockReceiptWarehouseBranchId(8)).toThrow(
			facade.StockReceiptsEndpointNotPublishedError,
		);
	});

	it('el rechazo nombra la ruta pendiente y llega como mensaje a la UI', async () => {
		const facade = await loadFacade(false);

		const error = await facade.getStockReceipt(1, 80).catch((reason: unknown) => reason);

		expect(error).toMatchObject({
			code: facade.STOCK_RECEIPTS_ENDPOINT_NOT_PUBLISHED,
			endpoint: 'GET /subsidiaries/{subsidiary}/procurement/stock-receipts/{receipt}',
		});
		expect(getProcurementErrorMessage(error, 'genérico')).toMatch(
			/todavía no publica las recepciones/,
		);
	});

	it('sin datos simulados el selector de proveedores usa el maestro real', async () => {
		const facade = await loadFacade(false);
		const real = await import('@/services/procurement/procurementSuppliers.service');

		expect(facade.listStockReceiptSuppliers).toBe(real.listProcurementSuppliers);
	});

	it('Recepciones sigue con proveedores de prueba mientras la rama real no tenga rutas', async () => {
		const facade = await loadFacade(false);

		expect(facade.STOCK_RECEIPTS_USE_TEST_SUPPLIERS).toBe(true);
	});
});
