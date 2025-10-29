import React, { useMemo } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type ColumnDef,
} from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type {
	IProduct,
	ProductInventoryCriticalProduct,
	ProductInventorySummary,
} from '@/interface/product.interface';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY } from '@/constants/product.constant';

interface InventoryTabProps {
	products: IProduct[];
	summary?: ProductInventorySummary;
	criticalProducts?: ProductInventoryCriticalProduct[];
	loading?: boolean;
	branchName?: string;
	lowStockThreshold?: number;
	onShowLowStock?: () => void;
	onViewProduct?: (product: IProduct) => void;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const formatNumber = (value: number): string =>
	Number(value ?? 0).toLocaleString('es-CL', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

const getFriendlyDate = (value?: string | null): string => {
	if (!value) return 'Sin actualización';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Sin actualización';
	return date.toLocaleDateString('es-CL', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
};

type CriticalItemRow = {
	product?: IProduct | null;
	id: number;
	name: string;
	sku: string;
	brand: string;
	stock?: number | null;
	status: 'low' | 'out';
	updatedAt?: string | null;
};

const InventoryTab: React.FC<InventoryTabProps> = ({
	products = [],
	summary = PRODUCT_EMPTY_INVENTORY_SUMMARY,
	criticalProducts = [],
	loading = false,
	branchName,
	lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
	onShowLowStock,
	onViewProduct,
}) => {
	const localInventory = useMemo(() => {
		if (!products.length) {
			return {
				totalStock: 0,
				productCount: 0,
				serialTracked: 0,
				lowStockItems: [] as IProduct[],
				outOfStockItems: [] as IProduct[],
				averageStock: 0,
			};
		}

		let totalStock = 0;
		let serialTracked = 0;
		const lowStockItems: IProduct[] = [];
		const outOfStockItems: IProduct[] = [];

		products.forEach((product) => {
			const stock = Number(product.stock ?? 0);
			totalStock += stock > 0 ? stock : 0;
			if (product.serial_tracking) serialTracked += 1;

			if (stock <= 0) {
				outOfStockItems.push(product);
				return;
			}

			if (stock <= lowStockThreshold) {
				lowStockItems.push(product);
			}
		});

		const productCount = products.length;
		const averageStock = productCount ? totalStock / productCount : 0;

		return {
			totalStock,
			productCount,
			serialTracked,
			lowStockItems,
			outOfStockItems,
			averageStock,
		};
	}, [products, lowStockThreshold]);

	const hasServerSummary = summary.branchId !== null;

	const summaryData = useMemo<ProductInventorySummary>(() => {
		if (hasServerSummary) {
			return summary;
		}

		return {
			...summary,
			stockTotal: localInventory.totalStock,
			stockAverage: localInventory.averageStock,
			lowStockCount: localInventory.lowStockItems.length,
			outOfStock: localInventory.outOfStockItems.length,
			withStockAvailable: Math.max(
				0,
				localInventory.productCount - localInventory.outOfStockItems.length,
			),
			syncedProducts: localInventory.productCount,
			serialTrackingCount: localInventory.serialTracked,
			criticalThreshold: lowStockThreshold,
		};
	}, [hasServerSummary, summary, localInventory, lowStockThreshold]);

	const productsById = useMemo(() => {
		const map = new Map<number, IProduct>();
		products.forEach((product) => {
			map.set(product.id, product);
		});
		return map;
	}, [products]);

	const hasCriticalFromServer = hasServerSummary && criticalProducts.length > 0;

	const criticalItems = useMemo<CriticalItemRow[]>(
		() => {
		if (hasCriticalFromServer) {
			return criticalProducts
				.map((item) => {
					const product = productsById.get(item.id) ?? null;
					const stockSource = product?.stock ?? item.stock ?? null;
					const numericStock =
						typeof stockSource === 'number' ? Number(stockSource) : null;
					const status: 'low' | 'out' =
						numericStock !== null && numericStock <= 0 ? 'out' : 'low';

					return {
						product,
						id: item.id,
						name: item.name,
						sku: item.sku,
						brand: product?.brand?.name ?? item.brand_name ?? 'Sin marca',
						stock: numericStock,
						status,
						updatedAt: product?.updated_at ?? null,
					};
				})
				.sort((a, b) => {
					const stockA = typeof a.stock === 'number' ? a.stock : Number.MAX_SAFE_INTEGER;
					const stockB = typeof b.stock === 'number' ? b.stock : Number.MAX_SAFE_INTEGER;
					if (stockA !== stockB) return stockA - stockB;
					return a.name.localeCompare(b.name);
				})
				.slice(0, 8);
		}

		const merged = [...localInventory.lowStockItems, ...localInventory.outOfStockItems];
		return merged
			.map((product) => ({
				product,
				id: product.id,
				name: product.name,
				sku: product.sku,
				brand: product.brand?.name ?? 'Sin marca',
				stock: Number(product.stock ?? 0),
				status: (Number(product.stock ?? 0) <= 0 ? 'out' : 'low') as 'out' | 'low',
				updatedAt: product.updated_at,
			}))
			.sort((a, b) => {
				const stockDiff = (a.stock ?? 0) - (b.stock ?? 0);
				if (stockDiff !== 0) return stockDiff;
				const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
				const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
				return bDate - aDate;
			})
			.slice(0, 8);
	}, [hasCriticalFromServer, criticalProducts, productsById, localInventory]);

	const columns = useMemo<ColumnDef<CriticalItemRow>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div className='space-y-1'>
							<p className='font-medium text-neutral-800 dark:text-neutral-100'>{item.name}</p>
							<p className='text-xs text-neutral-500 dark:text-neutral-400'>
								SKU: {item.sku} - Marca: {item.brand}
							</p>
							<p className='text-xs text-neutral-400 dark:text-neutral-500'>
								Actualizado: {getFriendlyDate(item.updatedAt)}
							</p>
						</div>
					);
				},
			},
			{
				id: 'status',
				header: 'Estado',
				// size: 140,
				cell: ({ row }) => {
					const { status, stock } = row.original;
					const label =
						status === 'out'
							? 'Sin stock'
							: typeof stock === 'number'
								? `Stock bajo (${formatNumber(stock)})`
								: 'Stock bajo';
					return (
						<Badge color={status === 'out' ? 'red' : 'amber'} variant='outline'>
							{label}
						</Badge>
					);
				},
			},
			{
 				id: 'actions',
 				header: 'Acciones',
 				// size: 160,
 				cell: ({ row }) => {
 					const { product } = row.original;
					const disabled = !onViewProduct || !product;
 					return (
 						<Button
 							size='sm'
 							variant='outline'
 							icon='HeroEye'
							isDisable={disabled}
 							onClick={() => {
								if (!disabled && onViewProduct && product) onViewProduct(product);
 							}}>
 							Ver producto
 						</Button>
 					);
 				},
			},
		],
		[onViewProduct],
	);

	const table = useReactTable({
		data: criticalItems,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const summaryCards = [
		{
			id: 'total',
			icon: 'HeroCubeTransparent',
			label: 'Stock total',
			value: summaryData.stockTotal,
			description: `${summaryData.syncedProducts} productos sincronizados`,
			valueClass: 'text-emerald-600 dark:text-emerald-300',
		},
		{
			id: 'average',
			icon: 'HeroChartBarSquare',
			label: 'Stock promedio',
			value: Math.round(summaryData.stockAverage),
			description: `${summaryData.serialTrackingCount} con tracking de serie`,
			valueClass: 'text-indigo-600 dark:text-indigo-300',
		},
		{
			id: 'low',
			icon: 'HeroExclamationTriangle',
			label: `Stock bajo (<= ${summaryData.criticalThreshold})`,
			value: summaryData.lowStockCount,
			description:
				summaryData.lowStockCount > 0 ? 'Revisa los productos en alerta' : 'Sin alertas por ahora',
			valueClass: 'text-amber-600 dark:text-amber-300',
		},
		{
			id: 'out',
			icon: 'HeroXCircle',
			label: 'Productos agotados',
			value: summaryData.outOfStock,
			description:
				summaryData.outOfStock > 0 ? 'Necesitan reposición' : 'Todos con stock disponible',
			valueClass: 'text-rose-600 dark:text-rose-300',
		},
	];

	const summaryStyles: Record<string, { border: string; iconBg: string; iconColor: string }> = {
		total: {
			border: 'border-emerald-200/80 dark:border-emerald-500/40',
			iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
			iconColor: 'text-emerald-600 dark:text-emerald-300',
		},
		average: {
			border: 'border-indigo-200/80 dark:border-indigo-500/40',
			iconBg: 'bg-indigo-100 dark:bg-indigo-500/10',
			iconColor: 'text-indigo-600 dark:text-indigo-300',
		},
		low: {
			border: 'border-amber-200/80 dark:border-amber-500/40',
			iconBg: 'bg-amber-100 dark:bg-amber-500/10',
			iconColor: 'text-amber-600 dark:text-amber-300',
		},
		out: {
			border: 'border-rose-200/80 dark:border-rose-500/40',
			iconBg: 'bg-rose-100 dark:bg-rose-500/10',
			iconColor: 'text-rose-600 dark:text-rose-300',
		},
		default: {
			border: 'border-neutral-200 dark:border-neutral-700',
			iconBg: 'bg-neutral-100 dark:bg-neutral-800',
			iconColor: 'text-neutral-500 dark:text-neutral-300',
		},
	};

	const branchLabel = branchName ?? 'Todas las sucursales disponibles';
	const handleLowStockClick = () => {
		if (criticalItems.length === 0) return;
		onShowLowStock?.();
	};

	return (
		<div className='space-y-6'>
			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader>
					<CardHeaderChild className='flex flex-col gap-1'>
						<CardTitle className='flex items-center gap-2'>
							<Icon icon='HeroCubeTransparent' className='h-5 w-5 text-emerald-600 dark:text-emerald-300' />
							Gestión de Inventario
						</CardTitle>
						<p className='text-sm text-neutral-500'>
							Resumen basado en productos sincronizados para la sucursal seleccionada.
						</p>
					</CardHeaderChild>
					<CardHeaderChild className='mt-3 flex justify-start sm:mt-0 sm:justify-end'>
						<Badge variant='outline' color='blue' className='whitespace-nowrap'>
							{branchLabel}
						</Badge>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
						{summaryCards.map((card) => {
							const style = summaryStyles[card.id] ?? summaryStyles.default;
							return (
								<Card
									key={card.id}
									className={`h-full overflow-hidden rounded-xl border ${style.border} bg-white shadow-sm dark:bg-neutral-900/60`}>
									<CardBody className='flex h-full flex-col justify-between gap-4 !p-5'>
										<div className='flex items-start justify-between gap-3'>
											<div>
												<p className='text-sm text-neutral-500'>{card.label}</p>
												{loading ? (
													<div className='mt-3 h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800' />
												) : (
													<>
														<p className={`text-2xl font-semibold ${card.valueClass}`}>
															{formatNumber(card.value)}
														</p>
														{card.description && (
															<p className='mt-1 text-xs text-neutral-500'>{card.description}</p>
														)}
													</>
												)}
											</div>
											<div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}>
												<Icon icon={card.icon as any} className={`h-5 w-5 ${style.iconColor}`} />
											</div>
										</div>
									</CardBody>
								</Card>
							);
						})}
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700'>
						<p className='text-xs text-neutral-500'>
							Inventario total: {formatNumber(summaryData.stockTotal)} unidades en {summaryData.syncedProducts} productos.
						</p>
						<div className='flex flex-wrap gap-2'>
							<Button variant='outline' icon='HeroArrowDownTray' size='sm'>
								Importar inventario
							</Button>
							<Button variant='outline' icon='HeroArrowUpTray' size='sm'>
								Exportar inventario
							</Button>
							<Button
								size='sm'
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								onClick={handleLowStockClick}
								isDisable={
									!onShowLowStock ||
									(criticalItems.length === 0)
								}>
								Ver productos críticos
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Productos con stock crítico</CardTitle>
					</CardHeaderChild>
					{!loading ? (
						<CardHeaderChild>
							<Badge variant='outline' color='red'>
								{criticalItems.length} producto{criticalItems.length === 1 ? '' : 's'}
							</Badge>
						</CardHeaderChild>
					) : null}
				</CardHeader>
				<CardBody>
					{loading ? (
						<div className='space-y-3'>
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={index}
									className='flex gap-3 rounded border border-dashed border-neutral-200 p-3 dark:border-neutral-700'>
									<div className='h-12 flex-1 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800' />
									<div className='h-8 w-28 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800' />
								</div>
							))}
						</div>
					) : criticalItems.length === 0 ? (
						<div className='rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700'>
							No hay productos con alertas de stock para esta sucursal.
						</div>
					) : (
						<div className='overflow-hidden rounded-lg border border-dashed border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900/40'>
							<table className='min-w-full divide-y divide-neutral-200 dark:divide-neutral-800'>
								<thead className='bg-neutral-50 dark:bg-neutral-900/60'>
									{table.getHeaderGroups().map((headerGroup) => (
										<tr key={headerGroup.id}>
											{headerGroup.headers.map((header) => (
												<th
													key={header.id}
													className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
												</th>
											))}
										</tr>
									))}
								</thead>
								<tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/60'>
									{table.getRowModel().rows.map((row) => (
										<tr key={row.id} className='hover:bg-neutral-100 dark:hover:bg-neutral-900/40'>
											{row.getVisibleCells().map((cell) => (
												<td key={cell.id} className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default InventoryTab;



