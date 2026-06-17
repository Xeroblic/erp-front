import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { IBrand } from '@/interface/brand.interface';
import { formatCLP } from '@/pages/comercial/ventas/utils';
import BrandLogo from '../BrandLogo';
import RevealOnScroll from '../RevealOnScroll';

type BrandsGridProps = {
	brands: IBrand[];
	loading: boolean;
	onView: (brand: IBrand) => void;
	onEdit: (brand: IBrand) => void;
	onDelete: (brand: IBrand) => void;
};

const BrandsGrid: React.FC<BrandsGridProps> = ({ brands, loading, onView, onEdit, onDelete }) => {
	if (loading) {
		return (
			<div className='flex flex-col items-center justify-center gap-3 py-16'>
				<Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-violet-500' />
				<p className='text-sm text-zinc-500'>Cargando marcas disponibles...</p>
			</div>
		);
	}

	if (!brands.length) {
		return (
			<Card>
				<CardBody className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroSparkles' className='h-7 w-7 text-zinc-400' />
					</div>
					<p className='font-medium text-zinc-900 dark:text-white'>
						No se encontraron marcas
					</p>
					<p className='text-sm text-zinc-500'>Crea una marca o cambia de sucursal.</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 bg-white dark:bg-zinc-800 p-4 rounded-xl'>
			{brands.map((brand, index) => (
				<RevealOnScroll key={brand.id} delay={Math.min(index, 8) * 30}>
					<Card
						className='h-full cursor-pointer transition-shadow hover:shadow-md hover:bg-zinc-200/20 dark:hover:bg-zinc-700/20'
						onClick={() => onView(brand)}>
						<CardBody className='flex h-full flex-col gap-4'>
							<div className='flex items-start gap-3'>
								<BrandLogo brand={brand} className='h-14 w-14' />
								<div className='min-w-0 flex-1'>
									<h3 className='truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										{brand.name}
									</h3>
									{brand.code && (
										<p className='font-mono text-xs text-zinc-500'>
											{brand.code}
										</p>
									)}
								</div>
								<Badge color={brand.is_active ? 'emerald' : 'zinc'}>
									{brand.is_active ? 'Activa' : 'Inactiva'}
								</Badge>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div className='rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
									<p className='text-xs text-zinc-500'>Productos</p>
									<p className='mt-1 text-xl font-semibold text-zinc-900 dark:text-white'>
										{brand.products_count ?? 0}
									</p>
								</div>
								<div className='rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40'>
									<p className='text-xs text-zinc-500'>Ventas</p>
									<p className='mt-1 text-xl font-semibold text-zinc-900 dark:text-white'>
										{formatCLP(Number(brand.total_sales ?? 0))}
									</p>
								</div>
							</div>

							<div className='mt-auto flex gap-2 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800'>
								<Button
									size='sm'
									variant='outline'
									icon='HeroPencil'
									onClick={(e) => {
										e.stopPropagation();
										onEdit(brand);
									}}>
									Editar
								</Button>
								<Button
									size='sm'
									variant='outline'
									color='red'
									icon='HeroTrash'
									onClick={(e) => {
										e.stopPropagation();
										onDelete(brand);
									}}>
									Eliminar
								</Button>
							</div>
						</CardBody>
					</Card>
				</RevealOnScroll>
			))}
		</div>
	);
};

export default BrandsGrid;
