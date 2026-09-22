import { afterEach, describe, expect, it } from 'vitest';
import {
	getInventoryStockDetail,
	getInventoryStockSummary,
	listInventoryOverview,
	listInventoryWarehouseAggregates,
	resetInventoryCriticalThresholdsForTests,
	updateInventoryCriticalThreshold,
} from '@/services/procurement/inventoryOverview.service';
import {
	createWarehouseStockMovement,
	resetInventoryStockStoreForTests,
} from '@/services/procurement/inventoryStock.service';
import { clearAllPersistedMockState } from '@/services/procurement/procurementMockPersistence.util';
import type { IInventoryOverviewParams } from '@/interface/inventoryOverview.interface';

// Fixtures de `inventoryStock.db.ts`, sucursal 4.
const BRANCH_ID = 4;
const MOUSE_ID = 31; // 15 sin ubicación (13 aptos, 2 no aptos) + 4 en el estante; 16 reservadas; umbral 10
const CABLE_ID = 58; // 100 en Bodega Central, umbral 20
const KEYBOARD_ID = 67; // 16 en Bodega Central, umbral 3
const NOTEBOOK_ID = 44; // con serie: fuera de la consulta (§3)
const MAIN_WAREHOUSE_ID = 8;
const SHELF_WAREHOUSE_ID = 12;

const overview = (params: Partial<IInventoryOverviewParams> = {}) =>
	listInventoryOverview(BRANCH_ID, {
		include: 'warehouses',
		per_page: 100,
		...params,
	} as IInventoryOverviewParams);

const readError = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba rechazo');
	} catch (error) {
		return (error as { response: { status: number; data: { code: string } } }).response;
	}
};

afterEach(() => {
	resetInventoryStockStoreForTests();
	resetInventoryCriticalThresholdsForTests();
	clearAllPersistedMockState('inventory-critical-thresholds');
});

describe('A1 · listInventoryOverview', () => {
	it('agrega por producto con el reparto por bodega y el estado de la sucursal', async () => {
		const { data, context } = await overview();
		const mouse = data.find((row) => row.product.id === MOUSE_ID);

		expect(context).toEqual({ scope: 'branch', branch_id: BRANCH_ID, warehouse: null });
		expect(mouse).toMatchObject({
			physical_quantity: 19,
			fit_quantity: 17,
			unfit_quantity: 2,
			documented_quantity: 14,
			undocumented_quantity: 5,
		});
		// Sin ubicación primero, luego por nombre.
		expect(
			mouse?.warehouses.map((location) => [
				location.warehouse?.id ?? null,
				location.physical_quantity,
			]),
		).toEqual([
			[null, 15],
			[SHELF_WAREHOUSE_ID, 4],
		]);
		expect(mouse?.critical_stock).toEqual({
			scope: 'branch',
			physical_quantity: 19,
			fit_quantity: 17,
			unfit_quantity: 2,
			held_quantity: 16,
			available_quantity: 1,
			threshold: 10,
			status: 'critical',
		});
		expect(data.some((row) => row.product.id === NOTEBOOK_ID)).toBe(false);
	});

	it('con filtro de ubicación acota las cantidades pero mantiene el reparto completo', async () => {
		const { data, context } = await overview({ warehouse_id: SHELF_WAREHOUSE_ID });

		expect(context.scope).toBe('warehouse');
		expect(data.map((row) => row.product.id)).toEqual([MOUSE_ID]);
		expect(data[0].physical_quantity).toBe(4);
		expect(data[0].warehouses).toHaveLength(2);
		expect(data[0].critical_stock?.physical_quantity).toBe(19);
	});

	it('filtra por estado, marca y búsqueda', async () => {
		const critical = await overview({ stock_status: 'critical' });
		expect(critical.data.map((row) => row.product.id)).toEqual([MOUSE_ID]);

		const unconfigured = await overview({ stock_status: 'unconfigured' });
		expect(unconfigured.meta.total).toBe(16);

		const logitech = await overview({ brand_id: 3 });
		expect(logitech.data.map((row) => row.product.id)).toEqual([MOUSE_ID]);

		const search = await overview({ search: 'hdmi' });
		expect(search.data.map((row) => row.product.id)).toEqual([CABLE_ID]);
	});

	it('ordena por cantidad en ambos sentidos con desempate estable por ID', async () => {
		const desc = await overview({ sort: '-physical_quantity' });
		expect(desc.data.slice(0, 3).map((row) => row.product.id)).toEqual([
			CABLE_ID,
			MOUSE_ID,
			KEYBOARD_ID,
		]);

		const asc = await overview({ sort: 'available_quantity' });
		const ids = asc.data.map((row) => row.product.id);
		// Mouse y los productos de prueba tienen 1 disponible: el ID desempata.
		expect(ids.slice(0, 2)).toEqual([MOUSE_ID, 1000]);
		expect(ids.indexOf(MOUSE_ID)).toBeLessThan(ids.indexOf(CABLE_ID));
	});

	it('ordena por ubicación con «Sin ubicación» antes que las bodegas', async () => {
		const firstLocation = (row: { warehouses: { warehouse: { name: string } | null }[] }) =>
			row.warehouses[0]?.warehouse?.name ?? '';

		const asc = await overview({ sort: 'location', per_page: 100 });
		const names = asc.data.map(firstLocation);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
		expect(asc.data[0].product.id).toBe(MOUSE_ID);

		const desc = await overview({ sort: '-location', per_page: 100 });
		expect(desc.data.map(firstLocation)).toEqual([...names].reverse());
	});

	it('ordena por estado de más a menos urgente', async () => {
		const rank = { out: 0, critical: 1, unconfigured: 2, healthy: 3 } as const;
		const rankOf = (row: {
			critical_stock: { available_quantity: number; status: keyof typeof rank } | null;
		}) =>
			!row.critical_stock
				? 4
				: rank[
						row.critical_stock.available_quantity <= 0
							? 'out'
							: row.critical_stock.status
					];

		const asc = await overview({ sort: 'stock_status', per_page: 100 });
		const ranks = asc.data.map(rankOf);
		expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
		const ids = asc.data.map((row) => row.product.id);
		expect(ids.indexOf(MOUSE_ID)).toBeLessThan(ids.indexOf(CABLE_ID));

		const desc = await overview({ sort: '-stock_status', per_page: 100 });
		const descRanks = desc.data.map(rankOf);
		expect(descRanks).toEqual([...descRanks].sort((a, b) => b - a));
	});

	it('rechaza un estado u orden desconocidos con 422', async () => {
		expect((await readError(overview({ stock_status: 'otro' as 'critical' }))).status).toBe(
			422,
		);
		expect((await readError(overview({ sort: 'precio' as 'name' }))).status).toBe(422);
	});

	it('refleja un traslado simulado sin duplicar el stock', async () => {
		await createWarehouseStockMovement(BRANCH_ID, {
			from_warehouse_id: null,
			to_warehouse_id: MAIN_WAREHOUSE_ID,
			reason: 'Ubicar mouse',
			items: [{ product_id: MOUSE_ID, quantity: 5, condition: 'fit' }],
		});
		const { data } = await overview({ search: 'mouse' });

		expect(data[0].physical_quantity).toBe(19);
		expect(
			data[0].warehouses.map((location) => [
				location.warehouse?.id ?? null,
				location.physical_quantity,
			]),
		).toEqual([
			[null, 10],
			[MAIN_WAREHOUSE_ID, 5],
			[SHELF_WAREHOUSE_ID, 4],
		]);
	});
});

