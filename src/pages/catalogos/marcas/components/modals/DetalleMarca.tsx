import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { IBrand } from '@/interface/brand.interface';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import { formatCurrency } from '../utils';

type DetalleMarcaProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	brand: IBrand | null;
	onEdit?: (brand: IBrand) => void;
};

const DetalleMarca: React.FC<DetalleMarcaProps> = ({ isOpen, setIsOpen, brand, onEdit }) => {
	const formatDate = (value?: string | null) =>
		value ? new Date(value).toLocaleDateString() : '-';
	const resolveImageUrl = (value?: string | null) =>
		value ? (ensureAbsoluteUrl(value) ?? value) : null;

	const coverImage =
		resolveImageUrl(brand?.image?.url ?? brand?.logo_url ?? undefined) ?? undefined;

	const galleryImages = brand?.gallery ?? [];
	const galleryPreview = galleryImages.slice(0, 5);
	const galleryOverflow =
		galleryImages.length > galleryPreview.length
			? galleryImages.length - galleryPreview.length
			: 0;

	const stats = brand
		? [
				{
					label: 'Productos',
					value: brand.products_count?.toLocaleString?.() ?? brand.products_count ?? 0,
				},
				{
					label: 'Ventas',
					value: formatCurrency(brand.total_sales),
					accent: 'text-emerald-600',
				},
				{
					label: 'Creación',
					value: formatDate(brand.created_at),
				},
				{
					label: 'Actualización',
					value: formatDate(brand.updated_at),
				},
			]
		: [];

	const hasDetails = Boolean(brand?.origin_country || brand?.manufacturer);

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'>
						<Icon icon='HeroEye' className='h-5 w-5' />
					</div>
					<div>
						<h2 className='text-lg font-semibold'>Detalle de la marca</h2>
						<p className='text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
							Información esencial y actividad reciente
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{brand ? (
					<div className='space-y-5'>
						<section className='rounded-2xl border border-zinc-100 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/60'>
							<div className='flex items-start gap-4'>
								<div className='flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-white/10'>
									{coverImage ? (
										<img
											src={coverImage}
											alt={brand.image?.alt ?? brand.name}
											className='h-12 w-12 object-contain'
										/>
									) : (
										<Icon icon='HeroTag' className='h-8 w-8 text-zinc-400' />
									)}
								</div>
								<div className='flex-1 space-y-1'>
									<div className='flex flex-wrap items-center gap-2'>
										<h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>
											{brand.name}
										</h3>
										<Badge
											variant='outline'
											color={brand.is_active ? 'emerald' : 'rose'}
											colorIntensity='500'
											className='text-xs font-medium uppercase'>
											{brand.is_active ? 'Activa' : 'Inactiva'}
										</Badge>
									</div>
									{brand.code && (
										<p className='text-xs uppercase tracking-wide text-zinc-500'>
											Código {brand.code}
										</p>
									)}
									{brand.website_url && (
										<a
											href={brand.website_url}
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-500'>
											Visitar sitio
											<Icon
												icon='HeroArrowUpRight'
												className='ml-1 h-3.5 w-3.5'
											/>
										</a>
									)}
								</div>
								<div className='text-right'>
									<p className='text-xs uppercase tracking-wide text-zinc-400'>
										Productos
									</p>
									<p className='text-xl font-semibold text-zinc-900 dark:text-white'>
										{brand.products_count}
									</p>
								</div>
							</div>
						</section>

						<section className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-4'>
							{stats.map((stat) => (
								<div
									key={stat.label}
									className='rounded-xl border border-zinc-100 bg-white/40 p-3 text-left shadow-sm dark:border-white/10 dark:bg-zinc-900/40'>
									<p className='text-[11px] uppercase tracking-wide text-zinc-500'>
										{stat.label}
									</p>
									<p
										className={`mt-1 text-base font-semibold ${stat.accent ?? ''}`}>
										{stat.value}
									</p>
								</div>
							))}
						</section>

						<section className='rounded-2xl border border-zinc-100 bg-white/50 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/50'>
							<div className='flex items-center justify-between text-sm'>
								<h4 className='font-semibold'>Galería</h4>
								{galleryImages.length > 0 && (
									<span className='text-xs text-zinc-500'>
										{galleryImages.length}{' '}
										{galleryImages.length === 1 ? 'imagen' : 'imágenes'}
									</span>
								)}
							</div>
							{galleryImages.length > 0 ? (
								<div className='mt-3 flex gap-2 overflow-x-auto pb-1'>
									{galleryPreview.map((img, idx) => {
										const url =
											resolveImageUrl(img.thumb ?? undefined) ??
											resolveImageUrl(img.url) ??
											undefined;

										if (!url) return null;

										return (
											<a
												key={`${img.id ?? idx}`}
												href={url}
												target='_blank'
												rel='noopener noreferrer'
												className='flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200 dark:border-white/10 dark:bg-zinc-900'>
												<img
													src={url}
													alt={img.alt ?? `${brand.name}-${idx + 1}`}
													className='h-full w-full object-cover'
												/>
											</a>
										);
									})}
									{galleryOverflow > 0 && (
										<div className='flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs font-semibold text-zinc-500 dark:border-zinc-700'>
											+{galleryOverflow}
										</div>
									)}
								</div>
							) : (
								<p className='mt-3 text-sm text-zinc-500'>
									Aún no hay imágenes en la galería.
								</p>
							)}
						</section>

						{hasDetails && (
							<section className='rounded-2xl border border-zinc-100 bg-white/60 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-zinc-900/60'>
								<h4 className='font-semibold'>Información adicional</h4>
								<dl className='mt-3 space-y-2'>
									{brand.origin_country && (
										<div className='flex items-center justify-between gap-4'>
											<span className='text-zinc-500'>Origen</span>
											<span className='font-medium text-zinc-900 dark:text-white'>
												{brand.origin_country}
											</span>
										</div>
									)}
									{brand.manufacturer && (
										<div className='flex items-center justify-between gap-4'>
											<span className='text-zinc-500'>Fabricante</span>
											<span className='font-medium text-zinc-900 dark:text-white'>
												{brand.manufacturer}
											</span>
										</div>
									)}
								</dl>
							</section>
						)}

						{brand.description && (
							<section className='rounded-2xl border border-zinc-100 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60'>
								<h4 className='font-semibold'>Descripción</h4>
								<p className='mt-2 text-sm text-zinc-600 dark:text-zinc-300'>
									{brand.description}
								</p>
							</section>
						)}
					</div>
				) : (
					<div className='py-6 text-center text-sm text-zinc-500'>
						Selecciona una marca para ver los detalles.
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cerrar
					</Button>
					{brand && onEdit && (
						<Button
							color='blue'
							onClick={() => {
								setIsOpen(false);
								onEdit(brand);
							}}>
							Editar marca
						</Button>
					)}
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DetalleMarca;
