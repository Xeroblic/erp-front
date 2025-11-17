import type { CommercialStatus } from '@/interface/technicalReviews.interface';
import type { TColors } from '@/types/colors.type';

export type CommercialStatusUIConfig = {
	label: string;
	color: TColors;
};

export const COMMERCIAL_STATUS_ORDER: CommercialStatus[] = [
	'unknown',
	'received',
	'in_review',
	'reviewed',
	'available_for_sale',
	'in_quotation',
	'reserved',
	'sold',
	'returned',
	'scrapped',
];

export const COMMERCIAL_STATUS_CONFIG: Record<CommercialStatus, CommercialStatusUIConfig> = {
	unknown: { label: 'Desconocido', color: 'gray' },
	received: { label: 'Ingresado', color: 'sky' },
	in_review: { label: 'En revisión', color: 'blue' },
	reviewed: { label: 'Revisado', color: 'violet' },
	available_for_sale: { label: 'Disponible para venta', color: 'green' },
	in_quotation: { label: 'En cotización', color: 'amber' },
	reserved: { label: 'Reservado', color: 'orange' },
	sold: { label: 'Vendido', color: 'red' },
	returned: { label: 'Devuelto', color: 'pink' },
	scrapped: { label: 'Dado de baja', color: 'slate' },
};

export const COMMERCIAL_STATUS_FILTER_OPTIONS = COMMERCIAL_STATUS_ORDER.map((status) => ({
	value: status,
	label: COMMERCIAL_STATUS_CONFIG[status].label,
}));

export const CHANGEABLE_COMMERCIAL_STATUSES: CommercialStatus[] = [
	'available_for_sale',
	'in_quotation',
	'reserved',
	'sold',
	'returned',
	'scrapped',
];

export const getCommercialStatusLabel = (status?: string | null): string | null => {
	if (!status) return null;
	return COMMERCIAL_STATUS_CONFIG[status as CommercialStatus]?.label ?? null;
};
