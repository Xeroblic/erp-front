import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getInventoryReport,
	parseInventoryReport,
	reportRowsOf,
} from '@/services/reports/inventoryReports.service';
import { ReportsService, reportFileNameFrom } from '@/services/reports/reports.service';
import { getInventoryReportMock } from '@/services/reports/inventoryReportsMock.service';

const getResults = vi.hoisted(() => vi.fn<typeof ReportsService.getResults>());
vi.mock('@/services/reports/reports.service', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/services/reports/reports.service')>();
	return { ...actual, ReportsService: { ...actual.ReportsService, getResults } };
});
vi.mock('@/services/reports/inventoryReportsMock.service', () => ({
	getInventoryReportMock: vi.fn(),
}));

const getMock = vi.mocked(getInventoryReportMock);

const product = { id: 31, sku: 'MOUSE-001', name: 'Mouse USB' };
const branch = { id: 4, name: 'Casa Matriz' };

beforeEach(() => {
	getResults.mockReset();
	getMock.mockReset();
});

describe('Lectura del cuerpo de GET S/reports/{type}', () => {
	it('lee las filas del paginador de Laravel, del sobre { data } y de un arreglo', () => {
		const rows = [{ sku: 'A' }];

		expect(reportRowsOf({ current_page: 1, data: rows })).toBe(rows);
		expect(reportRowsOf({ data: rows, meta: {} })).toBe(rows);
		expect(reportRowsOf(rows)).toBe(rows);
		expect(reportRowsOf({ message: 'error' })).toEqual([]);
		expect(reportRowsOf(null)).toEqual([]);
	});

	it('`stock` acepta números como texto y descarta las filas que no puede leer', () => {
		const result = parseInventoryReport('stock', [
			{
				sku: 'A',
				product_name: 'Cable',
				branch_name: 'Todas',
				quantity: '12',
				updated_at: '2026-09-01 10:00:00',
			},
			{ sku: 'B', product_name: 'Sin cantidad', quantity: '' },
			{ sku: 'C', product_name: 'Inválida', quantity: 'muchos' },
			'fila rota',
		]);

		expect(result).toEqual({
			type: 'stock',
			rows: [
				{
					sku: 'A',
					product_name: 'Cable',
					branch_name: 'Todas',
					quantity: 12,
					updated_at: '2026-09-01 10:00:00',
				},
			],
		});
	});

	it('R1 descarta un estado desconocido y conserva el umbral nulo', () => {
		const result = parseInventoryReport('stock_health', [
			{
				product,
				branch,
				physical_quantity: 19,
				available_quantity: 1,
				threshold: null,
				status: 'unconfigured',
			},
			{
				product,
				branch,
				physical_quantity: 1,
				available_quantity: 1,
				threshold: 1,
				status: 'inventado',
			},
		]);

		expect(result.rows).toEqual([
			{
				product,
				branch,
				physical_quantity: 19,
				available_quantity: 1,
				threshold: null,
				status: 'unconfigured',
			},
		]);
	});

	it('R2 completa lo opcional y descarta un proveedor o documento incompleto', () => {
		const result = parseInventoryReport('replenishment', [
			{
				product,
				stock: { available_quantity: '1', threshold: 10 },
				recommendation: {
					status: 'suggested',
					supplier: { id: 5, display_name: 'PCExpress' },
					last_purchase: {
						received_on: '2026-09-04',
						days_since_purchase: 19,
						quantity: 14,
						purchase_document: { id: 9, document_type: 'nota' },
					},
				},
			},
			{ product, stock: { available_quantity: 1 }, recommendation: { status: 'otro' } },
		]);

		expect(result.rows).toEqual([
			{
				product,
				stock: {
					physical_quantity: 0,
					available_quantity: 1,
					threshold: 10,
					status: 'critical',
				},
				recommendation: {
					status: 'suggested',
					historical_supplier_count: 0,
					eligible_supplier_count: 0,
					supplier: { id: 5, display_name: 'PCExpress', rut: '', is_active: true },
					last_purchase: {
						received_on: '2026-09-04',
						days_since_purchase: 19,
						quantity: 14,
						purchase_document: null,
					},
				},
			},
		]);
	});

	it('R3 conserva la ausencia de movimiento como null', () => {
		const result = parseInventoryReport('dead_stock', [
			{
				product,
				branch,
				physical_quantity: 3,
				last_operation_at: null,
				days_without_movement: null,
			},
			{ product, physical_quantity: 3 },
		]);

		expect(result.rows).toEqual([
			{
				product,
				branch,
				physical_quantity: 3,
				last_operation_at: null,
				days_without_movement: null,
			},
		]);
	});
});

describe('getInventoryReport', () => {
	const query = {
		subsidiaryId: 2,
		type: 'dead_stock' as const,
		source: 'api' as const,
		params: { branchId: 4, days: 0 },
		branches: [branch],
	};

	it('pide al backend el reporte completo con la sucursal y los días', async () => {
		getResults.mockResolvedValue({ data: [] });
		const controller = new AbortController();

		await getInventoryReport(query, controller.signal);

		expect(getResults).toHaveBeenCalledWith(
			2,
			'dead_stock',
			{ per_page: 'all', branch_id: 4, days: 0 },
			controller.signal,
		);
		expect(getMock).not.toHaveBeenCalled();
	});

	it('«todas las sucursales» no envía branch_id', async () => {
		getResults.mockResolvedValue([]);

		await getInventoryReport({
			...query,
			type: 'stock',
			params: { branchId: null },
		});

		expect(getResults).toHaveBeenCalledWith(2, 'stock', { per_page: 'all' }, undefined);
	});

	it('con fuente simulada usa el mock y nunca llama al backend', async () => {
		getMock.mockResolvedValue({ type: 'dead_stock', rows: [] });

		await getInventoryReport({ ...query, source: 'mock' });

		expect(getMock).toHaveBeenCalledWith('dead_stock', query.params, query.branches, undefined);
		expect(getResults).not.toHaveBeenCalled();
	});

	it('Existencias no tiene datos simulados', async () => {
		await expect(
			getInventoryReport({ ...query, type: 'stock', source: 'mock' }),
		).rejects.toThrow('Existencias no tiene datos simulados.');
	});
});

describe('Nombre del archivo exportado', () => {
	it('prefiere el nombre UTF-8 de Content-Disposition', () => {
		expect(
			reportFileNameFrom(
				'attachment; filename="reporte.pdf"; filename*=UTF-8\'\'reporte-a%C3%B1o.pdf',
			),
		).toBe('reporte-año.pdf');
	});

	it('usa el nombre entre comillas o sin ellas', () => {
		expect(reportFileNameFrom('attachment; filename="stock.xlsx"')).toBe('stock.xlsx');
		expect(reportFileNameFrom('attachment; filename=stock.xlsx')).toBe('stock.xlsx');
	});

	it('sin cabecera no inventa un nombre; con una codificación rota conserva el texto', () => {
		expect(reportFileNameFrom(undefined)).toBeNull();
		expect(reportFileNameFrom('inline')).toBeNull();
		expect(reportFileNameFrom("attachment; filename*=UTF-8''%E0%A4%A")).toBe('%E0%A4%A');
	});
});
