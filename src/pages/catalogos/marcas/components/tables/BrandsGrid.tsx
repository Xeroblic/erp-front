import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { IBrand } from '@/interface/brand.interface';
import Container from '@/components/layouts/Container/Container';

type BrandsGridProps = {
	brands: IBrand[];
	loading: boolean;
	onView: (brand: IBrand) => void;
	onEdit: (brand: IBrand) => void;
	onDelete: (brand: IBrand) => void;
};

const BrandsGrid: React.FC<BrandsGridProps> = ({
	brands,
	loading,
	onView,
	onEdit,
	onDelete,
}) => {
	const renderImage = (brand: IBrand) => {
		const imageUrlRaw =
			brand.image?.url ??
			(brand as any)?.image ??
			brand.logo_url ??
			brand.photo_url ??
			null;

		const imageUrl = ensureAbsoluteUrl(imageUrlRaw ?? undefined);

		return (
			<div className='flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700'>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={brand.image?.alt ?? brand.name}
						className='h-full w-full object-contain p-1 rounded-lg'
					/>
				) : (
					<Icon icon='HeroTag' className='h-6 w-6 text-violet-500' />
				)}
			</div>
		);
	};

	const renderBody = () => {
		if (loading) {
			return (
				<div className='flex flex-col items-center justify-center gap-3 py-12'>
					<Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-violet-500' />
					<p className='text-sm text-gray-600 dark:text-gray-400'>
						Cargando marcas disponibles...
					</p>
				</div>
			);
		}

		if (!brands.length) {
			return (
				<div className='flex flex-col items-center justify-center gap-3 py-14'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroSparkles' className='h-7 w-7 text-zinc-400' />
					</div>
					<p className='font-medium text-zinc-900 dark:text-white'>
						No se encontraron marcas
					</p>
					<p className='text-sm text-zinc-500'>Crea una marca o cambia de sucursal.</p>
				</div>
			);
		}

		return (
			<div className='grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 xl:grid-cols-3'>
				{brands.map((brand) => (
					<Card
						key={brand.id}
						className='border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all'>
						<CardBody className='flex flex-col gap-4'>

							{/* Header image + title */}
							<div className='flex items-start gap-4'>
								{renderImage(brand)}
								<div className='flex-1 space-y-1'>
									<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										{brand.name}
									</h3>
									{brand.code && (
										<p className='text-xs font-mono text-zinc-500'>{brand.code}</p>
									)}
								</div>
								<Badge color={brand.is_active ? 'emerald' : 'red'}>
									{brand.is_active ? 'Activa' : 'Inactiva'}
								</Badge>
							</div>

							{/* metrics */}
							<div className='grid grid-cols-2 gap-3'>
								<div className='rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900/40 dark:bg-violet-900/20'>
									<p className='text-xs text-violet-700 dark:text-violet-200'>Productos</p>
									<p className='mt-1 text-xl font-semibold text-violet-900 dark:text-violet-100'>
										{brand.products_count ?? 0}
									</p>
								</div>
							</div>

							{/* additional info */}
							<div className='flex flex-wrap gap-2 text-xs text-zinc-500'>
								{brand.updated_at && (
									<span className='flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800'>
										<Icon icon='HeroClock' className='h-3.5 w-3.5 text-zinc-400' />
										{new Date(brand.updated_at).toLocaleDateString()}
									</span>
								)}

								{brand.branch_id && (
									<span className='flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800'>
										<Icon icon='HeroBuildingLibrary' className='h-3.5 w-3.5 text-zinc-400' />
										ID {brand.branch_id}
									</span>
								)}
							</div>

							{/* actions */}
							<div className='mt-auto flex flex-col gap-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-3'>
								<div className='flex gap-2'>
									<Button size='sm' variant='outline' icon='HeroEye' onClick={() => onView(brand)}>
										Ver
									</Button>
									<Button size='sm' variant='outline' icon='HeroPencil' onClick={() => onEdit(brand)}>
										Editar
									</Button>
								</div>

								<Button
									size='sm'
									color='red'
									variant='outline'
									icon='HeroTrash'
									onClick={() => onDelete(brand)}>
									Eliminar
								</Button>
							</div>
						</CardBody>
					</Card>
				))}
			</div>
		);
	};

	return (
		<>
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between w-full'>
					<CardTitle>Marcas visibles</CardTitle>
					<span className='text-sm text-gray-500 dark:text-gray-400'>
						{brands.length} registros
					</span>
				</div>
			</CardHeader>

		</Card>
			<div className='p-0'>{renderBody()}</div>
	</>
	);
};

export default BrandsGrid;
