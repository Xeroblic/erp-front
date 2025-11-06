import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

interface WarehouseInfoCardProps {
	warehouse: {
		name: string;
		code: string;
		branch_name?: string;
	};
}

const WarehouseInfoCard: React.FC<WarehouseInfoCardProps> = ({ warehouse }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Información General</CardTitle>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div>
						<p className='text-sm text-gray-600'>Nombre</p>
						<p className='font-semibold'>{warehouse.name}</p>
					</div>
					<div>
						<p className='text-sm text-gray-600'>Código</p>
						<p className='font-mono'>{warehouse.code}</p>
					</div>
					<div>
						<p className='text-sm text-gray-600'>Sucursal</p>
						<p className='font-semibold'>{warehouse.branch_name || 'N/A'}</p>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default WarehouseInfoCard;
