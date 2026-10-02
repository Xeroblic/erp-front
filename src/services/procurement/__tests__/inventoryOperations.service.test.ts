import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 * La simulación se prueba en `@/mocks/services/__tests__/inventoryOperations.mock.test.ts`.
 */

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryStock.config', () => ({ default: useMocks }));
	const facade = await import('@/services/procurement/inventoryOperations.service');
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

describe('inventoryOperations.service (fachada)', () => {
	it('con datos simulados delega en el doble, sin pasar por la API', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryOperations.mock');

		expect(facade.listInventoryOperations).toBe(mock.listInventoryOperations);
		expect(facade.getInventoryOperation).toBe(mock.getInventoryOperation);
		expect(fetchData).not.toHaveBeenCalled();
	});

	it('sin datos simulados rechaza con un error tipado y nunca inventa datos', async () => {
		const facade = await loadFacade(false);

		const results = await Promise.allSettled([
			facade.listInventoryOperations(1, { branch_id: 4 }),
			facade.getInventoryOperation(1, 'op-1', { branch_id: 4 }),
		]);

		results.forEach((result) => {
			expect(result.status).toBe('rejected');
			if (result.status === 'rejected') {
				expect(result.reason).toBeInstanceOf(facade.ProcurementEndpointNotPublishedError);
				expect(result.reason).toMatchObject({
					endpoint: expect.stringContaining('/inventory-operations'),
				});
			}
		});
		expect(fetchData).not.toHaveBeenCalled();
	});
});
