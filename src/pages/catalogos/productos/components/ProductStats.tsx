import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { ProductsStateStats } from '@/interface/product.interface';
import { PRODUCT_STATS_META } from '../constants/products.constant';

interface ProductStatsProps {
	stats: ProductsStateStats;
	loading?: boolean;
}

const ProductStats: React.FC<ProductStatsProps> = ({ stats, loading = false }) => {
	return (
		<div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
			{PRODUCT_STATS_META.map((card) => (
				<Card key={card.key}>
					<CardHeader className='pb-2'>
						<CardTitle className='flex items-center gap-2 text-sm font-medium'>
							<Icon icon={card.icon} className='h-4 w-4' />
							{card.label}
						</CardTitle>
					</CardHeader>
					<CardBody>
						{loading ? (
							<div className='h-6 w-16 animate-pulse rounded border' />
						) : (
							<span className='text-2xl font-semibold'>
								{Number(stats[card.key as keyof ProductsStateStats] ?? 0).toLocaleString('es-CO')}
							</span>
						)}
					</CardBody>
				</Card>
			))}
		</div>
	);
};

export default ProductStats;
