import Pages from '@/config/pages.config';
import type { IPageLink } from '@/config/procurementLinks';
import { locationToken, UNLOCATED_TOKEN } from '@/utils/inventoryLocation.util';
import type { IWarehouseCompact } from '@/interface/procurement.interface';

/** Pestañas de la página: cada una es un flujo de escritura independiente. */
export const AJUSTES_TRASLADOS_TABS = ['ajuste', 'traslado'] as const;

export type AjustesTrasladosTab = (typeof AJUSTES_TRASLADOS_TABS)[number];

/** Parámetro de búsqueda que hace enlazable cada pestaña (`?tab=traslado`). */
export const AJUSTES_TRASLADOS_TAB_PARAM = 'tab';

export const DEFAULT_AJUSTES_TRASLADOS_TAB: AjustesTrasladosTab = 'ajuste';

export const isAjustesTrasladosTab = (value: unknown): value is AjustesTrasladosTab =>
	typeof value === 'string' && (AJUSTES_TRASLADOS_TABS as readonly string[]).includes(value);

/**
 * Parámetros de preselección (`?tab=ajuste&product_id=12&warehouse_id=3`). En
 * el traslado, `warehouse_id` es el origen. «Sin ubicación» viaja como
 * `warehouse_id=unlocated`: no tiene ID, pero es una ubicación real.
 */
export const AJUSTES_TRASLADOS_PRODUCT_PARAM = 'product_id';
export const AJUSTES_TRASLADOS_WAREHOUSE_PARAM = 'warehouse_id';

/**
 * Preselección leída de la URL, validada sólo en su forma. Que la bodega sea
 * de la sucursal activa y el producto exista lo decide cada pestaña contra sus
 * propias listas; lo que no pasa se ignora y el asistente arranca vacío.
 */
export interface IAjustesTrasladosPreselection {
	/** Token de ubicación (`warehouse:<id>` o `unlocated`), o `null`. */
	location: string | null;
	productId: number | null;
}

export const NO_PRESELECTION: IAjustesTrasladosPreselection = { location: null, productId: null };

const parsePositiveId = (raw: string | null): number | null => {
	if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;
	const id = Number(raw);
	return Number.isSafeInteger(id) ? id : null;
};

/**
 * El producto sólo se preselecciona junto con una ubicación: elegir la
 * ubicación en el primer paso reinicia las líneas, así que un producto suelto
 * se perdería en cuanto el usuario la eligiera.
 */
export const parsePreselection = (
	rawWarehouse: string | null,
	rawProduct: string | null,
): IAjustesTrasladosPreselection => {
	let location: string | null = null;
	if (rawWarehouse === UNLOCATED_TOKEN) location = UNLOCATED_TOKEN;
	else {
		const warehouseId = parsePositiveId(rawWarehouse);
		if (warehouseId !== null) location = locationToken(warehouseId);
	}
	return { location, productId: location ? parsePositiveId(rawProduct) : null };
};

/** La ubicación preseleccionada si es de la sucursal activa; si no, `null`. */
export const resolvePreselectedLocation = (
	location: string | null,
	warehouses: readonly IWarehouseCompact[],
): string | null => {
	if (location === null) return null;
	if (location === UNLOCATED_TOKEN) return location;
	return warehouses.some((warehouse) => locationToken(warehouse.id) === location)
		? location
		: null;
};

export interface IAjustesTrasladosLinkTarget {
	tab: AjustesTrasladosTab;
	productId?: number;
	/** `null` es «Sin ubicación»; ausente, no se preselecciona ubicación. */
	warehouseId?: number | null;
}

/** Enlace a la página con la preselección, con el `authority` de su ruta. */
export const ajustesTrasladosLink = ({
	tab,
	productId,
	warehouseId,
}: IAjustesTrasladosLinkTarget): IPageLink => {
	const params = new URLSearchParams({ [AJUSTES_TRASLADOS_TAB_PARAM]: tab });
	if (warehouseId !== undefined)
		params.set(
			AJUSTES_TRASLADOS_WAREHOUSE_PARAM,
			warehouseId === null ? UNLOCATED_TOKEN : String(warehouseId),
		);
	if (productId !== undefined) params.set(AJUSTES_TRASLADOS_PRODUCT_PARAM, String(productId));
	const page = Pages.inventory.subPages.ajustesTraslados;
	return { to: `${page.to}?${params.toString()}`, authority: page.authority };
};

/**
 * Motivo por el que la página no monta los formularios. `ready` es el único
 * estado que los monta: el resto se resuelve antes de pintar pestañas.
 */
export type AjustesTrasladosAccess = 'loading' | 'no-branch' | 'forbidden' | 'disabled' | 'ready';

/** Pasos del asistente de ajuste, en orden. */
export const AJUSTE_STEPS = ['location', 'items', 'reason'] as const;
export type TAjusteStep = (typeof AJUSTE_STEPS)[number];

/** Pasos del asistente de traslado, en orden. */
export const TRASLADO_STEPS = ['route', 'items', 'reason'] as const;
export type TTrasladoStep = (typeof TRASLADO_STEPS)[number];
