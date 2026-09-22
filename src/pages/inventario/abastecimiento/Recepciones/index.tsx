import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import RecepcionesView from './RecepcionesView';

const Recepciones = () => (
	<ProcurementMockGate title='Recepciones' icon='HeroInboxArrowDown'>
		<RecepcionesView />
	</ProcurementMockGate>
);

export default Recepciones;
