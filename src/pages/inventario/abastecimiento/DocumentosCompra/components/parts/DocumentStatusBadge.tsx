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
	/** Píldora a medida del contenido, en vez del ancho fijo de columna. Ver `StatusPill`. */
	fit?: boolean;
}

/** Estados documentales (sección 6): `draft`, `confirmed`, `cancelled`. Ancho fijo para «Confirmado», la más larga. */
const DocumentStatusBadge: React.FC<IDocumentStatusBadgeProps> = ({ status, fit }) => (
	<StatusPill color={COLOR_BY_STATUS[status]} width={7.5} fit={fit}>
		{DOCUMENT_STATUS_LABELS[status]}
	</StatusPill>
);

export default DocumentStatusBadge;
