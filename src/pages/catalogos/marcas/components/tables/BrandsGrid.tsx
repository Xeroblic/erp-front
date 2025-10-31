import React, { useEffect, useRef, useState } from 'react';
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
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		function handleDocClick(e: MouseEvent) {
			if (!openDropdownId) return;
			const target = e.target as Node;
			const container = containerRefs.current[openDropdownId];
			if (container && !container.contains(target)) {
				setOpenDropdownId(null);
			}
		}
		document.addEventListener('click', handleDocClick);
		return () => document.removeEventListener('click', handleDocClick);
	}, [openDropdownId]);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle>Lista de marcas</CardTitle>
					<span className='text-sm text-gray-500'>{brands.length} marcas</span>
				</div>
			</CardHeader>
			<CardBody className='p-0'>
				{loading ? (
					<div className='flex items-center justify-center py-12'>
						<Icon
							icon='HeroArrowPath'
							className='h-8 w-8 animate-spin text-violet-600'
						/>
						<span className='ml-2 text-gray-600'>Cargando marcas...</span>
					</div>
				) : (
					<div className='grid grid-cols-1 gap-4 p-6 lg:grid-cols-2 xl:grid-cols-3'>
						{brands.map((brand) => {
							const idKey = String(brand.id);
							const rawImage = (brand as unknown as { image?: unknown }).image;
							const imageUrlRaw =
								brand.image?.url ??
								(typeof rawImage === 'string' && rawImage.length > 0 ? rawImage : null) ??
								brand.logo_url ??
								brand.photo_url ??
								null;
							const imageUrl = ensureAbsoluteUrl(imageUrlRaw ?? undefined);
							const imageAlt = brand.image?.alt ?? brand.name;
							return (
								<div
									key={idKey}
									className='relative rounded-lg border p-4 transition-shadow hover:shadow-md'
									ref={(el) => {
										containerRefs.current[idKey] = el;
									}}
									data-brand-id={idKey}>
									<div className='mb-3 flex items-center space-x-3'>
										{imageUrl ? (
											<img
												className='h-12 w-12 rounded-lg border bg-white object-contain'
												src={imageUrl}
												alt={imageAlt}
											/>
										) : (
											<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200'>
												<Icon
													icon='HeroTag'
													className='h-6 w-6 text-gray-400'
												/>
											</div>
										)}
										<div className='flex-1'>
											<h3 className='font-medium text-gray-900'>
												{brand.name}
											</h3>
											{brand.code && (
												<p className='font-mono text-xs text-gray-500'>
													{brand.code}
												</p>
											)}
											{/* Fabricante removido: backend no lo entrega */}
										</div>
										<Badge color={brand.is_active ? 'emerald' : 'red'}>
											{brand.is_active ? 'Activa' : 'Inactiva'}
										</Badge>
									</div>

									<div className='space-y-2 text-sm'>
										
										<div className='flex justify-between'>
											<span className='text-gray-600'>
												Productos asociados
											</span>
                                    <span className='font-medium'>
                                        {brand.products_count ?? (brand as any)?.associated_products ?? 0}
                                    </span>
										</div>
										{/* <div className='flex justify-between'>
											<span className='text-gray-600'>Ventas vinculadas</span>
											<span className='font-medium text-green-600'>
												{formatCurrency(brand.total_sales)}
											</span>
										</div> */}
									</div>

									<div className='mt-4 flex items-center justify-end lg:justify-between'>
										{/* Desktop / tablet: acciones principales */}

										<div className='hidden space-x-2 lg:flex'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => onView(brand)}>
												<Icon icon='HeroEye' className='mr-1 h-4 w-4' />
												Ver
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => onEdit(brand)}>
												<Icon
													icon='HeroPencilSquare'
													className='mr-1 h-4 w-4'
												/>
												Editar
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => onDelete(brand)}
												isDisable={brand.products_count > 0}
												className={
													brand.products_count > 0
														? 'cursor-not-allowed text-gray-400'
														: 'text-red-600 hover:text-red-900'
												}>
												<Icon icon='HeroTrash' className='mr-1 h-4 w-4' />
												{brand.products_count > 0
													? 'Bloqueado'
													: 'Eliminar'}
											</Button>
										</div>

										{/* Mobile: single dropdown trigger */}
										<div className='relative flex lg:hidden'>
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													setOpenDropdownId((prev) =>
														prev === idKey ? null : idKey,
													)
												}
												aria-expanded={openDropdownId === idKey}
												aria-controls={`brand-menu-${idKey}`}>
												<Icon icon='HeroDotsVertical' className='h-4 w-4' />
											</Button>

											{openDropdownId === idKey && (
												<div
													id={`brand-menu-${idKey}`}
													className='absolute right-0 z-20 mt-2 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800'>

													<button
														onClick={() => {
															onView(brand);
															setOpenDropdownId(null);
														}}
														className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
														type='button'>
														<Icon icon='HeroEye' className='h-4 w-4' />
														Ver
													</button>
													<button
														onClick={() => {
															onEdit(brand);
															setOpenDropdownId(null);
														}}
														className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
														type='button'>
														<Icon
															icon='HeroPencilSquare'
															className='h-4 w-4'
														/>
														Editar
													</button>
													<button
														onClick={() => {
															if (brand.products_count === 0) {
																onDelete(brand);
															}
															setOpenDropdownId(null);
														}}
														className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
															brand.products_count > 0
																? 'cursor-not-allowed text-gray-400'
																: 'text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700'
														}`}
														disabled={brand.products_count > 0}
														type='button'>
														<Icon
															icon='HeroTrash'
															className='h-4 w-4'
														/>
														{brand.products_count > 0
															? 'Bloqueado'
															: 'Eliminar'}
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default BrandsGrid;
