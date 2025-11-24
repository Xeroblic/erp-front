export const formatCLP = (amount: number | string): string => {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(n)) return '$ 0';
  const rounded = Math.round(n);
  return '$ ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
		case 'confirmed': // legacy, tratar como pendiente
			return 'Confirmado (legacy)';
		case 'processing': // 100% pagado
			return 'Procesando (pagado)';
		case 'paid':
			return 'Pagado';
		case 'completed':
			return 'Completado';
		case 'delivered': // legacy
			return 'Entregado (legacy)';
		case 'cancelled':
			return 'Cancelado';
		case 'refunded':
			return 'Reembolsado';
		// legacy no implementado: dejar comentado como referencia
		// case 'partially_paid':
		// 	return 'Parcialmente pagada (legacy)';
		default:
			return status || '';
	}
};

export const isPaidStatus = (status?: string | null) => {
	const key = String(status || '').toLowerCase();
	return ['processing', 'paid', 'completed', 'delivered'].includes(key);
};

