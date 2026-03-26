import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
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
	stock: number;
	status: 'low' | 'out';
	updatedAt?: string | null;
};

// ─── Sección: Barra de distribución de seriales ────────────────────────────
interface SerialSegment {
	key: string;
	label: string;
	value: number;
	color: string;
	bgClass: string;
	textClass: string;
	iconBgClass: string;
	icon: string;
}

const SerialsDistributionBar: React.FC<{ segments: SerialSegment[]; total: number }> = ({
	segments,
	total,
}) => {
	if (total <= 0) return null;
	return (
		<div className='flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800'>
			{segments.map((seg) => {
				const pct = (seg.value / total) * 100;
				if (pct <= 0) return null;
				return (
					<div
						key={seg.key}
						className={`${seg.color} transition-all duration-500 ease-out`}
						style={{ width: `${pct}%` }}
						title={`${seg.label}: ${formatNumber(seg.value)} (${pct.toFixed(1)}%)`}
					/>
				);
			})}
		</div>
	);
};

// ─── Componente principal ──────────────────────────────────────────────────
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
	const [criticalSearch, setCriticalSearch] = useState('');
	const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);

	// ── Cálculo local como fallback ──────────────────────────────────────
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
			productsTotal: localInventory.productCount,
			totalChildrenProducts: 0,
			productsTotalAll: localInventory.productCount,
			withoutSerialTracking: localInventory.productCount - localInventory.serialTracked,
			stockWithoutSerials: 0,
			serialsAvailable: 0,
			serialsOnHold: 0,
			serialsReserved: 0,
			serialsInQuotation: 0,
			serialsSold: 0,
			serialsTotalApproved: 0,
			criticalThreshold: lowStockThreshold,
		};
	}, [hasServerSummary, summary, localInventory, lowStockThreshold]);

	// ── Mapeo de productos por ID ────────────────────────────────────────
	const productsById = useMemo(() => {
		const map = new Map<number, IProduct>();
		products.forEach((product) => {
			map.set(product.id, product);
		});
		return map;
	}, [products]);

	const hasCriticalFromServer = hasServerSummary && criticalProducts.length > 0;

	const criticalItems = useMemo<CriticalItemRow[]>(() => {
		let items: CriticalItemRow[];

		if (hasCriticalFromServer) {
			items = criticalProducts
				.map((item) => {
					const product = productsById.get(item.id) ?? null;
					const stockSource = product?.stock ?? item.stock ?? 0;
					const numericStock = typeof stockSource === 'number' ? Number(stockSource) : 0;
					const status: 'low' | 'out' = numericStock <= 0 ? 'out' : 'low';

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
					const stockA =
						typeof a.stock === 'number' ? a.stock : Number.MAX_SAFE_INTEGER;
					const stockB =
						typeof b.stock === 'number' ? b.stock : Number.MAX_SAFE_INTEGER;
					if (stockA !== stockB) return stockA - stockB;
					return a.name.localeCompare(b.name);
				});
		} else {
			const merged = [...localInventory.lowStockItems, ...localInventory.outOfStockItems];
			items = merged
				.map((product) => {
					const stockValue = Number(product.stock ?? 0);
					return {
						product,
						id: product.id,
						name: product.name,
						sku: product.sku,
						brand: product.brand?.name ?? 'Sin marca',
						stock: stockValue,
						status: stockValue <= 0 ? ('out' as const) : ('low' as const),
						updatedAt: product.updated_at,
					};
				})
				.sort((a, b) => {
					const stockDiff = (a.stock ?? 0) - (b.stock ?? 0);
					if (stockDiff !== 0) return stockDiff;
					const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
					const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
					return bDate - aDate;
				});
		}

		// Aplicar filtros locales
		let filtered = items;
		if (showOnlyOutOfStock) {
			filtered = filtered.filter((item) => item.status === 'out');
		}
		if (criticalSearch.trim()) {
			const query = criticalSearch.toLowerCase().trim();
			filtered = filtered.filter(
				(item) =>
					item.name.toLowerCase().includes(query) ||
					item.sku.toLowerCase().includes(query) ||
					item.brand.toLowerCase().includes(query),
			);
		}

		return filtered.slice(0, 10);
	}, [
		hasCriticalFromServer,
		criticalProducts,
		productsById,
		localInventory,
		showOnlyOutOfStock,
		criticalSearch,
	]);

	// ── Columnas de la tabla ─────────────────────────────────────────────
	const columns = useMemo<ColumnDef<CriticalItemRow>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div className='space-y-1'>
							<p className='font-medium text-neutral-800 dark:text-neutral-100'>
								{item.name}
							</p>
							<p className='text-xs text-neutral-500 dark:text-neutral-400'>
								SKU: {item.sku} · Marca: {item.brand}
							</p>
							<p className='text-xs text-neutral-400 dark:text-neutral-500'>
								Actualizado: {getFriendlyDate(item.updatedAt)}
							</p>
						</div>
					);
				},
			},
			{
				id: 'stock',
				header: 'Stock',
				cell: ({ row }) => {
					const { stock } = row.original;
					return (
						<span className='text-sm font-semibold text-neutral-700 dark:text-neutral-200'>
							{formatNumber(stock)}
						</span>
					);
				},
			},
			{
				id: 'status',
				header: 'Estado',
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

	// ── Cards de resumen ─────────────────────────────────────────────────
	const summaryCards = [
		{
			id: 'total',
			icon: 'HeroCubeTransparent',
			label: 'Stock total',
			value: summaryData.stockTotal,
			description: `${formatNumber(summaryData.productsTotal)} padres · ${formatNumber(summaryData.totalChildrenProducts)} variantes`,
			valueClass: 'text-emerald-600 dark:text-emerald-300',
		},
		{
			id: 'average',
			icon: 'HeroChartBarSquare',
			label: 'Stock promedio',
			value: Math.round(summaryData.stockAverage),
			description: `${formatNumber(summaryData.serialTrackingCount)} con tracking · ${formatNumber(summaryData.withoutSerialTracking)} sin tracking`,
			valueClass: 'text-indigo-600 dark:text-indigo-300',
		},
		{
			id: 'low',
			icon: 'HeroExclamationTriangle',
			label: `Stock bajo (≤ ${summaryData.criticalThreshold})`,
			value: summaryData.lowStockCount,
			description:
				summaryData.lowStockCount > 0
					? `${formatNumber(summaryData.withStockAvailable)} con disponibilidad`
					: 'Sin alertas por ahora',
			valueClass: 'text-amber-600 dark:text-amber-300',
		},
		{
			id: 'out',
			icon: 'HeroXCircle',
			label: 'Productos agotados',
			value: summaryData.outOfStock,
			description:
				summaryData.outOfStock > 0
					? 'Necesitan reposición'
					: 'Todos con stock disponible',
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

	// ── Segmentos de seriales para la barra ──────────────────────────────
	const serialSegments: SerialSegment[] = useMemo(
		() => [
			{
				key: 'available',
				label: 'Disponibles',
				value: summaryData.serialsAvailable,
				color: 'bg-emerald-500',
				bgClass: 'bg-emerald-100 dark:bg-emerald-500/10',
				textClass: 'text-emerald-600 dark:text-emerald-300',
				iconBgClass: 'bg-emerald-500/20',
				icon: 'HeroCheckCircle',
			},
			{
				key: 'quotation',
				label: 'En cotización',
				value: summaryData.serialsInQuotation,
				color: 'bg-sky-500',
				bgClass: 'bg-sky-100 dark:bg-sky-500/10',
				textClass: 'text-sky-600 dark:text-sky-300',
				iconBgClass: 'bg-sky-500/20',
				icon: 'HeroDocumentText',
			},
			{
				key: 'reserved',
				label: 'Reservados',
				value: summaryData.serialsReserved,
				color: 'bg-violet-500',
				bgClass: 'bg-violet-100 dark:bg-violet-500/10',
				textClass: 'text-violet-600 dark:text-violet-300',
				iconBgClass: 'bg-violet-500/20',
				icon: 'HeroLockClosed',
			},
			{
				key: 'on_hold',
				label: 'En espera',
				value: summaryData.serialsOnHold,
				color: 'bg-amber-500',
				bgClass: 'bg-amber-100 dark:bg-amber-500/10',
				textClass: 'text-amber-600 dark:text-amber-300',
				iconBgClass: 'bg-amber-500/20',
				icon: 'HeroClock',
			},
			{
				key: 'sold',
				label: 'Vendidos',
				value: summaryData.serialsSold,
				color: 'bg-rose-500',
				bgClass: 'bg-rose-100 dark:bg-rose-500/10',
				textClass: 'text-rose-600 dark:text-rose-300',
				iconBgClass: 'bg-rose-500/20',
				icon: 'HeroShoppingCart',
			},
		],
		[summaryData],
	);

	const serialsTotal = summaryData.serialsTotalApproved;
	const hasSerialData = serialsTotal > 0 || summaryData.serialsAvailable > 0;

	const branchLabel = branchName ?? 'Todas las sucursales disponibles';
	const handleLowStockClick = () => {
		if (criticalItems.length === 0) return;
		onShowLowStock?.();
	};

	const totalCriticalCount = hasCriticalFromServer
		? criticalProducts.length
		: localInventory.lowStockItems.length + localInventory.outOfStockItems.length;

	return (
		<div className='space-y-6'>
			{/* ═══ SECCIÓN 1: Resumen general ═══ */}
			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader className='gap-1 px-4 pb-2 pt-3 sm:pb-1 sm:pt-3'>
					<CardHeaderChild className='flex flex-col items-start justify-start gap-1'>
						<CardTitle className='flex justify-start gap-2'>
							<Icon
								icon='HeroCubeTransparent'
								className='h-5 w-5 text-emerald-600 dark:text-emerald-300'
							/>
							Gestión de Inventario
						</CardTitle>
						<p className='mt-0 text-sm text-neutral-500'>
							Resumen basado en {formatNumber(summaryData.productsTotalAll)} productos
							sincronizados para la sucursal seleccionada.
						</p>
					</CardHeaderChild>
					<CardHeaderChild className='flex justify-start sm:justify-end'>
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
												<p className='text-sm text-neutral-500'>
													{card.label}
												</p>
												{loading ? (
													<div className='mt-3 h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800' />
												) : (
													<>
														<p
															className={`text-2xl font-semibold ${card.valueClass}`}>
															{formatNumber(card.value)}
														</p>
														{card.description && (
															<p className='mt-1 text-xs text-neutral-500'>
																{card.description}
															</p>
														)}
													</>
												)}
											</div>
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.iconBg}`}>
												<Icon
													icon={card.icon as string}
													className={`h-5 w-5 ${style.iconColor}`}
												/>
											</div>
										</div>
									</CardBody>
								</Card>
							);
						})}
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700'>
						<p className='text-xs text-neutral-500'>
							Inventario total: {formatNumber(summaryData.stockTotal)} unidades en{' '}
							{formatNumber(summaryData.productsTotalAll)} productos.
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
								isDisable={!onShowLowStock || totalCriticalCount === 0}>
								Ver productos críticos
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* ═══ SECCIÓN 2: Distribución de seriales ═══ */}
			{hasSerialData && (
				<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle className='flex items-center gap-2'>
								<Icon
									icon='HeroFingerPrint'
									className='h-5 w-5 text-violet-600 dark:text-violet-300'
								/>
								Distribución de Seriales
							</CardTitle>
						</CardHeaderChild>
						{!loading && (
							<CardHeaderChild>
								<Badge variant='outline' color='violet'>
									{formatNumber(serialsTotal)} seriales aprobados
								</Badge>
							</CardHeaderChild>
						)}
					</CardHeader>
					<CardBody>
						{loading ? (
							<div className='space-y-4'>
								<div className='h-3 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800' />
								<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
									{Array.from({ length: 5 }).map((_, i) => (
										<div
											key={i}
											className='h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50'
										/>
									))}
								</div>
							</div>
						) : (
							<>
								{/* Barra de distribución */}
								<div className='mb-6'>
									<SerialsDistributionBar
										segments={serialSegments}
										total={serialsTotal}
									/>
								</div>

								{/* Mini-cards con datos individuales */}
								<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
									{serialSegments.map((seg) => {
										const pct =
											serialsTotal > 0
												? ((seg.value / serialsTotal) * 100).toFixed(1)
												: '0';
										return (
											<div
												key={seg.key}
												className={`flex flex-col gap-2 rounded-xl border border-neutral-200/80 p-3.5 transition-colors dark:border-neutral-700/60 ${seg.bgClass}`}>
												<div className='flex items-center gap-2'>
													<div
														className={`flex h-7 w-7 items-center justify-center rounded-lg ${seg.iconBgClass}`}>
														<Icon
															icon={seg.icon}
															className={`h-4 w-4 ${seg.textClass}`}
														/>
													</div>
													<span className='text-xs font-medium text-neutral-600 dark:text-neutral-300'>
														{seg.label}
													</span>
												</div>
												<div className='flex items-baseline gap-1.5'>
													<span
														className={`text-lg font-bold ${seg.textClass}`}>
														{formatNumber(seg.value)}
													</span>
													<span className='text-[10px] text-neutral-400'>
														{pct}%
													</span>
												</div>
											</div>
										);
									})}
								</div>

								{/* Indicador de stock sin seriales */}
								{summaryData.stockWithoutSerials > 0 && (
									<div className='mt-4 flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 dark:border-neutral-600 dark:bg-neutral-800/40'>
										<Icon
											icon='HeroInformationCircle'
											className='h-4 w-4 text-neutral-400'
										/>
										<span className='text-xs text-neutral-500 dark:text-neutral-400'>
											{formatNumber(summaryData.stockWithoutSerials)} unidades
											de stock sin seriales asignados
										</span>
									</div>
								)}
							</>
						)}
					</CardBody>
				</Card>
			)}

			{/* ═══ SECCIÓN 3: Productos con stock crítico ═══ */}
			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Productos con stock crítico</CardTitle>
					</CardHeaderChild>
					{!loading ? (
						<CardHeaderChild>
							<Badge variant='outline' color='red'>
								{totalCriticalCount} producto
								{totalCriticalCount === 1 ? '' : 's'}
							</Badge>
						</CardHeaderChild>
					) : null}
				</CardHeader>
				<CardBody>
					{/* Filtros de la tabla */}
					{totalCriticalCount > 0 && !loading && (
						<div className='mb-4 flex flex-wrap items-center gap-3'>
							<div className='relative w-full max-w-xs'>
								<Input
									id='critical-search'
									name='critical-search'
									placeholder='Buscar por nombre, SKU o marca...'
									value={criticalSearch}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setCriticalSearch(e.target.value)
									}
									className='!py-2 !pl-9 !text-sm'
								/>
								<Icon
									icon='HeroMagnifyingGlass'
									className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400'
								/>
							</div>
							<button
								type='button'
								onClick={() => setShowOnlyOutOfStock((prev) => !prev)}
								className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
									showOnlyOutOfStock
										? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
										: 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
								}`}>
								Solo sin stock
							</button>
						</div>
					)}

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
							{criticalSearch || showOnlyOutOfStock
								? 'No se encontraron productos con los filtros aplicados.'
								: 'No hay productos con alertas de stock para esta sucursal.'}
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
														: flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
												</th>
											))}
										</tr>
									))}
								</thead>
								<tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/60'>
									{table.getRowModel().rows.map((row) => (
										<tr
											key={row.id}
											className='hover:bg-neutral-100 dark:hover:bg-neutral-900/40'>
											{row.getVisibleCells().map((cell) => (
												<td
													key={cell.id}
													className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
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
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default InventoryTab;
