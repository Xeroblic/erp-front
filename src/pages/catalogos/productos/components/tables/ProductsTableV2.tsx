import React, { useCallback, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import useCan from '@/hooks/useCan';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleProductStatus } from '@/store/slices/products/productsSlice';
import { useAttributesValidator } from '../../hooks/useAttributesValidator';
import REQUIRED_ATTRIBUTES_BY_TYPE from '../../constants/requiredAttributesByType';
import type { TColors } from '@/types/colors.type';
import type { IProduct, IProductChild, ProductListMeta } from '@/interface/product.interface';
import {
	summarizeProductSoftHolds,
	getEffectiveAvailableStock,
} from '@/components/helper/product.helper';
import { PRODUCT_TYPE_META } from '../../constants/products.constant';
import Tooltip from '@/components/ui/Tooltip';
import SoftHoldsBadge from '@/components/ui/SoftHoldsBadge';
import { getWooProductLinks } from '@/utils/wooProductMeta.util';

interface ProductsTableProps {
	products: IProduct[];
	meta: ProductListMeta;
	loading?: boolean;
	onView?: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
	subsidiaryId?: number | null;
	onRefresh?: () => Promise<void> | void;
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

const GRADE_BADGE_COLORS: Record<string, TColors> = {
	A: 'emerald',
	B: 'blue',
	C: 'amber',
	M: 'purple',
};

const formatPriceValue = (value?: number | string | null) => {
	if (value === null || value === undefined || value === '') return currencyFormatter.format(0);
	const parsed =
		typeof value === 'string'
			? Number.parseFloat(value) || 0
			: typeof value === 'number'
				? value
				: 0;
	return currencyFormatter.format(parsed);
};

const getGradeBadgeColor = (grade?: string | null): TColors => {
	if (!grade) return 'zinc';
	const normalized = grade.toUpperCase();
	return GRADE_BADGE_COLORS[normalized] ?? 'zinc';
};

const extractProductVariants = (product: IProduct): IProductChild[] => {
	if (!product) return [];
	const asRecord = (value: unknown): Record<string, unknown> | undefined => {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return undefined;
	};

	const productRecord = product as unknown as Record<string, unknown>;

	const tryResolve = (source?: unknown): IProductChild[] => {
		if (!source) return [];
		if (Array.isArray(source)) return source as IProductChild[];
		const record = asRecord(source);
		if (record && Array.isArray(record.data)) {
			return record.data as IProductChild[];
		}
		return [];
	};

	const direct = tryResolve(productRecord.children);
	if (direct.length) return direct;

	const fallbackSources = [
		productRecord.children_data,
		productRecord.variants,
		productRecord.variations,
	];

	for (const source of fallbackSources) {
		const resolved = tryResolve(source);
		if (resolved.length) return resolved;
	}

	return [];
};

const parseNumericValue = (value: number | string | null | undefined, fallback = 0) => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
};

const composeVariantProduct = (parent: IProduct, variant: IProductChild): IProduct => ({
	...parent,
	...variant,
	id: variant.id,
	parent_product_id: parent.id,
	sku: variant.sku ?? parent.sku,
	name: variant.name ?? parent.name,
	price: parseNumericValue(variant.price, parent.price ?? 0),
	offer_price:
		variant.offer_price !== undefined && variant.offer_price !== null
			? parseNumericValue(variant.offer_price, parent.offer_price ?? parent.price ?? 0)
			: (parent.offer_price ?? null),
	stock: variant.stock ?? parent.stock ?? 0,
	children: [],
});

