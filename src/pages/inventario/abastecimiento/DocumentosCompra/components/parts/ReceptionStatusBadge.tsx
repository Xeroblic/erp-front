import React from 'react';
import { StatusPill, type TStatusPillColor } from '@/components/procurement';
import type { TPurchaseDocumentReceptionStatus } from '@/interface/procurement.interface';
import { DOCUMENT_RECEPTION_STATUS_LABELS } from '../../types';

const COLOR_BY_RECEPTION_STATUS: Record<TPurchaseDocumentReceptionStatus, TStatusPillColor> = {
	pending: 'amber',
	partially_received: 'blue',
	received: 'emerald',
};

/** Ancho fijo para «Parcialmente recibida», la más larga de esta columna. */
const PILL_WIDTH_REM = 11;

interface IReceptionStatusBadgeProps {
	/** `null` en `draft`/`cancelled` (sección 6): sin cobertura que mostrar. */
	receptionStatus: TPurchaseDocumentReceptionStatus | null;
	/** Píldora a medida del contenido, en vez del ancho fijo de columna. Ver `StatusPill`. */
	fit?: boolean;
}

/**
 * Cobertura de recepción del documento completo. `null` se ve como «—», pero
 * en la misma píldora (no un guion suelto): las tres variantes de la columna
 * comparten el mismo ancho, tengan o no cobertura que mostrar.
 */
const ReceptionStatusBadge: React.FC<IReceptionStatusBadgeProps> = ({ receptionStatus, fit }) => {
	if (receptionStatus === null)
		return (
			<StatusPill color='zinc' width={PILL_WIDTH_REM} fit={fit}>
				—
			</StatusPill>
		);

	return (
		<StatusPill
			color={COLOR_BY_RECEPTION_STATUS[receptionStatus]}
			width={PILL_WIDTH_REM}
			fit={fit}>
			{DOCUMENT_RECEPTION_STATUS_LABELS[receptionStatus]}
		</StatusPill>
	);
};

export default ReceptionStatusBadge;
