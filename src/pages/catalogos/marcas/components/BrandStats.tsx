import React from 'react';
import { useAppSelector } from '@/store';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import { formatCurrency } from './utils';
import { IBrandStats } from '@/interface/brand.interface';

type BrandStatsProps = {
	stats: IBrandStats;
};

const BrandStats: React.FC<BrandStatsProps> = ({ stats }) => {
	const brands = useAppSelector((s) => s.brands.items ?? []);
	const noProducts = brands.filter(
		(b: any) => (b?.products_count ?? b?.associated_products ?? 0) === 0,
	).length;

	return (
		<div className='mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2'>
			<Card>
				<CardBody className='flex items-center'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
						<Icon icon='HeroTag' className='h-6 w-6 text-violet-600' />
					</div>
					<div className='ml-4'>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Total de marcas
						</p>
						<p className='text-2xl font-bold text-gray-900 dark:text-white'>
							{stats.total_brands}
						</p>
					</div>
				</CardBody>
			</Card>

			{/* <Card>
			<CardBody className='flex items-center'>
				<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
					<Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
				</div>
				<div className='ml-4'>
					<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
						Marcas activas
					</p>
					<p className='text-2xl font-bold text-gray-900 dark:text-white'>
						{stats.active_brands}
					</p>
				</div>
			</CardBody>
		</Card> */}

			<Card>
				<CardBody className='flex items-center'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
						<Icon icon='HeroPauseCircle' className='h-6 w-6 text-amber-600' />
					</div>
					<div className='ml-4'>
						<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
							Marcas sin productos
						</p>
						<p className='text-2xl font-bold text-gray-900 dark:text-white'>
							{noProducts}
						</p>
					</div>
				</CardBody>
			</Card>

			{/* <Card>
			<CardBody className='flex items-center'>
				<div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
					<Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-green-600' />
				</div>
				<div className='ml-4'>
					<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
						Ventas totales
					</p>
					<p className='text-lg font-bold text-gray-900 dark:text-white'>
						{formatCurrency(stats.total_sales)}
					</p>
					<p className='text-xs text-gray-500'>
						{stats.total_products} productos asociados
					</p>
				</div>
			</CardBody>
		</Card> */}
		</div>
	);
};

export default BrandStats;