const ProductsTableV2: React.FC<ProductsTableProps> = ({
	products,
	meta,
	loading = false,
	onView,
	onDelete,
	subsidiaryId,
	onRefresh,
}) => {
	const dispatch = useAppDispatch();
	const { isAdmin } = useCan();
	const isUpdating = useAppSelector((state) => state.products.updating);
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

	const toggleExpand = useCallback((productId: number) => {
		setExpandedRows((prev) => ({
			...prev,
			[productId]: !prev[productId],
		}));
	}, []);

	const handleToggleStatus = useCallback(
		async (product: IProduct) => {
			if (!subsidiaryId) {
				toast.error('No se pudo resolver la subsidiaria para cambiar el estado del producto');
				return;
			}

			try {
				await dispatch(
					toggleProductStatus({
						entityParam: 'subsidiaries',
						entityId: subsidiaryId,
						productId: product.id,
					}),
				).unwrap();
				await onRefresh?.();
				toast.success(
					product.is_active
						? 'Producto desactivado correctamente'
						: 'Producto activado correctamente',
				);
			} catch (error: unknown) {
				const message =
					typeof error === 'string' && error.trim().length > 0
						? error
						: 'No se pudo cambiar el estado del producto';
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, onRefresh],
	);

	const columns = useMemo<ColumnDef<IProduct>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => {
					const product = row.original;
					const typeMeta = product.product_type
						? PRODUCT_TYPE_META[product.product_type] || DEFAULT_TYPE_META
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

								<div className='mt-1 flex flex-wrap items-start gap-2'>
									<Badge
										variant='outline'
										color={typeMeta.badgeColor as TColors}
										className='flex-shrink-0 px-2'>
										{typeMeta.label}
									</Badge>
								</div>

								<div className='mt-1 flex items-center gap-2 text-xs text-neutral-500'>
									<span>SKU: {product.sku}</span>
									{product.commercial_sku && (
										<span className='text-neutral-400'>
											• {product.commercial_sku}
										</span>
									)}
								</div>

								{(() => {
									const softHolds = summarizeProductSoftHolds(product);
									return softHolds ? (
										<div className='mt-1.5'>
											<SoftHoldsBadge
												softHolds={softHolds}
												availableStock={getEffectiveAvailableStock(
													product.serial_tracking,
													product.stock,
													softHolds,
												)}
											/>
										</div>
									) : null;
								})()}
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
				id: 'woo',
				header: 'Woo',
				cell: ({ row }) => {
					const product = row.original;
					// Fuente única de verdad: el vínculo real en `marketplace_external_ids`
					// (lo mismo que lee el panel WooCommerce del detalle). NO se usa
					// `is_synced_with_woo` porque el pivote del backend puede quedar
					// desincronizado del mirror y mostrar "Publicado" cuando el panel dice
					// "No vinculado". Cada grado es independiente.
					const directStores = getWooProductLinks(product.marketplace_external_ids).length;
					const publishedChildren = (product.children ?? []).filter(
						(child) => getWooProductLinks(child.marketplace_external_ids).length > 0,
					);
					const hasDirectLink = directStores > 0;

					if (!hasDirectLink && publishedChildren.length === 0) {
						return (
							<Badge
								variant='outline'
								color='zinc'
								className='w-fit px-2'>
								No publicado
							</Badge>
						);
					}

					// Producto simple (sin variantes) publicado directamente.
					if (hasDirectLink && publishedChildren.length === 0) {
						return (
							<Tooltip
								text={
									directStores > 1
										? `Publicado en ${directStores} tiendas WooCommerce`
										: 'Publicado en WooCommerce'
								}>
								<Badge
									variant='solid'
									color='indigo'
									className='flex w-fit items-center gap-1 px-2'>
									<Icon icon='HeroShoppingBag' className='h-3 w-3' />
									{directStores > 1 ? `Publicado ×${directStores}` : 'Publicado'}
								</Badge>
							</Tooltip>
						);
					}

					// Con variantes: un pill por cada grado publicado.
					return (
						<div className='flex flex-wrap gap-1'>
							{hasDirectLink && (
								<Tooltip text='Producto base publicado en WooCommerce'>
									<Badge
										variant='solid'
										color='indigo'
										className='flex w-fit items-center gap-1 px-2'>
										<Icon icon='HeroShoppingBag' className='h-3 w-3' />
										Base
									</Badge>
								</Tooltip>
							)}
							{publishedChildren.map((child) => (
								<Tooltip
									key={child.id}
									text={`${child.name} publicado en WooCommerce`}>
									<Badge
										variant='solid'
										color='indigo'
										className='flex w-fit items-center gap-1 px-2'>
										<Icon icon='HeroShoppingBag' className='h-3 w-3' />
										{child.grade ? `Grado ${child.grade}` : 'Variante'}
									</Badge>
								</Tooltip>
							))}
						</div>
					);
				},
			},
			{
				id: 'brand',
				header: 'Marca',
				cell: ({ row }) => {
					const { brand } = row.original;
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
					});

					const status = product.product_status;

					// Archivado - prioridad máxima
					if (status === 'archived') {
						return (
							<div className='flex flex-col gap-1.5'>
								<div>
									<Badge color='zinc'>Archivado</Badge>
									<div className='mt-1 text-xs text-neutral-500'>
										Producto archivado
									</div>
								</div>
							</div>
						);
					}

					// Rechazado
					if (status === 'rejected') {
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

					// Validado/Publicado
					if (status === 'validated') {
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
								) : (
									<div>
										<Badge color='emerald'>Publicado</Badge>
										<div className='text-xs text-neutral-500'>
											Atributos completos
										</div>
									</div>
								)}
							</div>
						);
					}

					// Pendiente o cualquier otro estado
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
					const { categories } = row.original;
					return categories?.length ? (
						<div className='flex flex-col items-start gap-1'>
							<div className='flex flex-col gap-1'>
								{categories.slice(0, 3).map((category) => (
									<Badge
										key={category.id}
										variant='outline'
										color='blue'
										className='truncate px-2 text-xs'>
										{category.name}
									</Badge>
								))}
								{categories.length > 3 && (
									<Badge variant='outline' color='blue' className='text-xs'>
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
					const canQuickToggle = isAdmin && Boolean(subsidiaryId);
					return (
						<div className='flex items-center justify-end gap-2'>
							<PermissionGuard role={['admin', 'company-admin', 'subsidiary-admin', 'branch-admin']}>
								<Tooltip text={product.is_active ? 'Desactivar' : 'Activar'}>
									<Button
										variant='outline'
										size='sm'
										color={product.is_active ? 'amber' : 'emerald'}
										onClick={(event) => {
											event.stopPropagation();
											void handleToggleStatus(product);
										}}
										isLoading={isUpdating}
										isDisable={!canQuickToggle}>
											<Icon 
												color={product.is_active ? 'amber' : 'emerald'} 
												icon={product.is_active ? 'HeroPauseCircle' : 'HeroPlayCircle'} 
												className='text-2xl'/>
										{/* 9NZ20R3 */}
									</Button>
								</Tooltip>

							</PermissionGuard>
							{onView && (
								<Tooltip text='Ver detalle'>
									<Button
										variant='outline'
										size='sm'
										color='violet'
										onClick={(event) => {
											event.stopPropagation();
											onView(product);
										}}
										className='inline-flex'>
											<Icon icon='HeroEye' color={'violet'} className='text-2xl'/>
									</Button>
								</Tooltip>
							)}
							<Tooltip text='Eliminar'>
								<Button
									variant='outline'
									color='red'
									size='sm'
									onClick={(event) => {
										event.stopPropagation();
										onDelete(product);
									}}>
									<Icon icon='HeroTrash' color='red' className='text-2xl'/>
								</Button>
							</Tooltip>
						</div>
					);
				},
			},
		],
		[onView, onDelete, isAdmin, subsidiaryId, handleToggleStatus, isUpdating],
	);

	const table = useReactTable({
		data: products,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});
	const columnCount = Math.max(1, table.getVisibleFlatColumns().length);

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
									: table.getRowModel().rows.map((row) => {
											const product = row.original;
											const isExpanded = Boolean(expandedRows[product.id]);
											const childVariants = extractProductVariants(product);
											const hasVariants = childVariants.length > 0;

											const handleRowToggle = () => {
												if (!hasVariants) return;
												toggleExpand(product.id);
											};

											return (
												<React.Fragment key={row.id}>
													<tr
														className={`transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 ${
															hasVariants
																? 'cursor-pointer'
																: 'cursor-default'
														}`}
														onClick={handleRowToggle}>
														{row.getVisibleCells().map((cell) => (
															<td key={cell.id} className='px-6 py-4'>
																{flexRender(
																	cell.column.columnDef.cell,
																	cell.getContext(),
																)}
															</td>
														))}
													</tr>
													{isExpanded && (
														<tr className='bg-zinc-50/40 dark:bg-zinc-900/40'>
															<td
																colSpan={columnCount}
																className='px-6 pb-6 pt-0'>
																{(() => {
																	return (
																		<div className='mt-2 rounded-xl border border-dashed border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70'>
																			<div>
																				<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
																					Variantes por
																					grado
																				</p>
																				<p className='text-xs text-zinc-500'>
																					{childVariants.length
																						? `Este producto tiene ${childVariants.length} variantes registradas.`
																						: 'No se encontraron variantes para este producto.'}
																				</p>
																			</div>

																			{childVariants.length ? (
																				<div className='mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700'>
																					<table className='w-full text-xs'>
																						<thead className='bg-zinc-50 dark:bg-zinc-900/40'>
																							<tr className='text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500'>
																								<th className='px-3 py-2'>
																									Grado
																								</th>
																								<th className='px-3 py-2'>
																									Producto
																								</th>
																								<th className='px-3 py-2'>
																									Precio
																								</th>
																								<th className='px-3 py-2'>
																									Stock
																								</th>
																								<th className='px-3 py-2 text-right'>
																									Acciones
																								</th>
																							</tr>
																						</thead>
																						<tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
																							{childVariants.map(
																								(
																									child,
																								) => (
																									<tr
																										key={
																											child.id
																										}
																										className='bg-white/80 dark:bg-zinc-900/60'>
																										<td className='px-3 py-3 align-top'>
																											{child.grade ? (
																												<Badge
																													variant='outline'
																													color={getGradeBadgeColor(
																														child.grade,
																													)}>
																													Grado{' '}
																													{
																														child.grade
																													}
																												</Badge>
																											) : (
																												<span className='text-zinc-400'>
																													-
																												</span>
																											)}
																										</td>
																										<td className='px-3 py-3 align-top'>
																											<div className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
																												{
																													child.name
																												}
																											</div>
																											<div className='text-[11px] text-zinc-500'>
																												SKU:{' '}
																												{
																													child.sku
																												}
																											</div>
																												{getWooProductLinks(child.marketplace_external_ids).length > 0 && (
																													<Tooltip text='Publicado en WooCommerce'>
																														<Badge
																															variant='solid'
																															color='indigo'
																															className='mt-1 flex w-fit items-center gap-1 px-1.5 py-0.5 text-[10px]'>
																															<Icon icon='HeroShoppingBag' className='h-2.5 w-2.5' />
																															Woo
																														</Badge>
																													</Tooltip>
																												)}
																										</td>
																										<td className='px-3 py-3 align-top text-sm'>
																											<div className='font-semibold text-zinc-900 dark:text-zinc-100'>
																												{formatPriceValue(
																													child.price,
																												)}
																											</div>
																											{child.offer_price && (
																												<div className='text-[11px] font-medium text-emerald-600'>
																													Oferta:{' '}
																													{formatPriceValue(
																														child.offer_price,
																													)}
																												</div>
																											)}
																										</td>
																										<td className='px-3 py-3 align-top'>
																											<div className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
																												{child.stock ??
																													0}
																											</div>
																											{child.stock_by_status && (
																												<div className='mt-1 grid grid-cols-2 gap-1 text-[11px] text-zinc-500'>
																													<span>
																														Disp:{' '}
																														<strong className='text-zinc-700 dark:text-zinc-200'>
																															{child
																																.stock_by_status
																																.available ??
																																0}
																														</strong>
																													</span>
																													<span>
																														Res:{' '}
																														<strong className='text-zinc-700 dark:text-zinc-200'>
																															{child
																																.stock_by_status
																																.reserved ??
																																0}
																														</strong>
																													</span>
																													<span>
																														Cot:{' '}
																														<strong className='text-zinc-700 dark:text-zinc-200'>
																															{child
																																.stock_by_status
																																.in_quotation ??
																																0}
																														</strong>
																													</span>
																													<span>
																														Vend:{' '}
																														<strong className='text-zinc-700 dark:text-zinc-200'>
																															{child
																																.stock_by_status
																																.sold ??
																																0}
																														</strong>
																													</span>
																												</div>
																											)}
																											{(child
																												.soft_holds
																												?.quantity ??
																												0) >
																											0 ? (
																												<div className='mt-1.5'>
																													<SoftHoldsBadge
																														softHolds={
																															child.soft_holds
																														}
																														availableStock={
																															child.stock
																														}
																													/>
																												</div>
																											) : (
																												<div className='mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500'>
																													Apart:{' '}
																													<strong className='text-zinc-500 dark:text-zinc-300'>
																														0
																													</strong>
																												</div>
																											)}
																										</td>
																										<td className='px-3 py-3 text-right align-top'>
																											{onView && (
																												<Button
																													size='xs'
																													variant='outline'
																													icon='HeroArrowTopRightOnSquare'
																													onClick={() =>
																														onView(
																															composeVariantProduct(
																																product,
																																child,
																															),
																														)
																													}>
																													Ver
																													grado
																												</Button>
																											)}
																										</td>
																									</tr>
																								),
																							)}
																						</tbody>
																					</table>
																				</div>
																			) : (
																				<div className='mt-4 rounded-lg border border-dashed border-zinc-200 bg-white/80 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50'>
																					No hay unidades
																					clasificadas por
																					grado todavía.
																				</div>
																			)}
																		</div>
																	);
																})()}
															</td>
														</tr>
													)}
												</React.Fragment>
											);
										})}
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
