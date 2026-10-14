import * as Yup from 'yup';
import { STOCK_STATUS_LABELS, visibleStockStatus } from '@/components/procurement';
import Pages from '@/config/pages.config';
import type { IPageLink } from '@/config/procurementLinks';
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
import {
	locationStockParams,
	locationToken,
	warehouseIdFromToken,
	type TLocationToken,
} from '@/utils/inventoryLocation.util';
import {
	LIST_MAX_PER_PAGE,
	parseBusinessDateParam,
	parseIdParam,
	parsePageParam,
} from '@/utils/listSearchParams.util';

export const INVENTARIO_PATH = '/inventario/stock';
export const inventarioProductoPath = (productId: number): string =>
	`${INVENTARIO_PATH}/${productId}`;

/** Segmento de «Sin ubicación» en la ficha de bodega: no es un ID. */
const SIN_UBICACION_SLUG = 'sin-ubicacion';

export const inventarioBodegaPath = (warehouseId: number | null): string =>
	`${INVENTARIO_PATH}/bodegas/${warehouseId ?? SIN_UBICACION_SLUG}`;

/**
 * Destinos con el `authority` de la ruta de Inventario, para que quien enlaza
 * desde otra pantalla compruebe el mismo permiso que `AuthorityCheck`. Se lee
 * la configuración al llamar, no al cargar el módulo.
 */
export const inventarioProductoLink = (productId: number): IPageLink => ({
	to: inventarioProductoPath(productId),
	authority: Pages.inventory.subPages.inventario.authority,
});

export const inventarioBodegaLink = (warehouseId: number | null): IPageLink => ({
	to: inventarioBodegaPath(warehouseId),
	authority: Pages.inventory.subPages.inventario.authority,
});

/** Lee el segmento de la ficha de bodega: `null` si no es una ubicación válida. */
export const parseBodegaParam = (param: string | undefined): TInventarioUbicacion | null => {
	if (param === SIN_UBICACION_SLUG) return 'unlocated';
	const warehouseId = parseIdParam(param ?? null);
	return warehouseId === null ? null : locationToken(warehouseId);
};

/** Vista General (productos), Por bodega o Trazabilidad. Viaja en `?vista=`. */
export type TInventarioVista = 'general' | 'bodegas' | 'trazabilidad';

const VISTAS: readonly TInventarioVista[] = ['general', 'bodegas', 'trazabilidad'];

/**
 * Ubicación del filtro: `branch` (toda la sucursal) o el token de una
 * ubicación concreta (`unlocated` / `warehouse:<id>`).
 */
export type TInventarioUbicacion = 'branch' | TLocationToken;

/* =================================================
   Trazabilidad (§14) — tipos de operación
   ================================================= */

/** Los tipos que acepta el filtro `operation_type`: otro valor es 422. */
export type TOperacionTipo = TInventoryOperationType;

interface IOperacionTipoInfo {
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
	initial_stock: { label: 'Stock inicial', icon: 'HeroArchiveBox', accent: 'bg-zinc-700' },
	branch_transfer: {
		label: 'Traslado entre sucursales',
		icon: 'HeroTruck',
		accent: 'bg-violet-700',
	},
	legacy_movement: { label: 'Movimiento histórico', icon: 'HeroClock', accent: 'bg-zinc-500' },
	serial_correction: { label: 'Corrección de serie', icon: 'HeroQrCode', accent: 'bg-zinc-600' },
	stock_reconciliation: {
		label: 'Conciliación de stock',
		icon: 'HeroScale',
		accent: 'bg-amber-700',
	},
};

export const isOperacionTipo = (value: string | null): value is TOperacionTipo =>
	value !== null && Object.prototype.hasOwnProperty.call(OPERACION_TIPOS, value);

/** Un tipo que el front no conoce se muestra con el nombre que trae, sin inventarle etiqueta. */
export const operacionTipoInfo = (type: string): IOperacionTipoInfo =>
	isOperacionTipo(type)
		? OPERACION_TIPOS[type]
		: { label: type, icon: 'HeroQuestionMarkCircle', accent: 'bg-zinc-500' };

/**
 * Trazabilidad: operaciones con al menos un ítem sin (`sin`) o con (`con`)
 * seguimiento por serie. Una venta mixta aparece con los dos.
 */
export type TOperacionSerie = 'sin' | 'con';

export const OPERACION_SERIES: Record<TOperacionSerie, string> = {
	sin: 'Sin serie',
	con: 'Con serie',
};

export const isOperacionSerie = (value: string | null): value is TOperacionSerie =>
	value === 'sin' || value === 'con';

