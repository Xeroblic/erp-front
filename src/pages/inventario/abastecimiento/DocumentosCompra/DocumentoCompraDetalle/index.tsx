import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import DocumentoCompraDetalleView from './DocumentoCompraDetalleView';

const DocumentoCompraDetalle = () => (
	<ProcurementMockGate title='Documento de compra' icon='HeroDocumentText'>
		<DocumentoCompraDetalleView />
	</ProcurementMockGate>
);

export default DocumentoCompraDetalle;
