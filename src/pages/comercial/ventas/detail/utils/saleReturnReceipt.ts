import type {
	IConfirmSaleReturnItem,
	IConfirmSaleReturnReceiptResponse,
	IConfirmSaleReturnRequest,
	ISaleReturn,
	ISaleReturnItem,
} from '@/interface/sales.interface';
import type { IStockReceiptWarehouse } from '@/interface/procurement.interface';
import {
	UNLOCATED_KEY,
	fromWarehouseKey,
	toItemKey,
	toWarehouseKey,
	type IReturnAllocationRow,
	type IReturnReceiptItemValues,
	type IReturnReceiptValues,
} from '../types';

/** «SKU — nombre» del producto de un ítem de la devolución. */
export const describeReturnProduct = (item: ISaleReturnItem): string =>
	item.product.sku ? `${item.product.sku} — ${item.product.name}` : item.product.name;

/**
 * Punto de partida: un ítem sin serie, en una sola parte apta con toda su cantidad y
 * sin bodega elegida; cada serie, apta y en la bodega que ya tenía.
 */
export const buildReturnReceiptValues = (
	items: readonly ISaleReturnItem[],
): IReturnReceiptValues => {
	const values: Record<string, IReturnReceiptItemValues> = {};
	items.forEach((item) => {
		values[toItemKey(item.sale_item_id)] = item.serial_tracking
			? {
					rows: [],
					serials: item.serial_numbers.map((serialNumber) => ({
						serialNumber,
						warehouseKey: UNLOCATED_KEY,
						condition: 'fit',
						reason: '',
					})),
				}
			: {
					rows: [
						{
							warehouseKey: '',
							quantity: item.quantity_expected,
							condition: 'fit',
							reason: '',
						},
					],
					serials: [],
				};
	});
	return { items: values };
};

export const EMPTY_RETURN_ROW: IReturnAllocationRow = {
	warehouseKey: '',
	quantity: '',
	condition: 'fit',
	reason: '',
};

/** El motivo sólo viaja en lo no apto: lo apto lo lleva `null`. */
const toReason = (condition: string, reason: string): string | null =>
	condition === 'unfit' ? reason.trim() : null;

/**
 * Cuerpo de `confirm-return` en el mismo orden de `items` de la devolución, para que la
 * `N` de los errores `items.N…` del backend sea la posición del ítem en ella.
 */
export const toConfirmReturnRequest = (
	saleReturn: ISaleReturn,
	values: IReturnReceiptValues,
): IConfirmSaleReturnRequest => ({
	return_id: saleReturn.id,
	items: saleReturn.items.map((item): IConfirmSaleReturnItem => {
		const itemValues = values.items[toItemKey(item.sale_item_id)];
		if (item.serial_tracking) {
			return {
				sale_item_id: item.sale_item_id,
				serials: (itemValues?.serials ?? []).map((serial) => ({
					serial_number: serial.serialNumber,
					warehouse_id: fromWarehouseKey(serial.warehouseKey),
					condition: serial.condition,
					reason: toReason(serial.condition, serial.reason),
				})),
			};
		}
		return {
			sale_item_id: item.sale_item_id,
			allocations: (itemValues?.rows ?? []).map((row) => ({
				warehouse_id: fromWarehouseKey(row.warehouseKey),
				quantity: Number(row.quantity),
				condition: row.condition,
				reason: toReason(row.condition, row.reason),
			})),
		};
	}),
});

export interface IReturnFieldErrors {
	/** Por `sale_item_id`: los errores de ruta `items.N…` de ese ítem. */
	byItem: Record<number, string[]>;
	/** Los que no nombran un ítem (`items`, `return_id`). */
	general: string[];
}

const ITEM_PATH = /^items\.(\d+)(?:\.(allocations|serials)\.(\d+))?/;

/**
 * Reparte los `errors` del 422 por ítem. `items.N` es la posición del ítem en el
 * request; una ruta más profunda nombra la parte (`allocations.M`) o la serie
 * (`serials.M`) para que se pueda encontrar dentro del ítem.
 */
export const groupReturnFieldErrors = (
	fieldErrors: Record<string, string[]> | null,
	saleReturn: ISaleReturn,
	values: IReturnReceiptValues,
): IReturnFieldErrors => {
	const byItem: Record<number, string[]> = {};
	const general: string[] = [];
	Object.entries(fieldErrors ?? {}).forEach(([path, messages]) => {
		const match = ITEM_PATH.exec(path);
		const item = match ? saleReturn.items[Number(match[1])] : undefined;
		if (!match || !item) {
			general.push(...messages);
			return;
		}
		const [, , kind, rawIndex] = match;
		let prefix = '';
		if (kind === 'allocations') {
			prefix = `Parte ${Number(rawIndex) + 1}: `;
		} else if (kind === 'serials') {
			const serial = values.items[toItemKey(item.sale_item_id)]?.serials[Number(rawIndex)];
			prefix = serial ? `Serie ${serial.serialNumber}: ` : `Serie ${Number(rawIndex) + 1}: `;
		}
		(byItem[item.sale_item_id] ??= []).push(...messages.map((message) => prefix + message));
	});
	return { byItem, general };
};

/** Bodegas activas de la sucursal, que son las que el backend acepta para recibir. */
export const toOfferedWarehouseKeys = (
	warehouses: readonly IStockReceiptWarehouse[],
): Set<string> =>
	new Set([
		UNLOCATED_KEY,
		...warehouses
			.filter((warehouse) => warehouse.is_active)
			.map((warehouse) => toWarehouseKey(warehouse.id)),
	]);

const unitsLabel = (count: number, adjective: string): string =>
	count === 1 ? `1 ${adjective}` : `${count} ${adjective}s`;

/** «Recepción confirmada correctamente: 3 aptas, 2 no aptas». */
export const describeReturnReceipt = (response: IConfirmSaleReturnReceiptResponse): string => {
	const items = response.data?.items ?? [];
	const fit = items.reduce((sum, item) => sum + item.fit_quantity, 0);
	const unfit = items.reduce((sum, item) => sum + item.unfit_quantity, 0);
	const parts = [
		fit > 0 ? unitsLabel(fit, 'apta') : null,
		unfit > 0 ? unitsLabel(unfit, 'no apta') : null,
	].filter((part): part is string => part !== null);
	const message = response.message || 'Recepción confirmada correctamente';
	return parts.length > 0 ? `${message}: ${parts.join(', ')}.` : message;
};
