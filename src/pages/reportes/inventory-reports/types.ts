import type { TInventoryStockStatusFilter } from '@/interface/inventoryOverview.interface';
import type {
	IInventoryReportBranch,
	TInventoryReportSource,
	TInventoryReportType,
	TReplenishmentStatus,
} from '@/interface/inventoryReports.interface';
import {
	STOCK_STATUS_COLORS,
	STOCK_STATUS_LABELS,
	STOCK_STATUS_ORDER,
	type TStatusPillColor,
} from '@/components/procurement';
import {
	isInventoryReportView,
	type TInventoryReportView,
} from '@/pages/reportes/inventory-reports/inventoryReportTabs';
import { parseIdParam, parsePageParam } from '@/utils/listSearchParams.util';

export const SUPPLIER_DETAIL_PATH = '/inventario/abastecimiento/proveedores';

/** Lo que comparten las pestañas de una sesión (usuario + filial). */
export interface IInventoryReportContext {
	subsidiaryId: number;
	/** Clave de la sesión para la propiedad de las consultas. */
	owner: string;
	/** Sucursales de la filial, para el filtro y para el mock. */
	branches: IInventoryReportBranch[];
	/** La sucursal elegida o «Todas las sucursales», para las descripciones. */
	scopeLabel: string;
	/** Nombre de la empresa para el encabezado de los archivos exportados. */
	companyName: string | null;
	sourceOf: (type: TInventoryReportType) => TInventoryReportSource | null;
}

export type TInventoryReportSortDirection = 'asc' | 'desc';

export interface IInventoryReportSort {
	/** Clave de columna de la tabla activa. */
	field: string;
	direction: TInventoryReportSortDirection;
}

export interface IInventoryReportFilters {
	vista: TInventoryReportView;
	busqueda: string;
	/** Sucursal de la filial; `null` es «todas». */
	sucursal: number | null;
	/** Estado visible del stock (sólo Umbrales). */
	estado: TInventoryStockStatusFilter | null;
	/** `null`: el orden en que llega el reporte. */
	orden: IInventoryReportSort | null;
	page: number;
	perPage: number;
}

export const INVENTORY_REPORT_DEFAULT_VIEW: TInventoryReportView = 'datos';
/** Una de las opciones del paginador estándar (5, 10, 20, 30, 40, 50). */
export const INVENTORY_REPORT_PER_PAGE_DEFAULT = 20;

export const DEFAULT_INVENTORY_REPORT_FILTERS: IInventoryReportFilters = {
	vista: INVENTORY_REPORT_DEFAULT_VIEW,
	busqueda: '',
	sucursal: null,
	estado: null,
	orden: null,
	page: 1,
	perPage: INVENTORY_REPORT_PER_PAGE_DEFAULT,
};

const ESTADOS: readonly TInventoryStockStatusFilter[] = [
	'out',
	'critical',
	'unconfigured',
	'healthy',
];

export const isEstado = (value: string | null): value is TInventoryStockStatusFilter =>
	ESTADOS.some((estado) => estado === value);

const parseOrden = (value: string | null): IInventoryReportSort | null => {
	if (!value || value === '-') return null;
	return value.startsWith('-')
		? { field: value.slice(1), direction: 'desc' }
		: { field: value, direction: 'asc' };
};

/**
 * Lee los filtros de la URL. Un valor desconocido cae al valor por defecto en
 * vez de romper la vista: los enlaces viejos o editados a mano siguen abriendo.
 *
 * Con `branchIds` (las sucursales de la filial activa), una `sucursal` que no
 * está entre ellas cae a «todas»: tras cambiar de empresa la URL conserva la de
 * la anterior, y pedirla haría fallar el reporte. Una lista vacía no admite
 * ninguna; sólo `null` (sin contexto de filial) respeta la de la URL.
 */
export const parseInventoryReportFilters = (
	params: URLSearchParams,
	branchIds: readonly number[] | null = null,
): IInventoryReportFilters => {
	const vista = params.get('vista');
	const sucursal = parseIdParam(params.get('sucursal'));
	const estado = params.get('estado');
	const sucursalInScope = sucursal === null || branchIds === null || branchIds.includes(sucursal);
	return {
		vista: isInventoryReportView(vista) ? vista : INVENTORY_REPORT_DEFAULT_VIEW,
		busqueda: params.get('q') ?? '',
		sucursal: sucursalInScope ? sucursal : null,
		estado: isEstado(estado) ? estado : null,
		orden: parseOrden(params.get('orden')),
		page: parsePageParam(params.get('page'), 1),
		perPage: parsePageParam(params.get('per_page'), INVENTORY_REPORT_PER_PAGE_DEFAULT),
	};
};

/** Escribe sólo lo que difiere del valor por defecto, para URLs cortas y compartibles. */
export const serializeInventoryReportFilters = (
	filters: IInventoryReportFilters,
): URLSearchParams => {
	const params = new URLSearchParams();
	if (filters.vista !== INVENTORY_REPORT_DEFAULT_VIEW) params.set('vista', filters.vista);
	if (filters.busqueda.trim()) params.set('q', filters.busqueda);
	if (filters.sucursal !== null) params.set('sucursal', String(filters.sucursal));
	if (filters.estado !== null) params.set('estado', filters.estado);
	if (filters.orden)
		params.set(
			'orden',
			`${filters.orden.direction === 'desc' ? '-' : ''}${filters.orden.field}`,
		);
	if (filters.page !== 1) params.set('page', String(filters.page));
	if (filters.perPage !== INVENTORY_REPORT_PER_PAGE_DEFAULT)
		params.set('per_page', String(filters.perPage));
	return params;
};

/** El primer clic ordena ascendente, el segundo descendente (como `SortableTableHeader`). */
export const nextInventoryReportSort = (
	current: IInventoryReportSort | null,
	field: string,
): IInventoryReportSort => ({
	field,
	direction: current?.field === field && current.direction === 'asc' ? 'desc' : 'asc',
});

/** Mismo texto y color que la etiqueta de estado de Inventario. */
export const ESTADO_OPTIONS: { value: TInventoryStockStatusFilter; label: string }[] =
	STOCK_STATUS_ORDER.map((value) => ({ value, label: STOCK_STATUS_LABELS[value] }));

export const ESTADO_COLORS: Record<TInventoryStockStatusFilter, TStatusPillColor> =
	STOCK_STATUS_COLORS;

export const REPLENISHMENT_LABELS: Record<TReplenishmentStatus, string> = {
	suggested: 'Proveedor sugerido',
	without_supplier_history: 'Sin compras anteriores',
	no_active_suppliers: 'Sin proveedores activos',
	no_comparable_cost: 'Sin costo comparable',
};

export const REPLENISHMENT_COLORS: Record<TReplenishmentStatus, TStatusPillColor> = {
	suggested: 'emerald',
	without_supplier_history: 'zinc',
	no_active_suppliers: 'red',
	no_comparable_cost: 'amber',
};

/** Búsqueda y estado aplicados, en texto para el encabezado de los archivos. */
export const filtersLabelOf = (filters: IInventoryReportFilters): string | null => {
	const parts = [
		filters.busqueda.trim() ? `búsqueda «${filters.busqueda.trim()}»` : null,
		filters.estado
			? `estado ${ESTADO_OPTIONS.find((option) => option.value === filters.estado)?.label ?? filters.estado}`
			: null,
	].filter((part): part is string => part !== null);
	return parts.length > 0 ? parts.join(' · ') : null;
};
