import React from 'react';
import { StatusPill } from '@/components/procurement';

interface ISupplierStatusBadgeProps {
	isActive: boolean;
}

/** Activo/Inactivo del proveedor. Desactivado es soft delete, no un error. */
const SupplierStatusBadge: React.FC<ISupplierStatusBadgeProps> = ({ isActive }) => (
	<StatusPill color={isActive ? 'emerald' : 'zinc'} width={6}>
		{isActive ? 'Activo' : 'Inactivo'}
	</StatusPill>
);

export default SupplierStatusBadge;
