import type { IInventoryStockListParams } from '@/interface/procurement.interface';

/**
 * Ubicación de una escritura de inventario, codificada como texto para que
 * viaje por un `<Select>` sin perder la diferencia entre «Sin ubicación»
 * (`null`, una ubicación real, vendible y trasladable) y «no se eligió nada»
 * (cadena vacía) — una distinción que un `<select>` con `value={null}` borra.
 *
 * A diferencia del filtro de `StockPorUbicacion`, acá **no existe el token
 * `branch`**: un traslado y un ajuste ocurren en una ubicación concreta;
 * «sucursal completa» no es un lugar del que se pueda sacar ni al que se pueda
 * meter stock.
 */
export const UNLOCATED_TOKEN = 'unlocated';
const WAREHOUSE_TOKEN_PREFIX = 'warehouse:';

export const LOCATION_TOKEN_PATTERN = new RegExp(
	`^(${UNLOCATED_TOKEN}|${WAREHOUSE_TOKEN_PREFIX}[1-9]\\d*)$`,
);

export const locationToken = (warehouseId: number | null): string =>
	warehouseId === null ? UNLOCATED_TOKEN : `${WAREHOUSE_TOKEN_PREFIX}${warehouseId}`;

export const warehouseIdFromToken = (token: string): number | null =>
	token === UNLOCATED_TOKEN ? null : Number(token.slice(WAREHOUSE_TOKEN_PREFIX.length));

/** Params de `GET B/inventory-stock` para la ubicación indicada. */
export const locationStockParams = (token: string): IInventoryStockListParams =>
	token === UNLOCATED_TOKEN
		? { unlocated: 1 }
		: { warehouse_id: Number(token.slice(WAREHOUSE_TOKEN_PREFIX.length)) };
