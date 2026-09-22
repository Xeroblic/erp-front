import React from 'react';
import { ProcurementMockGate } from '@/components/procurement';
import ProveedoresDetalleView from './ProveedoresDetalleView';

const ProveedoresDetalle = () => (
	<ProcurementMockGate title='Proveedor' icon='HeroBuildingStorefront'>
		<ProveedoresDetalleView />
	</ProcurementMockGate>
);

export default ProveedoresDetalle;
