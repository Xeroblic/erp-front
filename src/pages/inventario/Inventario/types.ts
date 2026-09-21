import * as Yup from 'yup';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';
import type {
	IInventoryCriticalStock,
	TInventoryStockSort,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';

export const INVENTARIO_PATH = '/inventario/stock';
export const inventarioProductoPath = (productId: number): string =>
	`${INVENTARIO_PATH}/${productId}`;

/** Segmento de «Sin ubicación» en la ficha de bodega: no es un ID. */
export const SIN_UBICACION_SLUG = 'sin-ubicacion';

export const inventarioBodegaPath = (warehouseId: number | null): string =>
	`${INVENTARIO_PATH}/bodegas/${warehouseId ?? SIN_UBICACION_SLUG}`;

/** Lee el segmento de la ficha de bodega: `null` si no es una ubicación válida. */
export const parseBodegaParam = (param: string | undefined): TInventarioUbicacion | null => {
	if (param === SIN_UBICACION_SLUG) return 'unlocated';
	if (param && /^[1-9]\d*$/.test(param)) return `warehouse:${Number(param)}`;
	return null;
};

/** Vista General (productos) o Por bodega. Viaja en `?vista=`. */
export type TInventarioVista = 'general' | 'bodegas';

/**
 * Ubicación del filtro: `branch` (toda la sucursal), `unlocated` o
 * `warehouse:<id>`. Mismo token que usaba Stock por ubicación, así un enlace
 * se lee igual en la URL y en el estado.
 */
export type TInventarioUbicacion = 'branch' | 'unlocated' | `warehouse:${number}`;

export interface IInventarioFiltros {
	vista: TInventarioVista;
	ubicacion: TInventarioUbicacion;
	estado: TInventoryStockStatusFilter | null;
	busqueda: string;
	orden: TInventoryStockSort;
	page: number;
	perPage: number;
}

export const INVENTARIO_PER_PAGE_DEFAULT = 15;

export const DEFAULT_INVENTARIO_FILTROS: IInventarioFiltros = {
	vista: 'general',
	ubicacion: 'branch',
	estado: null,
	busqueda: '',
	orden: 'name',
	page: 1,
	perPage: INVENTARIO_PER_PAGE_DEFAULT,
};

const ESTADOS: readonly TInventoryStockStatusFilter[] = [
	'critical',
	'out',
	'unconfigured',
	'healthy',
];
const ORDENES: readonly TInventoryStockSort[] = [
	'name',
	'-name',
	'physical_quantity',
	'-physical_quantity',
	'available_quantity',
	'-available_quantity',
];

const isEstado = (value: string | null): value is TInventoryStockStatusFilter =>
	value !== null && (ESTADOS as readonly string[]).includes(value);
const isOrden = (value: string | null): value is TInventoryStockSort =>
	value !== null && (ORDENES as readonly string[]).includes(value);

const positiveInt = (value: string | null, fallback: number): number => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Lee los filtros de la URL. Un valor desconocido cae al valor por defecto en
 * vez de romper la vista: los enlaces viejos o editados a mano siguen abriendo.
 */
export const parseInventarioFiltros = (params: URLSearchParams): IInventarioFiltros => {
	const bodega = params.get('bodega');
	let ubicacion: TInventarioUbicacion = 'branch';
	if (params.get('sin_ubicacion') === '1') ubicacion = 'unlocated';
	else if (bodega !== null && /^[1-9]\d*$/.test(bodega))
		ubicacion = `warehouse:${Number(bodega)}`;

	const estado = params.get('estado');
	const orden = params.get('orden');
	return {
		vista: params.get('vista') === 'bodegas' ? 'bodegas' : 'general',
		ubicacion,
		estado: isEstado(estado) ? estado : null,
		busqueda: params.get('q') ?? '',
		orden: isOrden(orden) ? orden : 'name',
		page: positiveInt(params.get('page'), 1),
		perPage: positiveInt(params.get('per_page'), INVENTARIO_PER_PAGE_DEFAULT),
	};
};

/** Escribe sólo lo que difiere del valor por defecto, para URLs cortas y compartibles. */
export const serializeInventarioFiltros = (filtros: IInventarioFiltros): URLSearchParams => {
	const params = new URLSearchParams();
	if (filtros.vista !== 'general') params.set('vista', filtros.vista);
	if (filtros.ubicacion === 'unlocated') params.set('sin_ubicacion', '1');
	else if (filtros.ubicacion !== 'branch')
		params.set('bodega', filtros.ubicacion.slice('warehouse:'.length));
	if (filtros.estado) params.set('estado', filtros.estado);
	if (filtros.busqueda.trim()) params.set('q', filtros.busqueda);
	if (filtros.orden !== 'name') params.set('orden', filtros.orden);
	if (filtros.page !== 1) params.set('page', String(filtros.page));
	if (filtros.perPage !== INVENTARIO_PER_PAGE_DEFAULT)
		params.set('per_page', String(filtros.perPage));
	return params;
};

export const inventoryLocationParams = (
	ubicacion: TInventarioUbicacion,
): IInventoryStockListParams => {
	if (ubicacion === 'unlocated') return { unlocated: 1 };
	if (ubicacion.startsWith('warehouse:'))
		return { warehouse_id: Number(ubicacion.slice('warehouse:'.length)) };
	return {};
};

export const ubicacionFromWarehouseId = (warehouseId: number | null): TInventarioUbicacion =>
	warehouseId === null ? 'unlocated' : `warehouse:${warehouseId}`;

/* =================================================
   Estado visible del stock
   ================================================= */

/** Lo que muestra la etiqueta de estado. `out` gana a los estados del §13. */
export type TInventarioEstadoVisible = TInventoryStockStatusFilter;

export const estadoVisible = (
	critical: IInventoryCriticalStock | null,
): TInventarioEstadoVisible | null => {
	if (!critical) return null;
	if (critical.available_quantity <= 0) return 'out';
	return critical.status;
};

export const ESTADO_LABELS: Record<TInventoryStockStatusFilter, string> = {
	critical: 'Bajo el umbral',
	out: 'Sin disponible',
	unconfigured: 'Sin umbral',
	healthy: 'Normal',
};

/* =================================================
   Umbral crítico (§13) — formulario de la ficha
   ================================================= */

export interface IUmbralFormValues {
	/** Texto del input: vacío desactiva el umbral. */
	threshold: string;
}

export const UmbralSchema = Yup.object({
	threshold: Yup.string()
		.trim()
		.matches(/^\d*$/, 'Ingresa un número entero, sin decimales ni signos.')
		.test('max', 'El umbral no puede superar 1.000.000.', (value) =>
			value ? Number(value) <= 1_000_000 : true,
		),
});
