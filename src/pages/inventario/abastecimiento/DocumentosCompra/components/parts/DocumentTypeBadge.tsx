import React from 'react';
import Badge from '@/components/ui/Badge';
import type { TPurchaseDocumentType } from '@/interface/procurement.interface';
import { DOCUMENT_TYPE_LABELS } from '../../types';

interface IDocumentTypeBadgeProps {
	documentType: TPurchaseDocumentType;
}

/** `invoice` = factura, `receipt` = boleta (sección 6 del contrato). */
const DocumentTypeBadge: React.FC<IDocumentTypeBadgeProps> = ({ documentType }) => (
	<Badge color={documentType === 'invoice' ? 'blue' : 'violet'} variant='outline'>
		{DOCUMENT_TYPE_LABELS[documentType]}
	</Badge>
);

export default DocumentTypeBadge;