export interface IInventarioFilters {
	vista: TInventarioVista;
	ubicacion: TInventarioUbicacion;
	estado: TInventoryStockStatusFilter | null;
	busqueda: string;
	orden: TInventoryStockSort;
	/** Trazabilidad: tipo de operación (`operation_type`). */
	tipo: TOperacionTipo | null;
	/** Trazabilidad: seguimiento por serie (`serial_tracking`); `null` = todas. */
	serie: TOperacionSerie | null;
	/** Trazabilidad: rango de fechas `AAAA-MM-DD`; vacío = sin límite. */
	desde: string;
	hasta: string;
	page: number;
	perPage: number;
}

export const INVENTARIO_PER_PAGE_DEFAULT = 15;

export const DEFAULT_INVENTARIO_FILTROS: IInventarioFilters = {
	vista: 'general',
	ubicacion: 'branch',
	estado: null,
	busqueda: '',
	orden: 'name',
	tipo: null,
	serie: null,
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
export const isInventarioVista = (value: string | null): value is TInventarioVista =>
	value !== null && (VISTAS as readonly string[]).includes(value);

/**
 * Lee los filtros de la URL. Un valor desconocido cae al valor por defecto en
 * vez de romper la vista: los enlaces viejos o editados a mano siguen abriendo.
 */
export const parseInventarioFilters = (params: URLSearchParams): IInventarioFilters => {
	const bodega = parseIdParam(params.get('bodega'));
	let ubicacion: TInventarioUbicacion = 'branch';
	if (params.get('sin_ubicacion') === '1') ubicacion = 'unlocated';
	else if (bodega !== null) ubicacion = locationToken(bodega);

	const vista = params.get('vista');
	const estado = params.get('estado');
	const orden = params.get('orden');
	const tipo = params.get('tipo');
	const serie = params.get('serie');
	return {
		vista: isInventarioVista(vista) ? vista : 'general',
		ubicacion,
		estado: isEstado(estado) ? estado : null,
		busqueda: params.get('q') ?? '',
		orden: isOrden(orden) ? orden : 'name',
		tipo: isOperacionTipo(tipo) ? tipo : null,
		serie: isOperacionSerie(serie) ? serie : null,
		desde: parseBusinessDateParam(params.get('desde')),
		hasta: parseBusinessDateParam(params.get('hasta')),
		page: parsePageParam(params.get('page'), 1),
		perPage: parsePageParam(
			params.get('per_page'),
			INVENTARIO_PER_PAGE_DEFAULT,
			LIST_MAX_PER_PAGE,
		),
	};
};

/** Escribe sólo lo que difiere del valor por defecto, para URLs cortas y compartibles. */
export const serializeInventarioFilters = (filtros: IInventarioFilters): URLSearchParams => {
	const params = new URLSearchParams();
	if (filtros.vista !== 'general') params.set('vista', filtros.vista);
	if (filtros.ubicacion === 'unlocated') params.set('sin_ubicacion', '1');
	else if (filtros.ubicacion !== 'branch')
		params.set('bodega', String(warehouseIdFromToken(filtros.ubicacion)));
	if (filtros.estado) params.set('estado', filtros.estado);
	if (filtros.busqueda.trim()) params.set('q', filtros.busqueda);
	if (filtros.orden !== 'name') params.set('orden', filtros.orden);
	if (filtros.tipo) params.set('tipo', filtros.tipo);
	if (filtros.serie) params.set('serie', filtros.serie);
	if (filtros.desde) params.set('desde', filtros.desde);
	if (filtros.hasta) params.set('hasta', filtros.hasta);
	if (filtros.page !== 1) params.set('page', String(filtros.page));
	if (filtros.perPage !== INVENTARIO_PER_PAGE_DEFAULT)
		params.set('per_page', String(filtros.perPage));
	return params;
};

/** `branch` no acota: toda la sucursal. */
export const inventoryLocationParams = (
	ubicacion: TInventarioUbicacion,
): IInventoryStockListParams => (ubicacion === 'branch' ? {} : locationStockParams(ubicacion));

const SERIAL_TRACKING_PARAM: Record<TOperacionSerie, 0 | 1> = { sin: 0, con: 1 };

/** Filtros de la pestaña Trazabilidad como parámetros del §14, acotados a la sucursal activa. */
export const trazabilidadParams = (
	filtros: Pick<
		IInventarioFilters,
		'ubicacion' | 'tipo' | 'serie' | 'busqueda' | 'desde' | 'hasta' | 'page' | 'perPage'
	>,
	branchId: number,
): IInventoryOperationsParams => ({
	branch_id: branchId,
	...inventoryLocationParams(filtros.ubicacion),
	operation_type: filtros.tipo ?? undefined,
	serial_tracking: filtros.serie ? SERIAL_TRACKING_PARAM[filtros.serie] : undefined,
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
	params.serial_tracking !== undefined ||
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
	return visibleStockStatus(critical.available_quantity, critical.status);
};

export const ESTADO_LABELS: Record<TInventoryStockStatusFilter, string> = STOCK_STATUS_LABELS;

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
