import React from 'react';
import Badge from '@/components/ui/Badge';
import type { WarrantyStatus } from '@/interface/warranties.interface';
import { warrantyStatusColorMap } from '../utils/warranty.utils';

interface WarrantyStatusBadgeProps {
	status: WarrantyStatus;
}

const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({ status }) => {
	const palette = warrantyStatusColorMap[status] || warrantyStatusColorMap.Activa;
	return (
		<Badge
			color={palette.color}
			colorIntensity={palette.intensity}
			variant='solid'
			className='text-xs font-semibold tracking-wide text-white uppercase'>
			{status}
		</Badge>
	);
};

export default WarrantyStatusBadge;
