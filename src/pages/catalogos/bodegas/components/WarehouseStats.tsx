import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';

interface WarehouseStatsProps {
	total: number;
	actives: number;
	withProducts: number;
	nearCapacity: number;
}

const WarehouseStats: React.FC<WarehouseStatsProps> = ({
	total,
	actives,
	withProducts,
	nearCapacity,
}) => {
	return (
		<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
			<Card className='rounded-lg p-4'>
				<CardBody className='flex items-center justify-between'>
					<div>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Total
						</p>
						<p className='mt-1 text-2xl font-semibold text-gray-900 dark:text-white'>
							{total}
						</p>
					</div>
					<Icon icon='HeroHomeModern' className='size-8 text-blue-600' />
				</CardBody>
			</Card>

			<Card className='rounded-lg p-4'>
				<div className='flex items-center justify-between'>
					<div>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Activas
						</p>
						<p className='mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400'>
							{actives}
						</p>
					</div>
					<Icon icon='HeroCheckCircle' className='size-8 text-emerald-600' />
				</div>
			</Card>

			<Card className='rounded-lg p-4'>
				<CardBody className='flex items-center justify-between'>
					<div>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Con productos
						</p>
						<p className='mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400'>
							{withProducts}
						</p>
					</div>
					<Icon icon='HeroArchiveBox' className='size-8 text-blue-600' />
				</CardBody>
			</Card>

			<Card className='rounded-lg p-4'>
				<CardBody className='flex items-center justify-between'>
					<div>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Cerca capacidad
						</p>
						<p className='mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400'>
							{nearCapacity}
						</p>
					</div>
					<Icon icon='HeroExclamationTriangle' className='size-8 text-amber-600' />
				</CardBody>
			</Card>
		</div>
	);
};

export default WarehouseStats;
