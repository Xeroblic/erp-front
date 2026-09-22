import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import RecepcionDetalleView from './RecepcionDetalleView';

const RecepcionDetalle = () => (
	<ProcurementMockGate title='Recepción' icon='HeroInboxArrowDown'>
		<RecepcionDetalleView />
	</ProcurementMockGate>
);

export default RecepcionDetalle;
