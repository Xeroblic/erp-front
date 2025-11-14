export const formatCLP = (amount: number | string): string => {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(n)) return '$ 0';
  const rounded = Math.round(n);
  return '$ ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const translateStatus = (status?: string | null): string => {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'Borrador';
    case 'confirmed':
      return 'Procesando';
    case 'partially_paid':
      return 'Parcialmente pagada';
    case 'paid':
      return 'Pagada';
    case 'delivered':
      return 'Entregada';
    case 'cancelled':
      return 'Cancelada';
    case 'refunded':
      return 'Reembolsada';
    default:
      return status || '';
  }
};

