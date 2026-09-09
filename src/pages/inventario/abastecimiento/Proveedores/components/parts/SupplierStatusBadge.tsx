import React from 'react';
import Badge from '@/components/ui/Badge';

interface ISupplierStatusBadgeProps {
	isActive: boolean;
}

/** Activo/Inactivo del proveedor. Desactivado es soft delete, no un error. */
const SupplierStatusBadge: React.FC<ISupplierStatusBadgeProps> = ({ isActive }) => (
	<Badge color={isActive ? 'green' : 'zinc'} variant='solid'>
		{isActive ? 'Activo' : 'Inactivo'}
	</Badge>
);

export default SupplierStatusBadge;
