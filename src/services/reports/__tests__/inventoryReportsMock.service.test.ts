import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	daysSinceBusinessDate,
	getInventoryReportMock,
} from '@/services/reports/inventoryReportsMock.service';
import {
	resetInventoryCriticalThresholdsForTests,
	updateInventoryCriticalThreshold,
} from '@/services/procurement/inventoryOverview.service';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';
import { clearAllPersistedMockState } from '@/services/procurement/procurementMockPersistence.util';
import type { IInventoryReportBranch } from '@/interface/inventoryReports.interface';

// Fixtures de `inventoryStock.db.ts`, sucursal 4.
const BRANCHES: IInventoryReportBranch[] = [{ id: 4, name: 'Casa Matriz' }];
const MOUSE_ID = 31; // 19 en bodega, 1 disponible, umbral 10, última compra 2026-09-04 a PCExpress
const KEYBOARD_ID = 67; // 16 disponibles, umbral 3, última entrada 2026-09-08
const NOTEBOOK_ID = 44; // con serie: sin umbral, fuera de R1

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 8, 23, 12, 0, 0));
});

afterEach(() => {
	vi.useRealTimers();
	resetInventoryStockStoreForTests();
	resetInventoryCriticalThresholdsForTests();
	clearAllPersistedMockState('inventory-critical-thresholds');
});

const healthRows = async () => {
	const result = await getInventoryReportMock('stock_health', { branchId: null }, BRANCHES);
	if (result.type !== 'stock_health') throw new Error('Tipo inesperado');
	return result.rows;
};
const replenishmentRows = async () => {
	const result = await getInventoryReportMock('replenishment', { branchId: null }, BRANCHES);
	if (result.type !== 'replenishment') throw new Error('Tipo inesperado');
	return result.rows;
};
const deadRows = async (days: number) => {
	const result = await getInventoryReportMock('dead_stock', { branchId: null, days }, BRANCHES);
	if (result.type !== 'dead_stock') throw new Error('Tipo inesperado');
	return result.rows;
};

describe('Mock de Reportes › Inventario (R1–R3)', () => {
	it('cuenta los días enteros desde una fecha de negocio, nunca negativos', () => {
		const today = new Date(2026, 8, 23, 23, 59);

		expect(daysSinceBusinessDate('2026-09-04', today)).toBe(19);
		expect(daysSinceBusinessDate('2026-09-23', today)).toBe(0);
		expect(daysSinceBusinessDate('2026-10-01', today)).toBe(0);
	});

	it('R1 informa el estado del umbral por producto y sucursal, sin productos con serie', async () => {
		const rows = await healthRows();

		expect(rows.find((row) => row.product.id === MOUSE_ID)).toMatchObject({
			branch: { id: 4, name: 'Casa Matriz' },
			physical_quantity: 19,
			available_quantity: 1,
			threshold: 10,
			status: 'critical',
		});
		expect(rows.find((row) => row.product.id === KEYBOARD_ID)?.status).toBe('healthy');
		expect(rows.some((row) => row.product.id === NOTEBOOK_ID)).toBe(false);
	});

	it('R1 refleja un umbral cambiado desde Inventario', async () => {
		await updateInventoryCriticalThreshold(KEYBOARD_ID, 20);

		const rows = await healthRows();

		expect(rows.find((row) => row.product.id === KEYBOARD_ID)).toMatchObject({
			threshold: 20,
			status: 'critical',
		});
	});

	it('R2 sólo lista lo que está bajo el umbral, con el proveedor de la última compra', async () => {
		const rows = await replenishmentRows();

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			product: { id: MOUSE_ID },
			stock: { available_quantity: 1, threshold: 10, status: 'critical' },
			recommendation: {
				status: 'suggested',
				supplier: { display_name: 'PCExpress' },
				last_purchase: { received_on: '2026-09-04', days_since_purchase: 19 },
			},
		});
	});

	it('R3 con `days` sólo devuelve lo que lleva al menos ese tiempo sin moverse', async () => {
		const all = await deadRows(0);
		const stale = await deadRows(18);

		const ids = (rows: typeof all) => rows.map((row) => row.product.id);
		expect(ids(all)).toEqual(expect.arrayContaining([MOUSE_ID, KEYBOARD_ID]));
		expect(ids(stale)).toContain(MOUSE_ID);
		expect(ids(stale)).not.toContain(KEYBOARD_ID);
		// Sin fecha registrada no se puede demostrar que se movió: entra siempre.
		expect(stale.some((row) => row.days_without_movement === null)).toBe(true);
	});

	it('rechaza con 422 una sucursal que no es de la empresa', async () => {
		await expect(
			getInventoryReportMock('stock_health', { branchId: 99 }, BRANCHES),
		).rejects.toMatchObject({ response: { status: 422 } });
	});
});
