import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ProgressCardProps {
	itemCount: number;
	totalUnits: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ itemCount, totalUnits }) => (
	<Card className='mb-6'>
		<CardBody>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white'>
						<span className='text-sm font-semibold'>{itemCount}</span>
					</div>
					<div>
						<p className='font-medium text-gray-900 dark:text-gray-100'>
							{itemCount} producto{itemCount !== 1 ? 's' : ''} agregado
							{itemCount !== 1 ? 's' : ''}
						</p>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Total: {totalUnits} unidades
						</p>
					</div>
				</div>
				<Badge color='emerald' variant='solid'>
					Listo para transferir
				</Badge>
			</div>
		</CardBody>
	</Card>
);

export default ProgressCard;
