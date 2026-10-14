import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	getInventoryOperation,
	listInventoryOperations,
	OPENING_BALANCE_OPERATION_TYPE,
} from '@/mocks/services/inventoryOperations.mock';
import { listInventoryOverview } from '@/mocks/services/inventoryOverview.mock';
import {
	createInventoryAdjustment,
	createWarehouseStockMovement,
	resetInventoryStockStoreForTests,
} from '@/mocks/services/inventoryStock.mock';
import {
	resetStockReceiptsStoreForTests,
	setStockReceiptForcedOutcomeForTests,
} from '@/mocks/services/stockReceipts.mock';
import type { IInventoryOverviewParams } from '@/interface/inventoryOverview.interface';
import type {
	IInventoryOperationDetail,
	IInventoryOperationsParams,
	TInventoryOperationType,
} from '@/interface/inventoryOperations.interface';

// Fixtures de `inventoryStock.db.ts`, sucursal 4 de la filial 2.
const SUBSIDIARY_ID = 2;
const BRANCH_ID = 4;
const MOUSE_ID = 31; // 15 sin ubicación + 4 en el estante
const NOTEBOOK_ID = 44; // con serie: fuera de la trazabilidad
const MAIN_WAREHOUSE_ID = 8;

const list = (params: Omit<IInventoryOperationsParams, 'branch_id'> = {}) =>
	listInventoryOperations(
		SUBSIDIARY_ID,
		{ branch_id: BRANCH_ID, per_page: 100, ...params },
		{ branchName: 'Casa Matriz' },
	);

const detail = (operationId: string, params: Omit<IInventoryOperationsParams, 'branch_id'> = {}) =>
	getInventoryOperation(SUBSIDIARY_ID, operationId, { branch_id: BRANCH_ID, ...params });

const readError = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba rechazo');
	} catch (error) {
		return (error as { response: { status: number } }).response.status;
	}
};

/** Traslado de 5 aptos de Sin ubicación a la Bodega Central y ajuste de -1 en Sin ubicación. */
const moveAndAdjustMouse = async () => {
	await createWarehouseStockMovement(BRANCH_ID, {
		from_warehouse_id: null,
		to_warehouse_id: MAIN_WAREHOUSE_ID,
		reason: 'Ubicar mouse',
		items: [{ product_id: MOUSE_ID, quantity: 5, condition: 'fit' }],
	});
	await createInventoryAdjustment(BRANCH_ID, {
		warehouse_id: null,
		reason: 'Conteo',
		notes: null,
		related_stock_receipt_id: null,
		items: [{ product_id: MOUSE_ID, quantity_delta: -1, condition: 'fit', origin_id: null }],
	});
};

const mouseDetails = async (): Promise<IInventoryOperationDetail[]> => {
	const { data } = await list({ product_id: MOUSE_ID });
	return Promise.all(
		data.map(async (row) => (await detail(row.id, { product_id: MOUSE_ID })).data),
	);
};

const QUEUED_RECEIPT_ID = 72; // sembrada en `queued`: su worker simulado publica a los 900 ms

beforeEach(() => {
	// Sin esto la recepción encolada entra al stock a mitad de una prueba y la historia cambia.
	setStockReceiptForcedOutcomeForTests(SUBSIDIARY_ID, QUEUED_RECEIPT_ID, 'failed');
});

afterEach(() => {
	resetStockReceiptsStoreForTests();
	resetInventoryStockStoreForTests();
});

