import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
	IInventoryOperationDetailResponse,
	IInventoryOperationsResponse,
} from '@/interface/inventoryOperations.interface';

/**
 * La fachada no simula nada: elige el doble o la API real según la bandera.
 */

const fetchData = vi.hoisted(() =>
	vi.fn<(config: { url: string; params?: Record<string, unknown> }) => Promise<unknown>>(),
);
const sentParams = () => fetchData.mock.calls.map(([config]) => config.params);
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));

const loadFacade = async (useMocks: boolean) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryOperations.config', () => ({ default: useMocks }));
	return import('@/services/procurement/inventoryOperations.service');
};

const OPERATION_ID = '0d3b6f7a-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

const listResponse: IInventoryOperationsResponse = {
	data: [
		{
			id: OPERATION_ID,
			operation_type: 'stock_receipt',
			title: 'Recepción de mercadería',
			occurred_at: '2026-09-25T10:00:30-03:00',
			branch: { id: 4, name: 'Centro' },
			actor: { id: 9, name: 'Ana Pérez' },
			reason: null,
			source: { type: 'stock_receipt', id: 57 },
			reverses_operation_id: null,
			summary: { products_count: 15, units_affected: 120, physical_effect: true },
		},
	],
	links: { first: null, last: null, prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/2/inventory-operations',
		per_page: 15,
		to: 1,
		total: 1,
	},
	context: { pending_movements_count: 3 },
};

afterEach(() => {
	vi.doUnmock('@/config/inventoryOperations.config');
	fetchData.mockReset();
});

describe('inventoryOperations.service (fachada)', () => {
	it('con datos simulados delega en el doble y no llama a la API', async () => {
		const facade = await loadFacade(true);
		const mock = await import('@/mocks/services/inventoryOperations.mock');

		expect(facade.listInventoryOperations).toBe(mock.listInventoryOperations);
		expect(facade.getInventoryOperation).toBe(mock.getInventoryOperation);
	});

	it('no depende de la bandera del resumen de Inventario', async () => {
		vi.resetModules();
		vi.doMock('@/config/inventoryStock.config', () => ({ default: true }));
		vi.doMock('@/config/inventoryOperations.config', () => ({ default: false }));
		const facade = await import('@/services/procurement/inventoryOperations.service');
		const mock = await import('@/mocks/services/inventoryOperations.mock');
		vi.doUnmock('@/config/inventoryStock.config');

		expect(facade.listInventoryOperations).not.toBe(mock.listInventoryOperations);
	});
});

describe('inventoryOperations.service (API real)', () => {
	it('lista con la URL de la filial y devuelve el sobre con `context`', async () => {
		fetchData.mockResolvedValue({ data: listResponse });
		const { listInventoryOperations } = await loadFacade(false);
		const controller = new AbortController();

		const response = await listInventoryOperations(
			2,
			{
				branch_id: 4,
				product_id: 31,
				occurred_from: '2026-09-01',
				occurred_to: '2026-09-30',
				serial_tracking: 0,
				page: 2,
				per_page: 15,
			},
			{ signal: controller.signal, branchName: 'Centro' },
		);

		expect(fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/2/inventory-operations',
			method: 'get',
			params: {
				branch_id: 4,
				product_id: 31,
				occurred_from: '2026-09-01',
				occurred_to: '2026-09-30',
				serial_tracking: 0,
				page: 2,
				per_page: 15,
			},
			signal: controller.signal,
		});
		// Sin caché: el motor agrupa movimientos segundos después de escribirlos.
		expect(fetchData.mock.calls[0][0]).not.toHaveProperty('cacheTTLms');
		expect(response.context.pending_movements_count).toBe(3);
		expect(response.data[0].summary.physical_effect).toBe(true);
	});

	it('omite `unlocated` sin ese filtro y nunca lo manda junto a una bodega', async () => {
		fetchData.mockResolvedValue({ data: listResponse });
		const { listInventoryOperations } = await loadFacade(false);

		await listInventoryOperations(2, { branch_id: 4, warehouse_id: 8 });
		await listInventoryOperations(2, { branch_id: 4, warehouse_id: 8, unlocated: 1 });
		await listInventoryOperations(2, { branch_id: 4, unlocated: 1 });

		const sent = sentParams();
		expect(sent[0]).toEqual({ branch_id: 4, warehouse_id: 8 });
		expect(sent[1]).toEqual({ branch_id: 4, warehouse_id: 8 });
		expect(sent[2]).toEqual({ branch_id: 4, unlocated: 1 });
	});

	it('recorta la búsqueda y no manda una vacía', async () => {
		fetchData.mockResolvedValue({ data: listResponse });
		const { listInventoryOperations } = await loadFacade(false);

		await listInventoryOperations(2, { branch_id: 4, search: '  mouse ' });
		await listInventoryOperations(2, { branch_id: 4, search: '   ' });

		const sent = sentParams();
		expect(sent[0]).toEqual({ branch_id: 4, search: 'mouse' });
		expect(sent[1]).toEqual({ branch_id: 4 });
	});

	it('pide el detalle por UUID con los filtros que marcan `matches_filter`', async () => {
		const detail: IInventoryOperationDetailResponse = {
			data: { ...listResponse.data[0], items: [] },
		};
		fetchData.mockResolvedValue({ data: detail });
		const { getInventoryOperation } = await loadFacade(false);

		const response = await getInventoryOperation(2, OPERATION_ID, {
			branch_id: 4,
			product_id: 31,
		});

		expect(fetchData).toHaveBeenCalledWith({
			url: `/subsidiaries/2/inventory-operations/${OPERATION_ID}`,
			method: 'get',
			params: { branch_id: 4, product_id: 31 },
			signal: undefined,
		});
		expect(response).toEqual(detail);
	});

	it('propaga el error de la API sin reinterpretarlo', async () => {
		const forbidden = Object.assign(new Error('Forbidden'), {
			isAxiosError: true,
			response: { status: 403, data: { message: 'Esta acción no está autorizada.' } },
		});
		fetchData.mockRejectedValue(forbidden);
		const { getInventoryOperation } = await loadFacade(false);

		await expect(getInventoryOperation(2, OPERATION_ID, { branch_id: 4 })).rejects.toBe(
			forbidden,
		);
	});
});
