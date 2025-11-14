import React, { useMemo } from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { ISupplier } from '@/interface';

type SupplierStatsProps = {
	items: ISupplier[];
};

const SupplierStats: React.FC<SupplierStatsProps> = ({ items }) => {
	const total = items?.length ?? 0;
	const totalLinks = useMemo(
		() =>
			(items || []).reduce(
				(acc: number, s: any) => acc + (Number(s?.customer_suppliers_count) || 0),
				0,
			),
		[items],
	);

	return (
		<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
			<Card>
				<CardBody className='flex items-center'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
						<Icon icon='HeroTruck' className='h-6 w-6 text-orange-600' />
					</div>
					<div className='ml-4'>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Total Proveedores
						</p>
						<p className='text-2xl font-bold text-gray-900 dark:text-white'>{total}</p>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardBody className='flex items-center'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
						<Icon icon='HeroUsers' className='h-6 w-6 text-blue-600' />
					</div>
					<div className='ml-4'>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Clientes vinculados
						</p>
						<p className='text-2xl font-bold text-gray-900 dark:text-white'>
							{totalLinks}
						</p>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default SupplierStats;