describe('A2 · getInventoryStockSummary', () => {
	it('cuenta lo mismo que el filtro de A1 del mismo nombre', async () => {
		const { data } = await getInventoryStockSummary(BRANCH_ID);
		const critical = await overview({ stock_status: 'critical' });
		const unconfigured = await overview({ stock_status: 'unconfigured' });
		const out = await overview({ stock_status: 'out' });

		expect(data.critical_count).toBe(critical.meta.total);
		expect(data.unconfigured_count).toBe(unconfigured.meta.total);
		expect(data.out_count).toBe(out.meta.total);
		expect(data).toMatchObject({
			products_count: 19,
			unlocated_quantity: 15,
			unfit_quantity: 2,
		});
	});
});

describe('A3 · listInventoryWarehouseAggregates', () => {
	it('lista Sin ubicación y cada bodega con sus productos y unidades', async () => {
		const { data } = await listInventoryWarehouseAggregates(BRANCH_ID);

		expect(
			data.map((row) => [
				row.warehouse?.id ?? null,
				row.product_count,
				row.physical_quantity,
				row.critical_count,
			]),
		).toEqual([
			[null, 1, 15, 1],
			[MAIN_WAREHOUSE_ID, 18, 132, 0],
			[SHELF_WAREHOUSE_ID, 1, 4, 1],
		]);
	});
});

describe('A4 · getInventoryStockDetail', () => {
	it('devuelve la ficha con el umbral del producto', async () => {
		const { data } = await getInventoryStockDetail(BRANCH_ID, MOUSE_ID);

		expect(data.product.critical_stock_threshold).toBe(10);
		expect(data.physical_quantity).toBe(19);
		expect(data.critical_stock?.status).toBe('critical');
		expect(data.series_summary).toBeNull();
	});

	it('un producto con serie no se agrega (§3) y uno inexistente responde 404', async () => {
		const { data } = await getInventoryStockDetail(BRANCH_ID, NOTEBOOK_ID);
		expect(data.warehouses).toEqual([]);
		expect(data.critical_stock).toBeNull();

		expect((await readError(getInventoryStockDetail(BRANCH_ID, 999_999))).status).toBe(404);
	});
});

describe('Umbral crítico (§13)', () => {
	it('al cambiar el umbral cambia el estado; vacío lo desactiva', async () => {
		await updateInventoryCriticalThreshold(CABLE_ID, 150);
		expect(
			(await getInventoryStockDetail(BRANCH_ID, CABLE_ID)).data.critical_stock?.status,
		).toBe('critical');

		await updateInventoryCriticalThreshold(CABLE_ID, null);
		const { data } = await getInventoryStockDetail(BRANCH_ID, CABLE_ID);
		expect(data.product.critical_stock_threshold).toBeNull();
		expect(data.critical_stock?.status).toBe('unconfigured');
	});

	it('rechaza productos con serie y valores inválidos', async () => {
		const serial = await readError(updateInventoryCriticalThreshold(NOTEBOOK_ID, 2));
		expect(serial).toMatchObject({
			status: 422,
			data: { code: 'CRITICAL_THRESHOLD_NOT_ALLOWED' },
		});
		expect((await readError(updateInventoryCriticalThreshold(CABLE_ID, -1))).status).toBe(422);
		expect((await readError(updateInventoryCriticalThreshold(CABLE_ID, 1.5))).status).toBe(422);
	});
});
