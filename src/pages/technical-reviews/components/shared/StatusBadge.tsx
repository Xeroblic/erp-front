/**
 * StatusBadge - Badge para mostrar estados de revisión y comerciales
 */
import React from 'react';
import Badge from '@/components/ui/Badge';
import type { ReviewStatus, CommercialStatus } from '@/interface/technicalReviews.interface';

interface StatusBadgeProps {
	status: ReviewStatus | CommercialStatus;
	type: 'review' | 'commercial';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
	const getReviewStatusConfig = (status: ReviewStatus) => {
		switch (status) {
			case 'pending':
				return { color: 'amber', label: 'Pendiente' };
			case 'in_review':
				return { color: 'blue', label: 'En Revisión' };
			case 'reviewed':
				return { color: 'purple', label: 'Revisada' };
			case 'approved':
				return { color: 'green', label: 'Aprobada' };
			default:
				return { color: 'gray', label: status };
		}
	};

	const getCommercialStatusConfig = (status: CommercialStatus) => {
		switch (status) {
			case 'unknown':
				return { color: 'gray', label: 'Desconocido' };
			case 'received':
				return { color: 'blue', label: 'Recibido' };
			case 'available_for_sale':
				return { color: 'green', label: 'Disponible' };
			case 'in_quotation':
				return { color: 'amber', label: 'En Cotización' };
			case 'sold':
				return { color: 'red', label: 'Vendido' };
			case 'reserved':
				return { color: 'orange', label: 'Reservado' };
			default:
				return { color: 'gray', label: status };
		}
	};

	const config =
		type === 'review'
			? getReviewStatusConfig(status as ReviewStatus)
			: getCommercialStatusConfig(status as CommercialStatus);

	return <Badge variant={config.color as any}>{config.label}</Badge>;
};

export default StatusBadge;
