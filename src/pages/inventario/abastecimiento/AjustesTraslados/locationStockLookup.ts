import { locationStockParams } from '@/utils/inventoryLocation.util';
import {
	PROCUREMENT_PER_PAGE_MAX,
	type IInventoryStockListParams,
	type IInventoryStockResponse,
	type IInventoryStockRow,
} from '@/interface/procurement.interface';

/** Fuente del stock: la misma que leyó la página 1 del consumidor. */
export type TLocationStockSource = (
	branchId: number,
	params: IInventoryStockListParams,
	signal?: AbortSignal,
) => Promise<IInventoryStockResponse>;

/** Filas de stock de una ubicación por página: el máximo del contrato. */
export const LOCATION_STOCK_PAGE_SIZE = PROCUREMENT_PER_PAGE_MAX;

/**
 * Busca las filas de `productIds` en las páginas 2…`lastPage` del stock de una
 * ubicación; la página 1 ya la trae la consulta del formulario. `GET
 * B/inventory-stock` no filtra por producto y `per_page` ya está en su máximo,
 * así que recorrer las páginas es la única forma de encontrarlas sin adivinar
 * por nombre. Se detiene en cuanto encuentra todas.
 *
 * `source` es obligatoria: el ajuste y el traslado pueden leer de fuentes
 * distintas (backend o mock, según su bandera), y mezclar la página 1 de una
 * con las siguientes de otra perdería productos o traería saldos ajenos.
 */
export const findLocationStockRows = async (
	source: TLocationStockSource,
	branchId: number,
	location: string,
	productIds: readonly number[],
	lastPage: number,
	signal: AbortSignal,
): Promise<Map<number, IInventoryStockRow>> => {
	const pending = new Set(productIds);
	const found = new Map<number, IInventoryStockRow>();
	for (let page = 2; page <= lastPage && pending.size > 0; page += 1) {
		// Secuencial a propósito: se detiene en la página que completa la búsqueda.
		// eslint-disable-next-line no-await-in-loop
		const response = await source(
			branchId,
			{ ...locationStockParams(location), page, per_page: LOCATION_STOCK_PAGE_SIZE },
			signal,
		);
		response.data.forEach((row) => {
			if (!pending.has(row.product.id)) return;
			pending.delete(row.product.id);
			found.set(row.product.id, row);
		});
		if (page >= response.meta.last_page) break;
	}
	return found;
};
