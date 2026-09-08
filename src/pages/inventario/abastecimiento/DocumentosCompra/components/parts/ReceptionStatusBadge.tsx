import React from 'react';
import Badge from '@/components/ui/Badge';
import type { TPurchaseDocumentReceptionStatus } from '@/interface/procurement.interface';
import { DOCUMENT_RECEPTION_STATUS_LABELS } from '../../types';

const COLOR_BY_RECEPTION_STATUS: Record<
	TPurchaseDocumentReceptionStatus,
	'amber' | 'blue' | 'green'
> = {
	pending: 'amber',
	partially_received: 'blue',
	received: 'green',
};

interface IReceptionStatusBadgeProps {
	/** `null` en `draft`/`cancelled` (sección 6): sin cobertura que mostrar. */
	receptionStatus: TPurchaseDocumentReceptionStatus | null;
}

/** Cobertura de recepción del documento completo. `null` se ve como «—». */
const ReceptionStatusBadge: React.FC<IReceptionStatusBadgeProps> = ({ receptionStatus }) => {
	if (receptionStatus === null) return <span className='text-zinc-400'>—</span>;

	return (
		<Badge color={COLOR_BY_RECEPTION_STATUS[receptionStatus]} variant='outline'>
			{DOCUMENT_RECEPTION_STATUS_LABELS[receptionStatus]}
		</Badge>
	);
};

export default ReceptionStatusBadge;
