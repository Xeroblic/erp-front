import React from 'react';
import Badge from '@/components/ui/Badge';
import type { TPurchaseDocumentStatus } from '@/interface/procurement.interface';
import { DOCUMENT_STATUS_LABELS } from '../../types';

const COLOR_BY_STATUS: Record<TPurchaseDocumentStatus, 'zinc' | 'green' | 'red'> = {
	draft: 'zinc',
	confirmed: 'green',
	cancelled: 'red',
};

interface IDocumentStatusBadgeProps {
	status: TPurchaseDocumentStatus;
}

/** Estados documentales (sección 6): `draft`, `confirmed`, `cancelled`. */
const DocumentStatusBadge: React.FC<IDocumentStatusBadgeProps> = ({ status }) => (
	<Badge color={COLOR_BY_STATUS[status]} variant='solid'>
		{DOCUMENT_STATUS_LABELS[status]}
	</Badge>
);

export default DocumentStatusBadge;
