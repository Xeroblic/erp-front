import type { QuoteStatus } from '@/interface';
import type { TColors } from '@/types/colors.type';

export const QUOTE_STATUS_VALUES = [
	'draft',
	'sent',
	'approved',
	'converted',
	'rejected',
	'expired',
] as const;

export type QuoteStatusValue = (typeof QUOTE_STATUS_VALUES)[number];

const STATUS_SET = new Set<QuoteStatusValue>([...QUOTE_STATUS_VALUES]);

const STATUS_LABELS: Record<QuoteStatusValue, string> = {
	draft: 'Borrador',
	sent: 'Enviada',
	approved: 'Aprobada',
	converted: 'Convertida',
	rejected: 'Rechazada',
	expired: 'Vencida',
};

type BadgeVariant = 'solid' | 'outline' | 'default';

export interface QuoteStatusBadge {
	color: TColors;
	variant: BadgeVariant;
	label: string;
}

const STATUS_BADGE_CONFIG: Record<QuoteStatusValue, QuoteStatusBadge> = {
	draft: { color: 'gray', variant: 'solid', label: STATUS_LABELS.draft },
	sent: { color: 'blue', variant: 'solid', label: STATUS_LABELS.sent },
	approved: { color: 'emerald', variant: 'solid', label: STATUS_LABELS.approved },
	converted: { color: 'indigo', variant: 'solid', label: STATUS_LABELS.converted },
	rejected: { color: 'red', variant: 'solid', label: STATUS_LABELS.rejected },
	expired: { color: 'slate', variant: 'solid', label: STATUS_LABELS.expired },
};

export const normalizeQuoteStatusValue = (status?: QuoteStatus): QuoteStatusValue => {
	const normalized = (status ?? 'draft').toString().toLowerCase() as QuoteStatusValue;
	return STATUS_SET.has(normalized) ? normalized : 'draft';
};

export const getQuoteStatusLabel = (status?: QuoteStatus) =>
	STATUS_LABELS[normalizeQuoteStatusValue(status)];

export const getQuoteStatusBadge = (status?: QuoteStatus) =>
	STATUS_BADGE_CONFIG[normalizeQuoteStatusValue(status)];

export const quoteStatusOptions = QUOTE_STATUS_VALUES.map((value) => ({
	value,
	label: STATUS_LABELS[value],
}));

export const quoteStatusFilterOptions = [
	{ value: 'all', label: 'Todos los estados' },
	...quoteStatusOptions,
];
