import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import ProveedoresView from './ProveedoresView';

const Proveedores = () => (
	<ProcurementMockGate title='Proveedores' icon='HeroBuildingStorefront'>
		<ProveedoresView />
	</ProcurementMockGate>
);

export default Proveedores;
