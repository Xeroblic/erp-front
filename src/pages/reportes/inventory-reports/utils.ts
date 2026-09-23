import type { TInventoryStockStatusFilter } from '@/interface/inventoryOverview.interface';
import type {
	IDeadStockReportRow,
	IReplenishmentReportRow,
	IStockHealthReportRow,
	IStockReportRow,
} from '@/interface/inventoryReports.interface';
import type { IInventarioKpi } from '@/pages/inventario/Inventario/components/parts/InventarioKpis';
import type { IInventoryReportSort } from '@/pages/reportes/inventory-reports/types';

/* =================================================
   Búsqueda, orden y página (en el navegador)
   ================================================= */

/**
 * Mismo criterio que `q` del backend (`ILIKE` sobre SKU y nombre): contiene
 * el texto, sin distinguir mayúsculas. Así lo que se ve es lo que se exporta.
 */
export const searchReportRows = <T>(
	rows: T[],
	busqueda: string,
	textsOf: (row: T) => string[],
): T[] => {
	const needle = busqueda.trim().toLocaleLowerCase('es-CL');
	if (!needle) return rows;
	return rows.filter((row) =>
		textsOf(row).some((text) => text.toLocaleLowerCase('es-CL').includes(needle)),
	);
};

export type TReportSortValue = string | number | null;

const collator = new Intl.Collator('es-CL', { numeric: true, sensitivity: 'base' });

/** Orden estable; los valores sin dato van siempre al final, en cualquier dirección. */
export const sortReportRows = <T>(
	rows: T[],
	sort: IInventoryReportSort | null,
	valueOf: (row: T, field: string) => TReportSortValue,
): T[] => {
	if (!sort) return rows;
	const factor = sort.direction === 'asc' ? 1 : -1;
	return [...rows].sort((a, b) => {
		const left = valueOf(a, sort.field);
		const right = valueOf(b, sort.field);
		if (left === null || right === null) {
			if (left === right) return 0;
			return left === null ? 1 : -1;
		}
		if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
		return collator.compare(String(left), String(right)) * factor;
	});
};

export interface IReportPage<T> {
	rows: T[];
	/** Página efectiva: si la pedida ya no existe tras filtrar, la última. */
	page: number;
	lastPage: number;
	total: number;
}

export const paginateReportRows = <T>(rows: T[], page: number, perPage: number): IReportPage<T> => {
	const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
	const current = Math.min(Math.max(1, page), lastPage);
	const start = (current - 1) * perPage;
	return {
		rows: rows.slice(start, start + perPage),
		page: current,
		lastPage,
		total: rows.length,
	};
};

/* =================================================
   Estado visible (igual que Inventario)
   ================================================= */

/** «Sin disponible» gana a los estados del §13, como la etiqueta de Inventario. */
export const visibleStatusOf = (
	row: Pick<IStockHealthReportRow, 'available_quantity' | 'status'>,
): TInventoryStockStatusFilter => (row.available_quantity <= 0 ? 'out' : row.status);

/** De más a menos urgente, para ordenar por estado. */
export const STATUS_RANK: Record<TInventoryStockStatusFilter, number> = {
	out: 0,
	critical: 1,
	unconfigured: 2,
	healthy: 3,
};

/* =================================================
   KPI de cada pestaña
   ================================================= */

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

export const stockKpis = (rows: IStockReportRow[]): IInventarioKpi[] => {
	const withStock = rows.filter((row) => row.quantity > 0).length;
	return [
		{ label: 'Productos', value: rows.length, icon: 'HeroCube', accent: 'bg-violet-600' },
		{
			label: 'Stock total',
			value: sum(rows.map((row) => row.quantity)),
			icon: 'HeroArchiveBox',
			accent: 'bg-blue-600',
		},
		{ label: 'Con stock', value: withStock, icon: 'HeroCheckCircle', accent: 'bg-emerald-600' },
		{
			label: 'Sin stock',
			value: rows.length - withStock,
			icon: 'HeroNoSymbol',
			accent: 'bg-red-600',
		},
	];
};

export const countByStatus = (
	rows: IStockHealthReportRow[],
): Record<TInventoryStockStatusFilter, number> => {
	const counts: Record<TInventoryStockStatusFilter, number> = {
		out: 0,
		critical: 0,
		unconfigured: 0,
		healthy: 0,
	};
	rows.forEach((row) => {
		counts[visibleStatusOf(row)] += 1;
	});
	return counts;
};

export const thresholdKpis = (rows: IStockHealthReportRow[]): IInventarioKpi[] => {
	const counts = countByStatus(rows);
	return [
		{
			label: 'Bajo el umbral',
			value: counts.critical,
			icon: 'HeroBellAlert',
			accent: 'bg-amber-600',
		},
		{ label: 'Sin disponible', value: counts.out, icon: 'HeroNoSymbol', accent: 'bg-red-600' },
		{
			label: 'Sin umbral',
			value: counts.unconfigured,
			icon: 'HeroAdjustmentsHorizontal',
			accent: 'bg-zinc-600',
		},
		{
			label: 'Normal',
			value: counts.healthy,
			icon: 'HeroCheckCircle',
			accent: 'bg-emerald-600',
		},
	];
};