describe('§14 · listInventoryOperations (mock)', () => {
	it('parte del saldo inicial y lista de la más nueva a la más antigua', async () => {
		await moveAndAdjustMouse();

		const { data, meta } = await list();

		expect(data.slice(0, 2).map((row) => [row.operation_type, row.reason])).toEqual([
			['inventory_adjustment', 'Conteo'],
			['warehouse_stock_placement', 'Ubicar mouse'],
		]);
		expect(data.at(-1)?.operation_type).toBe(OPENING_BALANCE_OPERATION_TYPE);
		expect(data[0].branch).toEqual({ id: BRANCH_ID, name: 'Casa Matriz' });
		expect(meta.total).toBe(data.length);
		const times = data.map((row) => Date.parse(row.occurred_at));
		expect([...times].sort((a, b) => b - a)).toEqual(times);
	});

	it('un traslado cuenta sus unidades una sola vez', async () => {
		await moveAndAdjustMouse();

		const { data } = await list({ operation_type: 'warehouse_stock_placement' });

		expect(data).toHaveLength(1);
		expect(data[0].summary).toEqual({
			products_count: 1,
			units_affected: 5,
			physical_effect: true,
		});
		expect(data[0].title).toBe('Traslado interno de stock');
	});

	it('el último «después» de cada ubicación coincide con el stock actual', async () => {
		await moveAndAdjustMouse();

		const operations = await mouseDetails();
		const latestAfter = new Map<number | null, number | null>();
		operations.forEach((operation) =>
			operation.items
				.filter((item) => item.product_id === MOUSE_ID)
				.forEach((item) =>
					item.effects.forEach((effect) => {
						if (!latestAfter.has(effect.warehouse_id))
							latestAfter.set(effect.warehouse_id, effect.physical_quantity_after);
					}),
				),
		);
		const { data } = await listInventoryOverview(BRANCH_ID, {
			include: 'warehouses',
			per_page: 100,
			search: 'mouse',
		} as IInventoryOverviewParams);
		const current = new Map(
			data[0].warehouses.map((location) => [
				location.warehouse?.id ?? null,
				location.physical_quantity,
			]),
		);

		expect(Object.fromEntries(latestAfter)).toEqual(Object.fromEntries(current));
		expect(current.get(null)).toBe(9);
		expect(current.get(MAIN_WAREHOUSE_ID)).toBe(5);
	});

	it('el «antes» de una operación es el «después» de la anterior en esa ubicación', async () => {
		await moveAndAdjustMouse();

		const [adjustment, placement] = await mouseDetails();
		const unlocatedAfterPlacement = placement.items[0].effects.find(
			(effect) => effect.warehouse_id === null,
		);
		const unlocatedAdjustment = adjustment.items[0].effects[0];

		expect(unlocatedAfterPlacement).toMatchObject({
			physical_quantity_before: 15,
			physical_quantity_after: 10,
			physical_quantity_delta: -5,
		});
		expect(unlocatedAdjustment).toMatchObject({
			warehouse_id: null,
			physical_quantity_before: 10,
			physical_quantity_after: 9,
		});
	});

	it('los productos con serie no tienen trazabilidad por operaciones', async () => {
		const { meta } = await list({ product_id: NOTEBOOK_ID });

		expect(meta.total).toBe(0);
	});

	it('filtra por fechas de negocio; la búsqueda mira el producto, no el motivo', async () => {
		await moveAndAdjustMouse();

		const before = await list({ occurred_to: '2026-09-02' });
		const byProduct = await list({ search: 'mouse' });
		const byReason = await list({ search: 'ubicar' });

		expect(before.data.every((row) => row.occurred_at < '2026-09-03')).toBe(true);
		expect(before.data.some((row) => row.operation_type === 'warehouse_stock_placement')).toBe(
			false,
		);
		expect(byProduct.data.map((row) => row.reason)).toEqual(
			expect.arrayContaining(['Conteo', 'Ubicar mouse']),
		);
		expect(byReason.meta.total).toBe(0);
	});

	it('con `serial_tracking` separa operaciones de productos sin y con serie', async () => {
		const all = await list();
		const withoutSerial = await list({ serial_tracking: 0 });
		const withSerial = await list({ serial_tracking: 1 });

		expect(withoutSerial.meta.total).toBe(all.meta.total);
		expect(withSerial.meta.total).toBe(0);
	});

	it('trae `context.pending_movements_count` al nivel de `data`', async () => {
		const { context } = await list();

		expect(context).toEqual({ pending_movements_count: 0 });
	});

	it('rechaza con 422 los mismos filtros que el backend', async () => {
		const unknownType = 'robo' as string as TInventoryOperationType;
		expect(await readError(list({ operation_type: unknownType }))).toBe(422);
		expect(await readError(list({ occurred_from: '01-09-2026' }))).toBe(422);
		expect(
			await readError(list({ occurred_from: '2026-09-10', occurred_to: '2026-09-01' })),
		).toBe(422);
		expect(await readError(list({ warehouse_id: MAIN_WAREHOUSE_ID, unlocated: 1 }))).toBe(422);
		expect(await readError(listInventoryOperations(SUBSIDIARY_ID, {}))).toBe(422);
	});
});

describe('§14 · getInventoryOperation (mock)', () => {
	it('devuelve la operación completa y marca los ítems que cumplen el filtro', async () => {
		const opening = (await list()).data.at(-1);
		if (!opening) throw new Error('Sin saldo inicial');

		const { data } = await detail(opening.id, { product_id: MOUSE_ID });

		expect(data.items.length).toBeGreaterThan(1);
		expect(
			data.items.filter((item) => item.matches_filter).map((item) => item.product_id),
		).toEqual([MOUSE_ID]);
		expect(data.items.every((item) => item.condition !== null)).toBe(true);
		expect(data.title).toBe('Stock inicial');
	});

	it('nombra la bodega de cada efecto y deja `null` para «Sin ubicación»', async () => {
		await moveAndAdjustMouse();

		const [, placement] = await mouseDetails();
		const warehouses = placement.items[0].effects.map((effect) => effect.warehouse);

		expect(warehouses).toEqual([null, { id: MAIN_WAREHOUSE_ID, name: expect.any(String) }]);
	});

	it('responde 404 a una operación que no existe', async () => {
		expect(await readError(detail('no-existe'))).toBe(404);
	});
});
