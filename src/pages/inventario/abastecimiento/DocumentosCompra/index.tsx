import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import DocumentosCompraView from './DocumentosCompraView';

const DocumentosCompra = () => (
	<ProcurementMockGate title='Documentos de compra' icon='HeroDocumentText'>
		<DocumentosCompraView />
	</ProcurementMockGate>
);

export default DocumentosCompra;
