import type {
	ICloseSaleRequestItem,
	ISaleFulfillmentOptionItem,
} from '@/interface/sales.interface';
import {
	fromWarehouseKey,
	toItemKey,
	toWarehouseKey,
	type ILocationAllocationItemValues,
	type ILocationAllocationRow,
	type ILocationAllocationValues,
} from '../types';

export const UNLOCATED_NAME = 'Sin ubicación';

const EMPTY_ROW: ILocationAllocationRow = { warehouseKey: '', quantity: '' };

/** La sugerencia del backend se puede confirmar tal cual: es el punto de partida. */
const toSuggestedRows = (option: ISaleFulfillmentOptionItem): ILocationAllocationRow[] => {
	const rows = option.suggested_allocations.map((allocation) => ({
		warehouseKey: toWarehouseKey(allocation.warehouse_id),
		quantity: allocation.quantity,
	}));
	return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
};

/** Una elección previa sirve si todas sus ubicaciones siguen ofrecidas. */
const isStillOffered = (
	values: ILocationAllocationItemValues,
	option: ISaleFulfillmentOptionItem,
): boolean => {
	const offered = new Set(
		option.locations.map((location) => toWarehouseKey(location.warehouse_id)),
	);
	return values.rows.every((row) => row.warehouseKey === '' || offered.has(row.warehouseKey));
};

/**
 * Valores del formulario para una vista previa. Sin `previous` (primera carga) cada ítem
 * `manual` parte de su sugerencia. Tras recargar, los ítems de `resetItemIds` (los que
 * el cierre rechazó) vuelven a la sugerencia nueva; el resto conserva lo que eligió el
 * usuario mientras sus ubicaciones sigan ofrecidas.
 */
export const buildLocationAllocationValues = (
	options: ISaleFulfillmentOptionItem[],
	previous?: ILocationAllocationValues,
	resetItemIds: readonly number[] = [],
): ILocationAllocationValues => {
	const reset = new Set(resetItemIds);
	const items: Record<string, ILocationAllocationItemValues> = {};
	options.forEach((option) => {
		if (option.allocation_mode !== 'manual') return;
		const key = toItemKey(option.sale_item_id);
		const kept = previous?.items[key];
		items[key] =
			kept && !reset.has(option.sale_item_id) && isStillOffered(kept, option)
				? kept
				: { rows: toSuggestedRows(option) };
	});
	return { items };
};

/**
 * Líneas `allocations` del cierre: sólo los ítems `manual`. Los `automatic` se omiten
 * (el backend resuelve la única ubicación) y con un `blocked` no se llega a cerrar.
 */
export const toCloseAllocationItems = (
	options: ISaleFulfillmentOptionItem[],
	values: ILocationAllocationValues,
): ICloseSaleRequestItem[] =>
	options
		.filter((option) => option.allocation_mode === 'manual')
		.map((option) => ({
			sale_item_id: option.sale_item_id,
			allocations: (values.items[toItemKey(option.sale_item_id)]?.rows ?? []).map((row) => ({
				warehouse_id: fromWarehouseKey(row.warehouseKey),
				quantity: Number(row.quantity),
			})),
		}));

/**
 * Agrega los nombres de bodega de una vista previa a los ya conocidos. Se acumulan
 * porque una bodega que se quedó sin apto desaparece de `locations`, y el error o el
 * resultado del cierre todavía la nombran.
 */
export const mergeLocationNames = (
	known: ReadonlyMap<number, string>,
	options: ISaleFulfillmentOptionItem[],
): Map<number, string> => {
	const names = new Map(known);
	options.forEach((option) =>
		option.locations.forEach((location) => {
			if (location.warehouse_id !== null) names.set(location.warehouse_id, location.name);
		}),
	);
	return names;
};

export const describeLocation = (
	warehouseId: number | null,
	names: ReadonlyMap<number, string>,
): string =>
	warehouseId === null ? UNLOCATED_NAME : (names.get(warehouseId) ?? `Bodega #${warehouseId}`);
