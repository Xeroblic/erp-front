import React from 'react';
import { StatusPill, type TStatusPillColor } from '@/components/procurement';
import type { TPurchaseDocumentStatus } from '@/interface/procurement.interface';
import { DOCUMENT_STATUS_LABELS } from '../../types';

const COLOR_BY_STATUS: Record<TPurchaseDocumentStatus, TStatusPillColor> = {
	draft: 'zinc',
	confirmed: 'emerald',
	cancelled: 'red',
};

interface IDocumentStatusBadgeProps {
	status: TPurchaseDocumentStatus;
}

/** Estados documentales (sección 6): `draft`, `confirmed`, `cancelled`. Ancho fijo para «Confirmado», la más larga. */
const DocumentStatusBadge: React.FC<IDocumentStatusBadgeProps> = ({ status }) => (
	<StatusPill color={COLOR_BY_STATUS[status]} width={7.5}>
		{DOCUMENT_STATUS_LABELS[status]}
	</StatusPill>
);

export default DocumentStatusBadge;
