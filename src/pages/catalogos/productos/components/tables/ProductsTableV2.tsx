import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAttributesValidator } from '../../hooks/useAttributesValidator';
import REQUIRED_ATTRIBUTES_BY_TYPE from '../../constants/requiredAttributesByType';
import type { TColors } from '@/types/colors.type';
import type { IProduct, ProductListMeta } from '@/interface/product.interface';
import { PRODUCT_TYPE_META } from '../../constants/products.constant';

interface ProductsTableProps {
	products: IProduct[];
	meta: ProductListMeta;
	loading?: boolean;
	onView?: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const DEFAULT_TYPE_META = {
	label: 'Sin tipo',
	icon: 'HeroCube' as const,
	badgeColor: 'zinc' as const,
};

const ProductsTableV2: React.FC<ProductsTableProps> = ({
	products,
	meta,
	loading = false,
	onView,
	onDelete,
}) => {
	const columns = useMemo<ColumnDef<IProduct>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => {
					const product = row.original;
					const typeMeta = product.product_type
						? PRODUCT_TYPE_META[
								product.product_type as keyof typeof PRODUCT_TYPE_META
							] || DEFAULT_TYPE_META
						: DEFAULT_TYPE_META;

					return (
						<div className='flex items-start gap-3'>
							<div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
								{product.image?.url ? (
									<img
										src={product.image.url}
										alt={product.name}
										className='h-full w-full object-cover'
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.style.display = 'none';
											if (target.nextElementSibling) {
												(
													target.nextElementSibling as HTMLElement
												).style.display = 'flex';
											}
										}}
									/>
								) : null}
								<div
									className='flex h-full w-full items-center justify-center'
									style={{ display: product.image?.url ? 'none' : 'flex' }}>
									<Icon icon={typeMeta.icon} className='h-6 w-6 text-zinc-400' />
								</div>
							</div>

							{/* Info del producto */}
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<span className='truncate font-medium'>{product.name}</span>
								</div>

								<div className='mt-1 flex items-start gap-2'>
									<Badge
										variant='outline'
										color={typeMeta.badgeColor as TColors}
										className='flex-shrink-0'>
										{typeMeta.label}
									</Badge>
								</div>

								<div className='mt-1 flex items-center gap-2 text-xs text-neutral-500'>
									<span>SKU: {product.sku}</span>
									{product.commercial_sku && (
										<span className='text-neutral-400'>• {product.commercial_sku}</span>
									)}
								</div>
							</div>
						</div>
					);
				},
			},
			{
				id: 'price',
				header: 'Precio',
				cell: ({ row }) => {
					const product = row.original;
					const hasOffer =
						product.offer_price !== null && product.offer_price !== undefined;

					return (
						<div className='space-y-1'>
							<div
								className={`font-semibold ${hasOffer ? 'text-sm line-through opacity-60' : ''}`}>
								{currencyFormatter.format(product.price)}
							</div>
							{hasOffer && product.offer_price && (
								<div className='text-base font-bold text-emerald-600 dark:text-emerald-400'>
									{currencyFormatter.format(product.offer_price)}
								</div>
							)}
							{product.cost !== null && product.cost !== undefined && (
								<div className='text-xs text-neutral-500'>
									Costo: {currencyFormatter.format(product.cost)}
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: 'brand',
				header: 'Marca',
				cell: ({ row }) => {
					const brand = row.original.brand;
					return brand ? (
						<div className='flex items-center gap-2 text-sm'>
							<Icon icon='HeroTag' className='h-4 w-4 text-neutral-400' />
							<span>{brand.name}</span>
						</div>
					) : (
						<span className='text-xs text-neutral-400'>Sin marca</span>
					);
				},
			},
			{
				id: 'status',
				header: 'Estado',
				cell: ({ row }) => {
					const product = row.original;
					return (
						<div className='flex flex-col gap-1.5'>
							<Badge color={product.is_active ? 'emerald' : 'zinc'}>
								{product.is_active ? 'Activo' : 'Inactivo'}
							</Badge>
							{product.serial_tracking && (
								<span className='inline-flex items-center gap-1 text-xs text-neutral-500'>
									<Icon
										icon='HeroClipboardDocumentCheck'
										className='h-3.5 w-3.5'
									/>
									Seguimiento serie
								</span>
							)}
							{/* Garantía: si es 0 o null mostrar "Sin garantía" en rojo */}
							{product.warranty_months && product.warranty_months > 0 ? (
								<span className='inline-flex items-center gap-1 text-xs text-neutral-500'>
									<Icon icon='HeroShieldCheck' className='h-3.5 w-3.5' />
									{product.warranty_months} meses
								</span>
							) : (
								<span className='inline-flex items-center gap-1 text-xs font-medium text-red-500'>
									<Icon
										icon='HeroShieldCheck'
										className='h-3.5 w-3.5 text-red-400'
									/>
									Sin garantía
								</span>
							)}
						</div>
					);
				},
			},
			{
				id: 'publication',
				header: 'Estado publicación',
				cell: ({ row }) => {
					const product = row.original;
					// use hook to validate attributes (frontend-only). No new attribute defs created.
					const requiredForType =
						REQUIRED_ATTRIBUTES_BY_TYPE[product.product_type ?? ''] ?? undefined;
					const {
						ok: attributesComplete,
						missingCount,
						missingLabels,
					} = useAttributesValidator(product.product_type, product.attributes_json, {
						requiredPaths: requiredForType,
						treatEmptyStringAsMissing: true,
					}) as any;

					const isPublished = product.product_status === 'validated';
					const isRejected = product.product_status === 'rejected';

					if (isRejected) {
						return (
							<div className='flex flex-col gap-1.5'>
								<div>
									<Badge color='red'>Rechazado</Badge>
									{!attributesComplete ? (
										<div className='mt-1 text-xs text-neutral-500'>
											{missingCount} atributos incompletos
										</div>
									) : (
										<div className='text-xs text-neutral-500'>
											Revisar observaciones
										</div>
									)}
								</div>
							</div>
						);
					}

					return (
						<div className='flex flex-col gap-1.5'>
							{!attributesComplete ? (
								<div>
									<Badge color='amber'>En revisión</Badge>
									<div className='mt-1 text-xs text-neutral-500'>
										{missingCount} atributos incompletos
										{Array.isArray(missingLabels) &&
											missingLabels.length > 0 && (
												<div
													className='mt-1 text-xs text-neutral-400'
													title={missingLabels.join(', ')}>
													Ver campos faltantes
												</div>
											)}
									</div>
								</div>
							) : isPublished ? (
								<div>
									<Badge color='emerald'>Publicado</Badge>
									<div className='text-xs text-neutral-500'>
										Atributos completos
									</div>
								</div>
							) : (
								<div>
									<Badge color='amber'>Pendiente</Badge>
									<div className='text-xs text-neutral-500'>
										Atributos completos
									</div>
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: 'categories',
				header: 'Categorías',
				cell: ({ row }) => {
					const categories = row.original.categories;
					return categories?.length ? (
						<div className='flex flex-col items-start gap-1'>
							<div className='flex flex-col gap-1'>
								{categories.slice(0, 3).map((category) => (
									<Badge
										key={category.id}
										variant='outline'
										color='blue'
										className='text-xs truncate'
										>
										{category.name}
									</Badge>
								))}
								{categories.length > 3 && (
									<Badge
										variant='outline'
										color='blue'
										className='text-xs'>
										+{categories.length - 3}
									</Badge>
								)}
							</div>
						</div>
					) : (
						<span className='text-xs text-neutral-400'>Sin categorías</span>
					);
				},
			},
			{
				id: 'actions',
				header: () => <div className='text-right'>Acciones</div>,
				cell: ({ row }) => {
					const product = row.original;
					return (
						<div className='flex items-center justify-end gap-2'>
							{onView && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => onView(product)}
									icon='HeroEye'
									className='hidden lg:inline-flex'>
									Detalle
								</Button>
							)}
							<Button
								variant='outline'
								color='red'
								size='sm'
								onClick={() => onDelete(product)}
								icon='HeroTrash'
							/>
						</div>
					);
				},
			},
		],
		[onView, onDelete],
	);

	const table = useReactTable({
		data: products,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const renderSkeleton = () => (
		<>
			{Array.from({ length: 3 }).map((_, index) => (
				<tr key={index}>
					<td colSpan={7} className='px-6 py-4'>
						<div className='flex items-center gap-3'>
							<div className='h-12 w-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700' />
							<div className='flex-1 space-y-2'>
								<div className='h-4 w-2/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
								<div className='h-3 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
							</div>
						</div>
					</td>
				</tr>
			))}
		</>
	);

	const renderEmpty = () => (
		<tr>
			<td colSpan={7} className='px-6 py-12'>
				<div className='flex flex-col items-center justify-center gap-3 text-center'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroInboxStack' className='h-8 w-8 text-zinc-400' />
					</div>
					<div>
						<p className='font-medium text-zinc-900 dark:text-zinc-100'>
							No se encontraron productos
						</p>
						<p className='text-sm text-zinc-500'>
							Intenta ajustar los filtros de búsqueda
						</p>
					</div>
				</div>
			</td>
		</tr>
	);

	return (
		<Card>
			<CardBody className='p-0'>
				<div className='overflow-x-auto'>
					<table className='w-full text-sm'>
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr
									key={headerGroup.id}
									className='border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50'>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className='px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
							{loading
								? renderSkeleton()
								: products.length === 0
									? renderEmpty()
									: table.getRowModel().rows.map((row) => (
											<tr
												key={row.id}
												className='transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'>
												{row.getVisibleCells().map((cell) => (
													<td key={cell.id} className='px-6 py-4'>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</td>
												))}
											</tr>
										))}
						</tbody>
					</table>
				</div>

				<div className='flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800'>
					<div className='text-xs text-zinc-500'>
						Mostrando{' '}
						<span className='font-medium text-zinc-700 dark:text-zinc-300'>
							{products.length}
						</span>{' '}
						de{' '}
						<span className='font-medium text-zinc-700 dark:text-zinc-300'>
							{meta.total}
						</span>{' '}
						productos
					</div>
					<div className='text-xs text-zinc-500'>
						Página{' '}
						<span className='font-medium text-zinc-700 dark:text-zinc-300'>
							{meta.current_page}
						</span>{' '}
						de{' '}
						<span className='font-medium text-zinc-700 dark:text-zinc-300'>
							{meta.last_page}
						</span>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ProductsTableV2;
