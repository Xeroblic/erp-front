import React from 'react';
import { StatusPill } from '@/components/procurement';
import type { TPurchaseDocumentType } from '@/interface/procurement.interface';
import { DOCUMENT_TYPE_LABELS } from '../../types';

interface IDocumentTypeBadgeProps {
	documentType: TPurchaseDocumentType;
	/** Píldora a medida del contenido, en vez del ancho fijo de columna. Ver `StatusPill`. */
	fit?: boolean;
}

/** `invoice` = factura, `receipt` = boleta (sección 6 del contrato). */
const DocumentTypeBadge: React.FC<IDocumentTypeBadgeProps> = ({ documentType, fit }) => (
	<StatusPill color={documentType === 'invoice' ? 'blue' : 'violet'} width={6} fit={fit}>
		{DOCUMENT_TYPE_LABELS[documentType]}
	</StatusPill>
);

export default DocumentTypeBadge;
