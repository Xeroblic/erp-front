import type { TInventoryReportType } from '@/interface/inventoryReports.interface';
import type { TIcons } from '@/types/icons.type';

/**
 * Pestañas de Reportes › Inventario. Cada una lee uno o más reportes de
 * `GET S/reports/{type}`; las filas que se leen están tipadas en
 * `@/interface/inventoryReports.interface`.
 *
 * Datos usa `stock`, que ya existe. Umbrales, Acciones y Estadísticas usan
 * R1–R3 del contrato: aparecen cuando `GET S/reports` los informa o, mientras
 * tanto, con los datos simulados de Inventario.
 */
export type TInventoryReportView = 'datos' | 'umbrales' | 'acciones' | 'estadisticas';

export interface IInventoryReportViewDefinition {
	id: TInventoryReportView;
	label: string;
	description: string;
	icon: TIcons;
	reports: TInventoryReportType[];
}

export const INVENTORY_REPORT_VIEWS: IInventoryReportViewDefinition[] = [
	{
		id: 'datos',
		label: 'Datos',
		description: 'Existencias de cada producto',
		icon: 'HeroTableCells',
		reports: ['stock'],
	},
	{
		id: 'umbrales',
		label: 'Umbrales',
		description: 'Disponible frente al umbral de stock bajo de cada producto',
		icon: 'HeroAdjustmentsHorizontal',
		reports: ['stock_health'],
	},
	{
		id: 'acciones',
		label: 'Acciones',
		description: 'Qué reponer y a qué proveedor, según las compras anteriores',
		icon: 'HeroBolt',
		reports: ['replenishment'],
	},
	{
		id: 'estadisticas',
		label: 'Estadísticas',
		description: 'Cómo se reparte el stock, qué pide atención y cuánto lleva sin moverse',
		icon: 'HeroChartPie',
		reports: ['stock_health', 'dead_stock'],
	},
];

export const isInventoryReportView = (value: string | null): value is TInventoryReportView =>
	INVENTORY_REPORT_VIEWS.some((view) => view.id === value);
