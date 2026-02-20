/**
 * StatusBadge - Badge para mostrar estados de revisión y comerciales
 */
import React from 'react';
import Badge from '@/components/ui/Badge';
import type { ReviewStatus, CommercialStatus } from '@/interface/technicalReviews.interface';
import type { TColors } from '@/types/colors.type';
import { arrColors } from '@/types/colors.type';
import { COMMERCIAL_STATUS_CONFIG } from '@/pages/refactor-technical-review/components/constants/statuses.constant';

type StatusOption = {
	value?: ReviewStatus | CommercialStatus | string | null;
	label?: string | null;
	color?: string | null;
};

type StatusValue = ReviewStatus | CommercialStatus | StatusOption | null | undefined;

interface StatusBadgeProps {
	status: StatusValue;
	type: 'review' | 'commercial';
}

const AVAILABLE_COLORS = new Set<TColors>(arrColors);

const formatLabel = (value: string) =>
	value
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());

const isStatusOption = (status: StatusValue): status is StatusOption =>
	typeof status === 'object' && status !== null;

const normalizeStatus = (status: StatusValue) => {
	if (status == null) {
		return { value: 'unknown', customLabel: undefined, customColor: undefined };
	}

	if (typeof status === 'string') {
		return { value: status, customLabel: undefined, customColor: undefined };
	}

	if (isStatusOption(status)) {
		const rawValue = status.value;
		return {
			value:
				typeof rawValue === 'string'
					? rawValue
					: rawValue != null
						? String(rawValue)
						: 'unknown',
			customLabel: status.label ?? undefined,
			customColor: status.color ?? undefined,
		};
	}

	return { value: String(status), customLabel: undefined, customColor: undefined };
};

const isValidTailwindColor = (color?: string | null): color is TColors =>
	!!color && AVAILABLE_COLORS.has(color as TColors);

const getReviewStatusConfig = (status: string) => {
	switch (status as ReviewStatus) {
		case 'pending':
			return { color: 'amber' as TColors, label: 'Pendiente' };
		case 'in_review':
			return { color: 'blue' as TColors, label: 'En Revisión' };
		case 'reviewed':
			return { color: 'purple' as TColors, label: 'Revisada' };
		case 'approved':
			return { color: 'green' as TColors, label: 'Aprobada' };
		default:
			return { color: 'gray' as TColors, label: formatLabel(status) || 'Sin dato' };
	}
};

const getCommercialStatusConfig = (status: string) => {
	const normalized = status as CommercialStatus;
	const config = COMMERCIAL_STATUS_CONFIG[normalized];

	if (config) {
		return config;
	}

	return { color: 'gray' as TColors, label: formatLabel(status) || 'Sin dato' };
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
	const normalized = normalizeStatus(status);

	const config =
		type === 'review'
			? getReviewStatusConfig(normalized.value)
			: getCommercialStatusConfig(normalized.value);

	const badgeColor = isValidTailwindColor(normalized.customColor)
		? normalized.customColor
		: config.color;
	const badgeLabel = normalized.customLabel?.trim() || config.label;

	return (
		<Badge color={badgeColor} variant='outline' className='text-xs font-semibold px-2'>
			{badgeLabel}
		</Badge>
	);
};

export default StatusBadge;
