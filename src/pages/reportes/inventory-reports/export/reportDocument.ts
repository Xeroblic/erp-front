import type {
	IReplenishmentReportRow,
	IStockHealthReportRow,
	IStockReportRow,
} from '@/interface/inventoryReports.interface';
import type { IInventarioKpi } from '@/pages/inventario/Inventario/components/parts/InventarioKpis';
import { ESTADO_OPTIONS, REPLENISHMENT_LABELS } from '@/pages/reportes/inventory-reports/types';
import {
	visibleStatusOf,
	type IInventoryReportStats,
} from '@/pages/reportes/inventory-reports/utils';

/**
 * Documento exportable de una pestaña: lo mismo que se ve (KPI y tablas con
 * los filtros y el orden de la pantalla), independiente del formato. Lo
 * convierten a Excel `reportExcel` y a PDF `reportPdf`.
 *
 * Es la referencia del formato pedido al backend (preguntas 19–22 de
 * `Docs/abastecimiento-preguntas-backend.md`): si se cambia acá, se cambia allá.
 */

export type TExportCell = string | number | null;

export interface IExportColumn {
	header: string;
	/** `number` alinea a la derecha y usa formato de miles. */
	kind?: 'text' | 'number';
	/** Ancho aproximado en caracteres (Excel) y relativo (PDF). */
	width: number;
}

export interface IExportTable {
	title: string;
	columns: IExportColumn[];
	rows: TExportCell[][];
}

export interface IExportDocument {
	title: string;
	/** Nombre del archivo sin extensión ni fecha, p. ej. `reporte-umbrales`. */
	fileBaseName: string;
	/** Líneas de contexto bajo el título: empresa, alcance, filtros y fecha. */
	details: string[];
	/** Datos del mock: el archivo lo dice para que nadie lo tome por real. */
	simulated: boolean;
	kpis: { label: string; value: number }[];
	tables: IExportTable[];
}

export interface IExportMeta {
	companyName: string | null;
	scopeLabel: string;
	/** Búsqueda y estado aplicados, ya en texto; `null` si no hay. */
	filtersLabel: string | null;
	simulated: boolean;
	generatedAt: Date;
}

