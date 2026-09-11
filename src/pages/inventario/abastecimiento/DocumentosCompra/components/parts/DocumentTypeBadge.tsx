import React from 'react';
import { StatusPill } from '@/components/procurement';
import type { TPurchaseDocumentType } from '@/interface/procurement.interface';
import { DOCUMENT_TYPE_LABELS } from '../../types';

/** `invoice` = factura, `receipt` = boleta (sección 6 del contrato). */
const DocumentTypeBadge: React.FC<{ documentType: TPurchaseDocumentType }> = ({ documentType }) => (
	<StatusPill color={documentType === 'invoice' ? 'blue' : 'violet'} width={6}>
		{DOCUMENT_TYPE_LABELS[documentType]}
	</StatusPill>
);

export default DocumentTypeBadge;
