import type { ISaleItem } from '@/interface';
import type { PendingSerialSale } from '@/services/salesService';

/**
 * Formatea un número o string numérico a formato moneda Chilena (CLP)
 * Ej: 10000 -> $ 10.000
 */
export const formatCLP = (amount: number | string): string => {
	const n = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (!Number.isFinite(n)) return '$ 0';

	// Redondea al peso más cercano y muestra sin decimales
	const rounded = Math.round(n);
	const withThousands = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return `$ ${withThousands}`;
};

export const translateStatus = (status?: string | null): string => {
	const key = String(status || '').toLowerCase();
	switch (key) {
		case 'draft':
			return 'Borrador';
		case 'pending':
			return 'Pendiente';
		case 'on-hold':
			return 'En espera de pago';
		case 'confirmed':
			return 'Confirmado';
		case 'processing':
			return 'Procesando (Pagado)';
		case 'paid':
			return 'Pagado (Listo)';
		case 'completed':
			return 'Completado';
		case 'delivered':
			return 'Entregado';
		case 'cancelled':
			return 'Cancelado';
		case 'refunded':
			return 'Reembolsado';
		default:
			return status || 'Desconocido';
	}
};

/**
 * Helper para determinar si una venta se considera "Pagada" financieramente
 */
export const isPaidStatus = (status?: string | null) => {
	const key = String(status || '').toLowerCase();
	return ['processing', 'paid', 'completed', 'delivered'].includes(key);
};

/**
 * Mapea los `serialized_items` de una venta pendiente de serie al shape de
 * `ISaleItem` que consume `CloseSaleModal` (el modal de asignación de series).
 */
export const pendingSerialToSaleItems = (sale: PendingSerialSale): ISaleItem[] =>
	(sale.serialized_items ?? []).map(
		(si) =>
			({
				id: si.sale_item_id,
				sale_id: sale.id,
				product_id: si.product_id,
				name: si.name,
				sku: si.sku,
				// La cantidad de series a escanear es la cantidad total del ítem
				// (así lo dimensiona el backend: sugerencias y shortage van por
				// `quantity`, no por `hold_quantity`, que solo refleja los holds
				// activos actuales). Usar hold_quantity pedía series de menos.
				quantity: si.quantity,
				product: { name: si.name, sku: si.sku },
			}) as unknown as ISaleItem,
	);