export const SIMULATED_EXPORT_NOTICE =
	'Datos simulados: este reporte todavía no existe en el backend. Las cantidades no representan el inventario real.';

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatExportDateTime = (date: Date): string =>
	`${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** `reporte-umbrales-20260922-1530`: ordena bien y no choca entre descargas. */
export const exportFileName = (doc: IExportDocument, date: Date, extension: string): string =>
	`${doc.fileBaseName}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.${extension}`;

const detailsOf = (meta: IExportMeta): string[] =>
	[
		meta.companyName ? `Empresa: ${meta.companyName}` : null,
		`Alcance: ${meta.scopeLabel}`,
		meta.filtersLabel ? `Filtros: ${meta.filtersLabel}` : null,
		`Generado el ${formatExportDateTime(meta.generatedAt)}`,
	].filter((line): line is string => line !== null);

const kpisOf = (kpis: IInventarioKpi[] | null) =>
	(kpis ?? []).map(({ label, value }) => ({ label, value }));

const estadoLabel = (row: IStockHealthReportRow): string => {
	const estado = visibleStatusOf(row);
	return ESTADO_OPTIONS.find((option) => option.value === estado)?.label ?? estado;
};

/** Fecha de negocio `YYYY-MM-DD` como `DD-MM-YYYY`. */
const businessDate = (date: string): string => {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
	return match ? `${match[3]}-${match[2]}-${match[1]}` : date;
};

/* =================================================
   Datos
   ================================================= */

export const buildDatosDocument = (
	rows: IStockReportRow[],
	kpis: IInventarioKpi[] | null,
	meta: IExportMeta,
): IExportDocument => ({
	title: 'Reporte de existencias',
	fileBaseName: 'reporte-existencias',
	details: detailsOf(meta),
	simulated: meta.simulated,
	kpis: kpisOf(kpis),
	tables: [
		{
			title: 'Existencias',
			columns: [
				{ header: 'SKU', width: 18 },
				{ header: 'Producto', width: 44 },
				{ header: 'Stock', kind: 'number', width: 12 },
				{ header: 'Actualizado', width: 14 },
			],
			rows: rows.map((row) => [
				row.sku,
				row.product_name,
				row.quantity,
				row.updated_at ? businessDate(row.updated_at) : null,
			]),
		},
	],
});

/* =================================================
   Umbrales
   ================================================= */

export const buildUmbralesDocument = (
	rows: IStockHealthReportRow[],
	kpis: IInventarioKpi[] | null,
	meta: IExportMeta,
): IExportDocument => ({
	title: 'Reporte de umbrales de stock bajo',
	fileBaseName: 'reporte-umbrales',
	details: detailsOf(meta),
	simulated: meta.simulated,
	kpis: kpisOf(kpis),
	tables: [
		{
			title: 'Umbrales',
			columns: [
				{ header: 'SKU', width: 16 },
				{ header: 'Producto', width: 36 },
				{ header: 'Sucursal', width: 22 },
				{ header: 'En bodega', kind: 'number', width: 12 },
				{ header: 'Disponible', kind: 'number', width: 12 },
				{ header: 'Umbral', kind: 'number', width: 10 },
				{ header: 'Estado', width: 16 },
			],
			rows: rows.map((row) => [
				row.product.sku,
				row.product.name,
				row.branch.name,
				row.physical_quantity,
				row.available_quantity,
				row.threshold,
				estadoLabel(row),
			]),
		},
	],
});

/* =================================================
   Acciones
   ================================================= */

export const buildAccionesDocument = (
	rows: IReplenishmentReportRow[],
	kpis: IInventarioKpi[] | null,
	meta: IExportMeta,
): IExportDocument => ({
	title: 'Reporte de reposición',
	fileBaseName: 'reporte-reposicion',
	details: detailsOf(meta),
	simulated: meta.simulated,
	kpis: kpisOf(kpis),
	tables: [
		{
			title: 'Qué reponer',
			columns: [
				{ header: 'SKU', width: 16 },
				{ header: 'Producto', width: 34 },
				{ header: 'Disponible', kind: 'number', width: 12 },
				{ header: 'Umbral', kind: 'number', width: 10 },
				{ header: 'Proveedor sugerido', width: 26 },
				{ header: 'Última compra', width: 14 },
				{ header: 'Sugerencia', width: 22 },
			],
			rows: rows.map((row) => [
				row.product.sku,
				row.product.name,
				row.stock.available_quantity,
				row.stock.threshold,
				row.recommendation.supplier?.display_name ?? null,
				row.recommendation.last_purchase
					? businessDate(row.recommendation.last_purchase.received_on)
					: null,
				REPLENISHMENT_LABELS[row.recommendation.status],
			]),
		},
	],
});

/* =================================================
   Estadísticas
   ================================================= */

export const buildEstadisticasDocument = (
	stats: IInventoryReportStats,
	meta: IExportMeta,
): IExportDocument => ({
	title: 'Estadísticas de inventario',
	fileBaseName: 'reporte-estadisticas-inventario',
	details: detailsOf(meta),
	simulated: meta.simulated,
	kpis: kpisOf(stats.kpis),
	tables: [
		{
			title: 'Estado del stock',
			columns: [
				{ header: 'Estado', width: 20 },
				{ header: 'Productos', kind: 'number', width: 12 },
			],
			rows: ESTADO_OPTIONS.map((option) => [option.label, stats.statuses[option.value]]),
		},
		{
			title: 'Stock por sucursal',
			columns: [
				{ header: 'Sucursal', width: 24 },
				{ header: 'Disponible', kind: 'number', width: 12 },
				{ header: 'Reservado o no vendible', kind: 'number', width: 16 },
				{ header: 'Sin disponible', kind: 'number', width: 12 },
				{ header: 'Bajo el umbral', kind: 'number', width: 12 },
				{ header: 'Sin umbral', kind: 'number', width: 12 },
				{ header: 'Normal', kind: 'number', width: 10 },
			],
			rows: stats.branches.map((branch) => [
				branch.branch,
				branch.available,
				branch.unavailable,
				branch.statuses.out,
				branch.statuses.critical,
				branch.statuses.unconfigured,
				branch.statuses.healthy,
			]),
		},
		{
			title: 'Antigüedad del stock',
			columns: [
				{ header: 'Días desde el último movimiento', width: 30 },
				{ header: 'Productos', kind: 'number', width: 12 },
				{ header: 'Unidades', kind: 'number', width: 12 },
			],
			rows: stats.aging.map((bucket) => [bucket.label, bucket.products, bucket.units]),
		},
		{
			title: 'Productos con más unidades',
			columns: [
				{ header: 'Producto', width: 40 },
				{ header: 'Unidades', kind: 'number', width: 12 },
			],
			rows: stats.topProducts.map((product) => [product.name, product.units]),
		},
	],
});
