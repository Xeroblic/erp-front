import * as Yup from 'yup';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';
import type {
	IInventoryCriticalStock,
	TInventoryStockSort,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';
import type {
	IInventoryOperationsParams,
	TInventoryOperationType,
} from '@/interface/inventoryOperations.interface';
import type { TIcons } from '@/types/icons.type';

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

/** Vista General (productos), Por bodega o Trazabilidad. Viaja en `?vista=`. */
export type TInventarioVista = 'general' | 'bodegas' | 'trazabilidad';

const VISTAS: readonly TInventarioVista[] = ['general', 'bodegas', 'trazabilidad'];

/**
 * Ubicación del filtro: `branch` (toda la sucursal), `unlocated` o
 * `warehouse:<id>`. Mismo token que usaba Stock por ubicación, así un enlace
 * se lee igual en la URL y en el estado.
 */
export type TInventarioUbicacion = 'branch' | 'unlocated' | `warehouse:${number}`;

/* =================================================
   Trazabilidad (§14) — tipos de operación
   ================================================= */

/** Tipos del §14 más el saldo inicial, tipo legado que se conserva con su nombre. */
export type TOperacionTipo = TInventoryOperationType | 'initial_balance';

export interface IOperacionTipoInfo {
	label: string;
	icon: TIcons;
	/** Fondo del icono, igual que los KPI. */
	accent: string;
}

/** En el orden en que se ofrecen en el filtro. */
export const OPERACION_TIPOS: Record<TOperacionTipo, IOperacionTipoInfo> = {
	stock_receipt: { label: 'Recepción', icon: 'HeroArrowDownTray', accent: 'bg-emerald-600' },
	stock_receipt_reversal: {
		label: 'Reversión de recepción',
		icon: 'HeroArrowUturnLeft',
		accent: 'bg-red-600',
	},
	sale_fulfillment: { label: 'Venta', icon: 'HeroShoppingCart', accent: 'bg-blue-600' },
	sale_return: { label: 'Devolución de venta', icon: 'HeroReceiptRefund', accent: 'bg-sky-600' },
	warehouse_stock_placement: {
		label: 'Traslado entre ubicaciones',
		icon: 'HeroArrowsRightLeft',
		accent: 'bg-violet-600',
	},
	inventory_adjustment: {
		label: 'Ajuste de inventario',
		icon: 'HeroAdjustmentsHorizontal',
		accent: 'bg-amber-600',
	},
	purchase_document_link: {
		label: 'Vínculo con documento de compra',
		icon: 'HeroLink',
		accent: 'bg-zinc-600',
	},
	initial_stock_document_allocation: {
		label: 'Documentación de stock inicial',
		icon: 'HeroDocumentCheck',
		accent: 'bg-zinc-600',
	},
	initial_balance: { label: 'Saldo inicial', icon: 'HeroArchiveBox', accent: 'bg-zinc-700' },
};

export const isOperacionTipo = (value: string | null): value is TOperacionTipo =>
	value !== null && Object.prototype.hasOwnProperty.call(OPERACION_TIPOS, value);

/** Un tipo que el front no conoce se muestra con el nombre que trae, sin inventarle etiqueta. */
export const operacionTipoInfo = (type: string): IOperacionTipoInfo =>
	isOperacionTipo(type)
		? OPERACION_TIPOS[type]
		: { label: type, icon: 'HeroQuestionMarkCircle', accent: 'bg-zinc-500' };

/** Operaciones sin efecto físico: documentan unidades que ya estaban. */
export const OPERACION_TIPOS_DOCUMENTALES: readonly string[] = [
	'purchase_document_link',
	'initial_stock_document_allocation',
];

export interface IInventarioFiltros {
	vista: TInventarioVista;
	ubicacion: TInventarioUbicacion;
	estado: TInventoryStockStatusFilter | null;
	busqueda: string;
	orden: TInventoryStockSort;
	/** Trazabilidad: tipo de operación (`operation_type`). */
	tipo: TOperacionTipo | null;
	/** Trazabilidad: rango de fechas `AAAA-MM-DD`; vacío = sin límite. */
	desde: string;
	hasta: string;
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
	tipo: null,
	desde: '',
	hasta: '',
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
	'location',
	'-location',
	'stock_status',
	'-stock_status',
];

const isEstado = (value: string | null): value is TInventoryStockStatusFilter =>
	value !== null && (ESTADOS as readonly string[]).includes(value);
const isOrden = (value: string | null): value is TInventoryStockSort =>
	value !== null && (ORDENES as readonly string[]).includes(value);
const isVista = (value: string | null): value is TInventarioVista =>
	value !== null && (VISTAS as readonly string[]).includes(value);

/** Fecha de negocio `AAAA-MM-DD` que existe en el calendario. */
const isBusinessDate = (value: string | null): value is string => {
	const match = value === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

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

	const vista = params.get('vista');
	const estado = params.get('estado');
	const orden = params.get('orden');
	const tipo = params.get('tipo');
	const desde = params.get('desde');
	const hasta = params.get('hasta');
	return {
		vista: isVista(vista) ? vista : 'general',
		ubicacion,
		estado: isEstado(estado) ? estado : null,
		busqueda: params.get('q') ?? '',
		orden: isOrden(orden) ? orden : 'name',
		tipo: isOperacionTipo(tipo) ? tipo : null,
		desde: isBusinessDate(desde) ? desde : '',
		hasta: isBusinessDate(hasta) ? hasta : '',
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
	if (filtros.tipo) params.set('tipo', filtros.tipo);
	if (filtros.desde) params.set('desde', filtros.desde);
	if (filtros.hasta) params.set('hasta', filtros.hasta);
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

/** Filtros de la pestaña Trazabilidad como parámetros del §14, acotados a la sucursal activa. */
export const trazabilidadParams = (
	filtros: Pick<
		IInventarioFiltros,
		'ubicacion' | 'tipo' | 'busqueda' | 'desde' | 'hasta' | 'page' | 'perPage'
	>,
	branchId: number,
): IInventoryOperationsParams => ({
	branch_id: branchId,
	...inventoryLocationParams(filtros.ubicacion),
	operation_type: filtros.tipo ?? undefined,
	search: filtros.busqueda.trim() || undefined,
	occurred_from: filtros.desde || undefined,
	occurred_to: filtros.hasta || undefined,
	page: filtros.page,
	per_page: filtros.perPage,
});

/** Algún filtro elige ítems (y no sólo operaciones): el detalle marca los que coinciden. */
export const filtraItems = (params: IInventoryOperationsParams): boolean =>
	params.product_id !== undefined ||
	params.supplier_id !== undefined ||
	params.purchase_document_id !== undefined ||
	params.warehouse_id !== undefined ||
	params.unlocated !== undefined ||
	Boolean(params.search);

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
