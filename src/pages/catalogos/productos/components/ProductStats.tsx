import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Card, { CardBody } from '@/components/ui/Card'; // Quitamos Header y Title, usaremos solo Body para mas control
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

// Mapa de colores para replicar el estilo de la imagen
// Puedes mover esto a tu archivo de constantes si prefieres
const STYLE_VARIANTS: Record<string, string> = {
	emerald: 'bg-emerald-500/15 text-emerald-500',
	rose: 'bg-rose-500/15 text-rose-500',
	amber: 'bg-amber-500/15 text-amber-500',
	teal: 'bg-teal-500/15 text-teal-500',
	default: 'bg-blue-500/15 text-blue-500',
};

const ProductStats: React.FC<ProductStatsProps> = ({ stats, loading = false }) => {
	const StatCard = ({ card, index }: { card: any; index: number }) => {
		const colorKeys = ['emerald', 'rose', 'amber', 'teal'];
		const selectedColor = card.color || colorKeys[index % colorKeys.length];
		const variantClass = STYLE_VARIANTS[selectedColor] || STYLE_VARIANTS.default;

		return (
			<Card className='h-full w-full border-none bg-[#1E1E2D] shadow-sm'>
				<CardBody className='flex flex-col gap-4'>
					<div className='flex items-center gap-4'>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-xl ${variantClass}`}>
							<Icon icon={card.icon} className='h-6 w-6' />
						</div>
						<span className='text-sm font-medium text-gray-400'>{card.label}</span>
					</div>

					<div>
						{loading ? (
							<div className='h-8 w-24 animate-pulse rounded bg-gray-700' />
						) : (
							<div className='text-2xl font-bold text-white'>
								{Number(
									stats[card.key as keyof ProductsStateStats] ?? 0,
								).toLocaleString('es-CO')}
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		);
	};

	return (
		<>
			<div className='mb-6 md:hidden'>
				<Swiper
					modules={[FreeMode]}
					spaceBetween={16}
					slidesPerView='auto'
					freeMode={true}
					className='!overflow-visible'>
					{PRODUCT_STATS_META.map((card, index) => (
						<SwiperSlide key={card.key} className='!w-[280px]'>
							<StatCard card={card} index={index} />
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className='mb-6 hidden gap-4 md:flex md:flex-wrap md:justify-center'>
     {PRODUCT_STATS_META.map((card, index) => (
        <div key={card.key} className='w-full md:w-[calc(50%-1rem)] lg:w-[calc(20%-1rem)] min-w-[200px]'>
            <StatCard card={card} index={index} />
        </div>
    ))}
</div>
		</>
	);
};

export default ProductStats;
