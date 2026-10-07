import { listInventoryStock } from '@/services/procurement/inventoryStock.service';
import { locationStockParams } from '@/utils/inventoryLocation.util';
import {
	PROCUREMENT_PER_PAGE_MAX,
	type IInventoryStockRow,
} from '@/interface/procurement.interface';

/** Filas de stock de una ubicación por página: el máximo del contrato. */
export const LOCATION_STOCK_PAGE_SIZE = PROCUREMENT_PER_PAGE_MAX;

/**
 * Busca las filas de `productIds` en las páginas 2…`lastPage` del stock de una
 * ubicación; la página 1 ya la trae la consulta del formulario. `GET
 * B/inventory-stock` no filtra por producto y `per_page` ya está en su máximo,
 * así que recorrer las páginas es la única forma de encontrarlas sin adivinar
 * por nombre. Se detiene en cuanto encuentra todas.
 */
export const findLocationStockRows = async (
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
		const response = await listInventoryStock(
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
