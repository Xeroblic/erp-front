import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { ProductsStateStats } from '@/interface/product.interface';
import { PRODUCT_STATS_META } from '../constants/products.constant';

// Importar estilos de Swiper
import 'swiper/css';
import 'swiper/css/free-mode';

interface ProductStatsProps {
	stats: ProductsStateStats;
	loading?: boolean;
}

const ProductStats: React.FC<ProductStatsProps> = ({ stats, loading = false }) => {
	const StatCard = ({ card }: { card: (typeof PRODUCT_STATS_META)[number] }) => (
		<Card className='h-full'>
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
						{Number(stats[card.key as keyof ProductsStateStats] ?? 0).toLocaleString(
							'es-CO',
						)}
					</span>
				)}
			</CardBody>
		</Card>
	);

	return (
		<>
			{/* Swiper para mobile (< md) */}
			<div className='mb-6 md:hidden'>
				<Swiper
					modules={[FreeMode]}
					spaceBetween={16}
					slidesPerView='auto'
					freeMode={true}
					className='!overflow-visible'>
					{PRODUCT_STATS_META.map((card) => (
						<SwiperSlide key={card.key} className='!w-[280px]'>
							<StatCard card={card} />
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			{/* Grid para tablet y desktop (>= md) */}
			<div className='mb-6 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-5'>
				{PRODUCT_STATS_META.map((card) => (
					<StatCard key={card.key} card={card} />
				))}
			</div>
		</>
	);
};

export default ProductStats;
