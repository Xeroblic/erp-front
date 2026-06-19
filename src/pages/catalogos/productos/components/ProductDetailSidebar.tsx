import React, { useCallback, useState } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { PRODUCT_TYPE_LABELS } from '../constants/products.constant';
import type { IProduct, IProductCategorySummary } from '@/interface/product.interface';
import { useNavigate } from 'react-router-dom';

interface ProductDetailSidebarProps {
	product: IProduct;
	branches: Array<{ id: number; name?: string }>;
}

interface CollapsibleSectionProps {
	title: string;
	icon: string;
	iconColor: string;
	ringColor: string;
	bgColor: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	icon,
	iconColor,
	ringColor,
	bgColor,
	defaultOpen = true,
	children,
}) => {
	const [open, setOpen] = useState(defaultOpen);

	const toggle = useCallback(() => setOpen((prev) => !prev), []);

	return (
		<Card className='overflow-hidden border border-neutral-200 shadow-sm dark:border-neutral-700/80'>
			<button
				type='button'
				onClick={toggle}
				className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
				aria-expanded={open}
				aria-label={`${open ? 'Ocultar' : 'Mostrar'} ${title}`}>
				<div
					className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bgColor} ring-1 ${ringColor}`}>
					<Icon icon={icon} className={`h-4 w-4 ${iconColor}`} />
				</div>
				<span className='flex-1 text-sm font-bold text-neutral-900 dark:text-neutral-50'>
					{title}
				</span>
				<Icon
					icon='HeroChevronDown'
					className={`h-4 w-4 text-neutral-400 transition-transform duration-200 dark:text-neutral-500 ${open ? 'rotate-0' : '-rotate-90'}`}
				/>
			</button>
			{open && (
				<CardBody className='border-t border-neutral-100 pt-3 dark:border-neutral-700/60'>
					{children}
				</CardBody>
			)}
		</Card>
	);
};

export const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({
	product,
	branches,
}) => {
	const navigate = useNavigate();

	const handleNavigateToProduct = (productId: number) => {
		navigate(`/catalogos/productos/${productId}`);
	};

	const branchName =
		branches.find((branch) => branch.id === product.branch_id)?.name ??
		`Sucursal ${product.branch_id}`;

	const productTypeLabel =
		PRODUCT_TYPE_LABELS[product.product_type ?? ''] ?? product.product_type ?? 'Sin tipo';

	const priceFormatted = `$${product.price.toLocaleString('es-CL')}`;

	const childrenWithStock =
		product.children?.filter((child) => child.stock && child.stock > 0) ?? [];

	return (
		<div className='space-y-4'>
			{/* ═══════════ RESUMEN RÁPIDO ═══════════ */}
			<CollapsibleSection
				title='Resumen rápido'
				icon='HeroCog6Tooth'
				iconColor='text-blue-600 dark:text-blue-400'
				ringColor='ring-blue-500/25 dark:ring-blue-400/30'
				bgColor='bg-blue-500/15 dark:bg-blue-500/20'>
				<div className='space-y-2.5 text-sm'>
					<SidebarRow label='Sucursal' value={branchName} />
					<SidebarRow label='Tipo de producto' value={productTypeLabel} />

					<div className='flex items-center justify-between'>
						<span className='text-neutral-500 dark:text-neutral-400'>Serie</span>
						<Badge
							className='px-2'
							variant='solid'
							color={product.serial_tracking ? 'emerald' : 'zinc'}>
							{product.serial_tracking ? 'Con serie' : 'Sin serie'}
						</Badge>
					</div>

					<div className='flex items-center justify-between'>
						<span className='text-neutral-500 dark:text-neutral-400'>Precio</span>
						<span className='text-base font-bold text-neutral-900 dark:text-neutral-50'>
							{priceFormatted}
						</span>
					</div>

					{/* Categorías */}
					<div className='space-y-1.5 border-t border-neutral-100 pt-2.5 dark:border-neutral-700/60'>
						<p className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
							Categorías
						</p>
						<div className='flex flex-wrap gap-1.5'>
							{product.categories?.length ? (
								product.categories.map((category: IProductCategorySummary) => (
									<Badge
										className='px-2'
										key={category.id}
										variant='outline'
										color='blue'>
										{category.name}
									</Badge>
								))
							) : (
								<span className='text-xs italic text-neutral-400 dark:text-neutral-500'>
									Sin categorías
								</span>
							)}
						</div>
					</div>
				</div>
			</CollapsibleSection>

			{/* ═══════════ AUDITORÍA ═══════════ */}
			<CollapsibleSection
				title='Auditoría'
				icon='HeroClock'
				iconColor='text-amber-600 dark:text-amber-400'
				ringColor='ring-amber-500/25 dark:ring-amber-400/30'
				bgColor='bg-amber-500/15 dark:bg-amber-500/20'
				defaultOpen={false}>
				<div className='space-y-3 text-sm'>
					<div>
						<p className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
							Creado
						</p>
						<p className='mt-0.5 font-medium text-neutral-800 dark:text-neutral-100'>
							{new Date(product.created_at).toLocaleString('es-CL')}
						</p>
					</div>
					<div>
						<p className='text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500'>
							Actualizado
						</p>
						<p className='mt-0.5 font-medium text-neutral-800 dark:text-neutral-100'>
							{new Date(product.updated_at).toLocaleString('es-CL')}
						</p>
					</div>
				</div>
			</CollapsibleSection>

			{/* ═══════════ STOCK DISPONIBLE ═══════════ */}
			<CollapsibleSection
				title='Stock disponible'
				icon='HeroCubeTransparent'
				iconColor='text-emerald-600 dark:text-emerald-400'
				ringColor='ring-emerald-500/25 dark:ring-emerald-400/30'
				bgColor='bg-emerald-500/15 dark:bg-emerald-500/20'>
				<div className='space-y-2'>
					<p className='text-xs text-neutral-500 dark:text-neutral-400'>
						Stock basado en las categorías sincronizadas de este producto.
					</p>

					{childrenWithStock.length > 0 ? (
						<div className='space-y-1.5'>
							{childrenWithStock.map((child) => (
								<Tooltip
									text={`Ver detalles de ${child.name}`}
									key={child.id}
									placement='left'>
									<div
										className='group flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/20'
										onClick={() => handleNavigateToProduct(child.id)}
										role='button'
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												handleNavigateToProduct(child.id);
											}
										}}
										aria-label={`Ver producto ${child.name}, grado ${child.grade}, stock ${child.stock}`}>
										<div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-xs font-bold text-blue-700 ring-1 ring-blue-500/25 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-400/30'>
											{child.grade}
										</div>
										<div className='flex-1'>
											<span className='text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
												Stock: {child.stock}
											</span>
										</div>
										<Icon
											icon='HeroArrowTopRightOnSquare'
											className='h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-blue-500 dark:text-neutral-600 dark:group-hover:text-blue-400'
										/>
									</div>
								</Tooltip>
							))}
						</div>
					) : product.parent ? (
						<Tooltip text={`Ver detalles de ${product.parent.name}`} placement='left'>
							<div
								className='group flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/20'
								onClick={() => handleNavigateToProduct(product.parent!.id)}
								role='button'
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleNavigateToProduct(product.parent!.id);
									}
								}}
								aria-label={`Ver producto padre ${product.parent.name}`}>
								<span className='flex-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
									{product.parent.name}
								</span>
								<Icon
									icon='HeroArrowTopRightOnSquare'
									className='h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-blue-500 dark:text-neutral-600 dark:group-hover:text-blue-400'
								/>
							</div>
						</Tooltip>
					) : (
						<div className='rounded-lg border border-dashed border-neutral-300 p-3 text-center dark:border-neutral-600'>
							<p className='text-xs text-neutral-400 dark:text-neutral-500'>
								Sin stock disponible
							</p>
						</div>
					)}
				</div>
			</CollapsibleSection>
		</div>
	);
};

const SidebarRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
	<div className='flex items-center justify-between'>
		<span className='text-neutral-500 dark:text-neutral-400'>{label}</span>
		<span className='font-medium text-neutral-800 dark:text-neutral-100'>{value}</span>
	</div>
);
