import type {
	DeferredPaymentDocumentType,
	DeferredPaymentStatus,
} from '@/interface/deferredPayments.interface';
import { formatCLP, formatDate } from '@/utils/format.utils';

export const DEFERRED_PAYMENT_STATUS_LABELS: Record<DeferredPaymentStatus, string> = {
	pending: 'Pendiente',
	partially_paid: 'Parcial',
	paid: 'Pagado',
};

export const DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS: Record<DeferredPaymentDocumentType, string> = {
	electronic_invoice: 'Factura electrónica',
	invoice: 'Factura',
	receipt: 'Boleta',
	other: 'Otro',
};

export const getDaysUntilDueText = (daysUntilDue: number): string => {
	if (daysUntilDue === 0) return 'Vence hoy';
	if (daysUntilDue < 0) {
		const overdueDays = Math.abs(daysUntilDue);
		return `Vencido ${overdueDays} ${overdueDays === 1 ? 'día' : 'días'}`;
	}
	return `Vence en ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}`;
};

export const formatDeferredPaymentDate = (date: string): string => formatDate(date, 'es-CL');

export const formatDeferredPaymentAmount = (amount: string | number): string => formatCLP(amount);
