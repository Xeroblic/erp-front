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

const ISO_DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

const isValidDeferredPaymentDate = (value: string): boolean => {
	const dateParts = ISO_DATE_PREFIX_PATTERN.exec(value);
	if (!dateParts) return false;

	const [, year, month, day] = dateParts;
	const calendarDate = `${year}-${month}-${day}`;
	const parsedCalendarDate = new Date(`${calendarDate}T00:00:00.000Z`);
	const hasValidCalendarDate =
		Number.isFinite(parsedCalendarDate.getTime()) &&
		parsedCalendarDate.getUTCFullYear() === Number(year) &&
		parsedCalendarDate.getUTCMonth() + 1 === Number(month) &&
		parsedCalendarDate.getUTCDate() === Number(day);
	if (!hasValidCalendarDate) return false;

	return value.length === calendarDate.length || Number.isFinite(new Date(value).getTime());
};

export const formatDeferredPaymentDate = (date: string | null | undefined): string => {
	const normalizedDate = date?.trim();
	if (!normalizedDate || !isValidDeferredPaymentDate(normalizedDate)) return '—';
	return formatDate(normalizedDate, 'es-CL');
};

export const formatDeferredPaymentAmount = (amount: string | number): string =>
	formatCLP(amount, 2);

export const formatDeferredPaymentInputAmount = (amount: string | number): string => {
	if (typeof amount !== 'string' || !/^\d+\.\d{0,2}$/.test(amount)) {
		return formatDeferredPaymentAmount(amount);
	}

	const [integerPart, decimalPart] = amount.split('.');
	return `${formatCLP(integerPart)},${decimalPart}`;
};

export const parseDeferredPaymentAmount = (value: string): string => {
	const sanitizedValue = value.replace(/[^\d.,]/g, '');
	if (!sanitizedValue.includes(',')) {
		// Un punto al final no puede ser separador de miles: es el decimal recién
		// tecleado sobre un valor que ya se muestra formateado (`$ 50.411` + `.`).
		const typedDecimalMatch = sanitizedValue.match(/^([\d.]*\d)\.$/);
		if (typedDecimalMatch) return `${typedDecimalMatch[1].replace(/\D/g, '')}.`;
		const pointDecimalMatch = sanitizedValue.match(/^(\d+)\.(\d{1,2})$/);
		if (pointDecimalMatch) {
			const [, integerPart, decimalPart] = pointDecimalMatch;
			return `${integerPart}.${decimalPart}`;
		}
	}
	const [integerValue, ...decimalValues] = sanitizedValue.split(',');
	const integerPart = integerValue.replace(/\D/g, '');
	if (decimalValues.length === 0) return integerPart;

	const decimalPart = decimalValues.join('').replace(/\D/g, '').slice(0, 2);
	return `${integerPart || '0'}.${decimalPart}`;
};