export const replenishmentKpis = (rows: IReplenishmentReportRow[]): IInventarioKpi[] => {
	const byStatus = (status: IReplenishmentReportRow['recommendation']['status']) =>
		rows.filter((row) => row.recommendation.status === status).length;
	return [
		{
			label: 'Por reponer',
			value: rows.length,
			icon: 'HeroShoppingCart',
			accent: 'bg-amber-600',
		},
		{
			label: 'Con proveedor sugerido',
			value: byStatus('suggested'),
			icon: 'HeroTruck',
			accent: 'bg-emerald-600',
		},
		{
			label: 'Sin compras anteriores',
			value: byStatus('without_supplier_history'),
			icon: 'HeroClock',
			accent: 'bg-zinc-600',
		},
		{
			label: 'Sin proveedor elegible',
			value: byStatus('no_active_suppliers') + byStatus('no_comparable_cost'),
			icon: 'HeroExclamationTriangle',
			accent: 'bg-red-600',
		},
	];
};

/** Días sin movimiento desde los que un producto se considera inmovilizado (R3). */
export const DEAD_STOCK_DAYS = 90;

export const statisticsKpis = (
	health: IStockHealthReportRow[],
	dead: IDeadStockReportRow[],
): IInventarioKpi[] => {
	const counts = countByStatus(health);
	return [
		{
			label: 'Unidades en bodega',
			value: sum(health.map((row) => row.physical_quantity)),
			icon: 'HeroArchiveBox',
			accent: 'bg-blue-600',
		},
		{
			label: 'Disponibles para vender',
			value: sum(health.map((row) => Math.max(0, row.available_quantity))),
			icon: 'HeroCheckCircle',
			accent: 'bg-emerald-600',
		},
		{
			label: 'Requieren atención',
			value: counts.critical + counts.out,
			icon: 'HeroBellAlert',
			accent: 'bg-amber-600',
		},
		{
			label: `Sin movimiento (+${DEAD_STOCK_DAYS} días)`,
			value: dead.filter((row) => (row.days_without_movement ?? 0) >= DEAD_STOCK_DAYS).length,
			icon: 'HeroClock',
			accent: 'bg-violet-600',
		},
	];
};

/* =================================================
   Agregados para los gráficos de Estadísticas
   ================================================= */

export interface IBranchStockTotals {
	branch: string;
	available: number;
	/** Reservado o no vendible: en bodega, pero no se puede vender. */
	unavailable: number;
	statuses: Record<TInventoryStockStatusFilter, number>;
}

/** Por sucursal, en el orden en que aparecen en el reporte. */
export const branchStockTotals = (rows: IStockHealthReportRow[]): IBranchStockTotals[] => {
	const totals = new Map<number, IBranchStockTotals>();
	rows.forEach((row) => {
		const current = totals.get(row.branch.id) ?? {
			branch: row.branch.name,
			available: 0,
			unavailable: 0,
			statuses: { out: 0, critical: 0, unconfigured: 0, healthy: 0 },
		};
		const available = Math.max(0, Math.min(row.available_quantity, row.physical_quantity));
		current.available += available;
		current.unavailable += row.physical_quantity - available;
		current.statuses[visibleStatusOf(row)] += 1;
		totals.set(row.branch.id, current);
	});
	return [...totals.values()];
};

/** Productos con más unidades, sumando todas las sucursales. */
export const topProductsByUnits = (
	rows: IStockHealthReportRow[],
	limit = 10,
): { name: string; units: number }[] => {
	const totals = new Map<number, { name: string; units: number }>();
	rows.forEach((row) => {
		const current = totals.get(row.product.id) ?? { name: row.product.name, units: 0 };
		current.units += row.physical_quantity;
		totals.set(row.product.id, current);
	});
	return [...totals.values()]
		.sort((a, b) => b.units - a.units || a.name.localeCompare(b.name, 'es'))
		.slice(0, limit);
};

export interface IAgingBucket {
	label: string;
	units: number;
	products: number;
}

const AGING_LIMITS: { label: string; max: number }[] = [
	{ label: 'Hasta 30 días', max: 30 },
	{ label: '31 a 90 días', max: 90 },
	{ label: '91 a 180 días', max: 180 },
	{ label: 'Más de 180 días', max: Number.POSITIVE_INFINITY },
];

/** Antigüedad del stock según su último movimiento; «Sin registro» al final. */
export const agingBuckets = (rows: IDeadStockReportRow[]): IAgingBucket[] => {
	const buckets: IAgingBucket[] = [
		...AGING_LIMITS.map(({ label }) => ({ label, units: 0, products: 0 })),
		{ label: 'Sin registro', units: 0, products: 0 },
	];
	rows.forEach((row) => {
		const days = row.days_without_movement;
		const index =
			days === null
				? AGING_LIMITS.length
				: AGING_LIMITS.findIndex((limit) => days <= limit.max);
		buckets[index].units += row.physical_quantity;
		buckets[index].products += 1;
	});
	return buckets;
};

export interface IInventoryReportStats {
	kpis: IInventarioKpi[];
	statuses: Record<TInventoryStockStatusFilter, number>;
	branches: IBranchStockTotals[];
	topProducts: { name: string; units: number }[];
	aging: IAgingBucket[];
}
