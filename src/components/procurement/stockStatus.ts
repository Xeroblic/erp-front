import type { TInventoryStockStatusFilter } from '@/interface/inventoryOverview.interface';
import type { TStatusPillColor } from './StatusPill';

/**
 * Estado visible del stock de un producto, compartido por Inventario y por
 * Reportes › Inventario para que una misma fila diga lo mismo en ambas.
 */

/** De más a menos urgente: orden de las opciones, del gráfico y del orden por estado. */
export const STOCK_STATUS_ORDER: readonly TInventoryStockStatusFilter[] = [
	'out',
	'critical',
	'unconfigured',
	'healthy',
];

export const STOCK_STATUS_LABELS: Record<TInventoryStockStatusFilter, string> = {
	out: 'Sin disponible',
	critical: 'Bajo el umbral',
	unconfigured: 'Sin umbral',
	healthy: 'Normal',
};

export const STOCK_STATUS_COLORS: Record<TInventoryStockStatusFilter, TStatusPillColor> = {
	out: 'red',
	critical: 'amber',
	unconfigured: 'zinc',
	healthy: 'emerald',
};

/** «Sin disponible» gana a los estados del umbral: si no queda nada para vender, es lo que importa. */
export const visibleStockStatus = (
	availableQuantity: number,
	status: TInventoryStockStatusFilter,
): TInventoryStockStatusFilter => (availableQuantity <= 0 ? 'out' : status);
