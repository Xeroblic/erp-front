import { describe, expect, it } from 'vitest';
import type {
	IDeadStockReportRow,
	IReplenishmentReportRow,
	IStockHealthReportRow,
	IStockReportRow,
	TReplenishmentStatus,
} from '@/interface/inventoryReports.interface';
import {
	agingBuckets,
	branchStockTotals,
	countByStatus,
	paginateReportRows,
	replenishmentKpis,
	searchReportRows,
	sortReportRows,
	statisticsKpis,
	stockKpis,
	topProductsByUnits,
	type TReportSortValue,
} from '@/pages/reportes/inventory-reports/utils';

const health = (
	productId: number,
	branchId: number,
	values: Partial<IStockHealthReportRow> = {},
): IStockHealthReportRow => ({
	product: { id: productId, sku: `SKU-${productId}`, name: `Producto ${productId}` },
	branch: { id: branchId, name: `Sucursal ${branchId}` },
	physical_quantity: 10,
	available_quantity: 10,
	threshold: 5,
	status: 'healthy',
	...values,
});

const dead = (days: number | null, units: number): IDeadStockReportRow => ({
	product: { id: units, sku: `SKU-${units}`, name: `Producto ${units}` },
	branch: { id: 4, name: 'Casa Matriz' },
	physical_quantity: units,
	last_operation_at: days === null ? null : '2026-01-01',
	days_without_movement: days,
});

const replenishment = (status: TReplenishmentStatus): IReplenishmentReportRow => ({
	product: { id: 1, sku: 'SKU-1', name: 'Producto 1' },
	stock: { physical_quantity: 0, available_quantity: 0, threshold: 5, status: 'critical' },
	recommendation: {
		status,
		historical_supplier_count: 0,
		eligible_supplier_count: 0,
		supplier: null,
		last_purchase: null,
	},
});

const kpiValues = (kpis: { label: string; value: number }[]) =>
	Object.fromEntries(kpis.map((kpi) => [kpi.label, kpi.value]));

describe('Búsqueda, orden y página en el navegador', () => {
	const rows = [
		{ name: 'Teclado', units: 3 as number | null },
		{ name: 'mouse USB', units: null },
		{ name: 'Monitor 10', units: 12 },
		{ name: 'Monitor 9', units: 1 },
	];
	const valueOf = (row: (typeof rows)[number], field: string): TReportSortValue =>
		field === 'units' ? row.units : row.name;

	it('busca sin distinguir mayúsculas y sin espacios de sobra', () => {
		expect(searchReportRows(rows, '  MOUSE ', (row) => [row.name])).toEqual([rows[1]]);
		expect(searchReportRows(rows, '   ', (row) => [row.name])).toBe(rows);
	});

	it('los valores sin dato van al final en cualquier dirección', () => {
		const asc = sortReportRows(rows, { field: 'units', direction: 'asc' }, valueOf);
		const desc = sortReportRows(rows, { field: 'units', direction: 'desc' }, valueOf);

		expect(asc.map((row) => row.units)).toEqual([1, 3, 12, null]);
		expect(desc.map((row) => row.units)).toEqual([12, 3, 1, null]);
	});

	it('ordena el texto con números en orden natural y no altera la lista original', () => {
		const sorted = sortReportRows(rows, { field: 'name', direction: 'asc' }, valueOf);

		expect(sorted.map((row) => row.name)).toEqual([
			'Monitor 9',
			'Monitor 10',
			'mouse USB',
			'Teclado',
		]);
		expect(rows[0].name).toBe('Teclado');
	});

	it('una página que ya no existe tras filtrar muestra la última', () => {
		const page = paginateReportRows([1, 2, 3, 4, 5], 9, 2);

		expect(page).toEqual({ rows: [5], page: 3, lastPage: 3, total: 5 });
		expect(paginateReportRows([], 1, 20)).toEqual({ rows: [], page: 1, lastPage: 1, total: 0 });
	});
});

