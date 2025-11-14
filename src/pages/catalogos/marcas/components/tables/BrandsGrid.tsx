import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency } from '../utils';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { IBrand } from '@/interface/brand.interface';

type BrandsGridProps = {
	brands: IBrand[];
	loading: boolean;
	branchLookup?: Record<number, string>;
	onView: (brand: IBrand) => void;
	onEdit: (brand: IBrand) => void;
	onDelete: (brand: IBrand) => void;
};

const BrandsGrid: React.FC<BrandsGridProps> = ({
	brands,
	loading,
	branchLookup = {},
	onView,
	onEdit,
	onDelete,
}) => {
	const renderImage = (brand: IBrand) => {
		const rawImage = (brand as unknown as { image?: unknown }).image;
		const imageUrlRaw =
			brand.image?.url ??
			(typeof rawImage === 'string' && rawImage.length > 0 ? rawImage : null) ??
			brand.logo_url ??
			brand.photo_url ??
			null;
		const imageUrl = ensureAbsoluteUrl(imageUrlRaw ?? undefined);

		if (!imageUrl) {
			return (
				<div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500'>
					<Icon icon='HeroTag' className='h-6 w-6' />
				</div>
			);
		}

		return (
			<img
				src={imageUrl}
				alt={brand.image?.alt ?? brand.name}
				className='h-14 w-14 rounded-2xl border border-zinc-200 bg-white object-contain p-1'
			/>
		);
	};

	const renderBody = () => {
		if (loading) {
			return (
				<div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<Icon icon='HeroArrowPath' className='h-9 w-9 animate-spin text-violet-500' />
					<p className='text-sm text-gray-600 dark:text-gray-300'>
						Cargando marcas disponibles en esta sucursal...
					</p>
				</div>
			);
		}

		if (!brands.length) {
			return (
				<div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroSparkles' className='h-8 w-8 text-zinc-400' />
					</div>
					<div>
						<p className='font-medium text-zinc-900 dark:text-white'>
							No se encontraron marcas para esta sucursal
						</p>
						<p className='text-sm text-zinc-500'>Crea una marca nueva o cambia la sucursal.</p>
					</div>
				</div>
			);
		}

		return (
			<div className='grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3'>
				{brands.map((brand) => {
					const branchName =
						(brand.branch_id && branchLookup[brand.branch_id]) ||
						(brand.branch_id ? `Sucursal #${brand.branch_id}` : 'Sucursal no asignada');

					return (
						<div
							key={brand.id}
							className='flex h-full flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70'>
							<div className='flex items-start gap-4'>
								{renderImage(brand)}
								<div className='flex-1'>
									<div className='flex items-center justify-between gap-3'>
										<div>
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
									<div className='mt-2 flex items-center gap-2 text-xs text-zinc-500'>
										<Icon icon='HeroMapPin' className='h-3.5 w-3.5 text-violet-400' />
										<span>{branchName}</span>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3 text-sm'>
								<div className='rounded-xl border border-violet-100 bg-violet-50/80 p-3 dark:border-violet-900/40 dark:bg-violet-900/10'>
									<p className='text-xs text-violet-700 dark:text-violet-200'>Productos</p>
									<p className='mt-1 text-xl font-semibold text-violet-900 dark:text-violet-100'>
										{brand.products_count ?? 0}
									</p>
								</div>
								<div className='rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/10'>
									<p className='text-xs text-emerald-800 dark:text-emerald-200'>Ventas</p>
									<p className='mt-1 text-xl font-semibold text-emerald-900 dark:text-emerald-100'>
										{formatCurrency(brand.total_sales || 0)}
									</p>
								</div>
							</div>

							<div className='flex flex-wrap gap-2 text-xs text-zinc-500'>
								{brand.updated_at && (
									<span className='inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800'>
										<Icon icon='HeroClock' className='h-3 w-3 text-zinc-400' />
										Actualizada {new Date(brand.updated_at).toLocaleDateString()}
									</span>
								)}
								{brand.branch_id && (
									<span className='inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-800'>
										<Icon icon='HeroBuildingLibrary' className='h-3 w-3 text-zinc-400' />
										ID {brand.branch_id}
									</span>
								)}
							</div>

							<div className='mt-auto flex flex-col gap-2 border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800'>
								<div className='flex gap-2'>
									<Button variant='outline' size='sm' icon='HeroEye' onClick={() => onView(brand)}>
										Ver
									</Button>
									<Button variant='outline' size='sm' icon='HeroPencil' onClick={() => onEdit(brand)}>
										Editar
									</Button>
								</div>
								<Button
									variant='outline'
									color='red'
									size='sm'
									icon='HeroTrash'
									onClick={() => onDelete(brand)}>
									Eliminar
								</Button>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle>Marcas visibles</CardTitle>
					<span className='text-sm text-gray-500 dark:text-gray-400'>
						{brands.length} registros
					</span>
				</div>
			</CardHeader>
			<CardBody className='p-0'>{renderBody()}</CardBody>
		</Card>
	);
};

export default BrandsGrid;
