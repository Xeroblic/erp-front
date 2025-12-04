/**
 * Formatea un número o string numérico a formato moneda Chilena (CLP)
 * Ej: 10000 -> $ 10.000
 */
export const formatCLP = (amount: number | string): string => {
	const n = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (!Number.isFinite(n)) return '$ 0';
	const rounded = Math.round(n);
	return `$ ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
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