describe('KPI y agregados', () => {
	it('Datos cuenta productos, stock total y con y sin stock', () => {
		const stock: IStockReportRow[] = [
			{ sku: 'A', product_name: 'A', branch_name: 'Todas', quantity: 4, updated_at: null },
			{ sku: 'B', product_name: 'B', branch_name: 'Todas', quantity: 0, updated_at: null },
		];

		expect(kpiValues(stockKpis(stock))).toEqual({
			Productos: 2,
			'Stock total': 4,
			'Con stock': 1,
			'Sin stock': 1,
		});
	});

	it('«Sin disponible» gana a los estados del umbral', () => {
		const counts = countByStatus([
			health(1, 4, { status: 'critical', available_quantity: 0 }),
			health(2, 4, { status: 'unconfigured', available_quantity: -1, threshold: null }),
			health(3, 4, { status: 'critical', available_quantity: 2 }),
			health(4, 4),
		]);

		expect(counts).toEqual({ out: 2, critical: 1, unconfigured: 0, healthy: 1 });
	});

	it('Acciones agrupa sin proveedor activo y sin costo comparable como «sin proveedor elegible»', () => {
		const kpis = replenishmentKpis([
			replenishment('suggested'),
			replenishment('without_supplier_history'),
			replenishment('no_active_suppliers'),
			replenishment('no_comparable_cost'),
		]);

		expect(kpiValues(kpis)).toEqual({
			'Por reponer': 4,
			'Con proveedor sugerido': 1,
			'Sin compras anteriores': 1,
			'Sin proveedor elegible': 2,
		});
	});

	it('Estadísticas no descuenta disponibles negativos y cuenta lo inmovilizado desde 90 días', () => {
		const kpis = statisticsKpis(
			[
				health(1, 4, { physical_quantity: 5, available_quantity: -2, status: 'critical' }),
				health(2, 4, { physical_quantity: 8, available_quantity: 6, status: 'critical' }),
			],
			[dead(89, 1), dead(90, 2), dead(null, 3)],
		);

		expect(kpiValues(kpis)).toEqual({
			'Unidades en bodega': 13,
			'Disponibles para vender': 6,
			'Requieren atención': 2,
			'Sin movimiento (+90 días)': 1,
		});
	});

	it('separa por sucursal lo vendible de lo reservado o no vendible', () => {
		const totals = branchStockTotals([
			health(1, 4, { physical_quantity: 10, available_quantity: 7 }),
			health(2, 6, { physical_quantity: 3, available_quantity: 0, status: 'critical' }),
			health(3, 4, { physical_quantity: 2, available_quantity: 5 }),
		]);

		expect(totals).toEqual([
			{
				branch: 'Sucursal 4',
				available: 9,
				unavailable: 3,
				statuses: { out: 0, critical: 0, unconfigured: 0, healthy: 2 },
			},
			{
				branch: 'Sucursal 6',
				available: 0,
				unavailable: 3,
				statuses: { out: 1, critical: 0, unconfigured: 0, healthy: 0 },
			},
		]);
	});

	it('suma las unidades de cada producto en todas las sucursales', () => {
		const top = topProductsByUnits(
			[
				health(1, 4, { physical_quantity: 3 }),
				health(2, 4, { physical_quantity: 4 }),
				health(1, 6, { physical_quantity: 2 }),
			],
			1,
		);

		expect(top).toEqual([{ name: 'Producto 1', units: 5 }]);
	});

	it('reparte la antigüedad en tramos con «Sin registro» al final', () => {
		const buckets = agingBuckets([dead(30, 1), dead(31, 2), dead(181, 4), dead(null, 8)]);

		expect(buckets).toEqual([
			{ label: 'Hasta 30 días', units: 1, products: 1 },
			{ label: '31 a 90 días', units: 2, products: 1 },
			{ label: '91 a 180 días', units: 0, products: 0 },
			{ label: 'Más de 180 días', units: 4, products: 1 },
			{ label: 'Sin registro', units: 8, products: 1 },
		]);
	});
});
