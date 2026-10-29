import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Tabs, { Tab } from '@/components/ui/Tabs';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store';
import { fetchProductsList } from '@/store/slices/products/productsSlice';
import { batchAdjustStock } from '@/store/slices/products/productStockSlice';
import type {
	IProduct,
	ProductInventorySummary,
	ProductListMeta,
} from '@/interface/product.interface';
import { PRODUCT_EMPTY_INVENTORY_SUMMARY } from '@/constants/product.constant';
import InventoryCriticalSection from './InventoryCriticalSection';
import InventoryImportModal from './InventoryImportModal';
import SoftHoldsBadge from '@/components/ui/SoftHoldsBadge';
import type { CriticalItemRow, InventoryTabProps, SerialSegment } from './inventoryTab.types';
import {
	buildProductsById,
	buildVisibleInventoryRows,
	downloadInventoryCsv,
	formatNumber,
	getFriendlyDate,
} from './inventoryTab.utils';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const EMPTY_META: ProductListMeta = {
	total: 0,
	current_page: 1,
	per_page: 15,
	last_page: 1,
};

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

const CircularMetricChart: React.FC<{ segments: SerialSegment[]; total: number }> = ({
	segments,
	total,
}) => {
	const safeTotal = total > 0 ? total : 1;
	let accumulated = 0;
	const gradientStops = segments
		.filter((segment) => segment.value > 0)
		.flatMap((segment) => {
			const start = (accumulated / safeTotal) * 100;
			accumulated += segment.value;
			const end = (accumulated / safeTotal) * 100;
			const color = segment.color.replace('bg-', '').replace('-500', '');
			const palette: Record<string, string> = {
				emerald: '#10b981',
				sky: '#0ea5e9',
				violet: '#8b5cf6',
				amber: '#f59e0b',
				rose: '#f43f5e',
			};
			const hex = palette[color] ?? '#94a3b8';
			return [`${hex} ${start}%`, `${hex} ${end}%`];
		})
		.join(', ');

	return (
		<div className='relative flex h-48 w-48 items-center justify-center self-center rounded-full bg-white dark:bg-neutral-950'>
			<div
				className='absolute inset-0 rounded-full'
				style={{
					background:
						total > 0 && gradientStops.length > 0
							? `conic-gradient(${gradientStops})`
							: 'conic-gradient(#e5e7eb 0 100%)',
				}}
			/>
			<div className='absolute inset-[18px] rounded-full bg-white dark:bg-neutral-950' />
			<div className='relative z-10 text-center'>
				<p className='text-xs font-medium uppercase tracking-[0.2em] text-neutral-400'>
					Seriales
				</p>
				<p className='mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100'>
					{formatNumber(total)}
				</p>
				<p className='text-xs text-neutral-500'>Aprobados</p>
			</div>
		</div>
	);
};

const InventoryTab: React.FC<InventoryTabProps> = ({
	products = [],
	meta,
	entityParam,
	entityId,
	summary = PRODUCT_EMPTY_INVENTORY_SUMMARY,
	criticalProducts = [],
	loading = false,
	branchName,
	lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
	onShowLowStock,
	onViewProduct,
	subsidiaryId,
	selectedBranchId,
	onRefresh,
}) => {
	const dispatch = useAppDispatch();
	const criticalSectionRef = useRef<HTMLDivElement | null>(null);
	const [dashboardTab, setDashboardTab] = useState('products');
	const [criticalSearch, setCriticalSearch] = useState('');
	const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);
	const [inventorySearch, setInventorySearch] = useState('');
	const [showOnlyChildren, setShowOnlyChildren] = useState(false);
	const [hideZeroStock, setHideZeroStock] = useState(false);
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [tabProducts, setTabProducts] = useState<Record<'serials' | 'non-serial', IProduct[]>>({
		serials: [],
		'non-serial': [],
	});
	const [tabMeta, setTabMeta] = useState<Record<'serials' | 'non-serial', ProductListMeta>>({
		serials: EMPTY_META,
		'non-serial': EMPTY_META,
	});
	const [tabLoading, setTabLoading] = useState<Record<'serials' | 'non-serial', boolean>>({
		serials: false,
		'non-serial': false,
	});

	useEffect(() => {
		if (dashboardTab === 'products') return;
		if (!entityParam || !entityId) return;

		const targetTab = dashboardTab === 'serials' ? 'serials' : 'non-serial';
		const serialTracking = dashboardTab === 'serials';
		let cancelled = false;

		setTabLoading((prev) => ({ ...prev, [targetTab]: true }));

		void dispatch(
			fetchProductsList({
				entityParam,
				entityId,
				params: {
					page: 1,
					per_page: 200,
					serial_tracking: serialTracking,
				},
			}),
		)
			.unwrap()
			.then((result) => {
				if (cancelled) return;
				setTabProducts((prev) => ({ ...prev, [targetTab]: result.items }));
				setTabMeta((prev) => ({ ...prev, [targetTab]: result.meta }));
			})
			.catch(() => {
				if (cancelled) return;
				setTabProducts((prev) => ({ ...prev, [targetTab]: [] }));
				setTabMeta((prev) => ({ ...prev, [targetTab]: EMPTY_META }));
			})
			.finally(() => {
				if (cancelled) return;
				setTabLoading((prev) => ({ ...prev, [targetTab]: false }));
			});

		return () => {
			cancelled = true;
		};
	}, [dashboardTab, dispatch, entityId, entityParam]);

	const activeProducts = useMemo(() => {
		if (dashboardTab === 'serials') return tabProducts.serials;
		if (dashboardTab === 'non-serial') return tabProducts['non-serial'];
		return products;
	}, [dashboardTab, products, tabProducts]);

	const activeMeta = useMemo(() => {
		if (dashboardTab === 'serials') return tabMeta.serials;
		if (dashboardTab === 'non-serial') return tabMeta['non-serial'];
		return meta;
	}, [dashboardTab, meta, tabMeta]);

	const activeTableLoading =
		loading ||
		(dashboardTab === 'serials'
			? tabLoading.serials
			: dashboardTab === 'non-serial'
				? tabLoading['non-serial']
				: false);

	const localInventory = useMemo(() => {
		if (!products.length) {
			return {
				totalStock: 0,
				productCount: 0,
				serialTracked: 0,
				lowStockItems: [],
				outOfStockItems: [],
				averageStock: 0,
			} as {
				totalStock: number;
				productCount: number;
				serialTracked: number;
				lowStockItems: typeof products;
				outOfStockItems: typeof products;
				averageStock: number;
			};
		}

		let totalStock = 0;
		let serialTracked = 0;
		const lowStockItems = [] as typeof products;
		const outOfStockItems = [] as typeof products;

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
		if (hasServerSummary) return summary;

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

	const currentPageInventory = useMemo(() => {
		const parentCount = activeProducts.length;
		const childCount = activeProducts.reduce(
			(total, product) =>
				total + (Array.isArray(product.children) ? product.children.length : 0),
			0,
		);
		const visibleStock = activeProducts.reduce((total, product) => {
			const parentStock = Number(product.stock ?? 0);
			const childrenStock = (product.children ?? []).reduce(
				(childTotal, child) => childTotal + Number(child.stock ?? 0),
				0,
			);
			return total + parentStock + childrenStock;
		}, 0);

		return {
			parentCount,
			childCount,
			visibleStock,
			from:
				activeMeta.total === 0
					? 0
					: (activeMeta.current_page - 1) * activeMeta.per_page + 1,
			to: Math.min(activeMeta.current_page * activeMeta.per_page, activeMeta.total),
		};
	}, [activeMeta, activeProducts]);

	const productsById = useMemo(() => buildProductsById(activeProducts), [activeProducts]);

	const visibleInventoryRows = useMemo(() => {
		const rows = buildVisibleInventoryRows(activeProducts, productsById);
		const query = inventorySearch.trim().toLowerCase();
		return rows.filter((row) => {
			const hasSerialTracking = Boolean(row.product?.serial_tracking);
			if (showOnlyChildren && row.isParent) return false;
			if (hideZeroStock && row.stock <= 0) return false;
			if (!query) return true;
			return [row.name, row.sku, row.brand, row.grade].some((value) =>
				value.toLowerCase().includes(query),
			);
		});
	}, [activeProducts, productsById, inventorySearch, showOnlyChildren, hideZeroStock]);

	const criticalItems = useMemo<CriticalItemRow[]>(() => {
		let items: CriticalItemRow[];

		if (criticalProducts.length > 0) {
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
					if (a.stock !== b.stock) return a.stock - b.stock;
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
					const stockDiff = a.stock - b.stock;
					if (stockDiff !== 0) return stockDiff;
					const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
					const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
					return bDate - aDate;
				});
		}

		let filtered = items;
		if (showOnlyOutOfStock) filtered = filtered.filter((item) => item.status === 'out');
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
	}, [criticalProducts, productsById, localInventory, showOnlyOutOfStock, criticalSearch]);

	const handleLowStockClick = () => {
		if (criticalItems.length === 0) return;
		onShowLowStock?.();
		requestAnimationFrame(() => {
			criticalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	const handleExportInventory = () => {
		if (visibleInventoryRows.length === 0) {
			toast.info('No hay datos visibles para exportar');
			return;
		}
		downloadInventoryCsv(visibleInventoryRows, branchName);
		toast.success('Inventario exportado correctamente');
	};

	const handleImportInventory = async (payload: {
		branch_id: number;
		reason: string;
		notes?: string;
		items: { product_id: number; quantity_change: number }[];
	}) => {
		if (!subsidiaryId) {
			toast.error('No se pudo resolver la subsidiaria para importar inventario');
			return;
		}
		setIsImporting(true);
		try {
			await dispatch(batchAdjustStock({ subsidiaryId, payload })).unwrap();
			await onRefresh?.();
			toast.success('Inventario importado correctamente');
		} catch (error: unknown) {
			const message =
				typeof error === 'string' && error.trim().length > 0
					? error
					: 'No se pudo importar el inventario';
			toast.error(message);
			throw error;
		} finally {
			setIsImporting(false);
		}
	};

	const summaryCards = [
		{
			id: 'total',
			icon: 'HeroCubeTransparent',
			label: 'Total stock',
			value: summaryData.stockTotal,
			description: `${formatNumber(summaryData.productsTotalAll)} productos sincronizados`,
			valueClass: 'text-emerald-600 dark:text-emerald-300',
		},
		{
			id: 'low',
			icon: 'HeroExclamationTriangle',
			label: `Critical stock`,
			value: summaryData.lowStockCount,
			description: `Umbral configurado ≤ ${formatNumber(summaryData.criticalThreshold)}`,
			valueClass: 'text-amber-600 dark:text-amber-300',
		},
		{
			id: 'out',
			icon: 'HeroXCircle',
			label: 'Out of stock',
			value: summaryData.outOfStock,
			description: `${formatNumber(summaryData.withStockAvailable)} con stock disponible`,
			valueClass: 'text-rose-600 dark:text-rose-300',
		},
		{
			id: 'average',
			icon: 'HeroArrowPathRoundedSquare',
			label: 'Sync status',
			value: summaryData.syncedProducts,
			description: `De ${formatNumber(summaryData.productsTotalAll)} productos del catálogo`,
			valueClass: 'text-indigo-600 dark:text-indigo-300',
		},
	];

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
	const totalCriticalCount =
		criticalProducts.length > 0
			? criticalProducts.length
			: localInventory.lowStockItems.length + localInventory.outOfStockItems.length;
	const visibleRowsPreview = visibleInventoryRows.slice(0, 24);
	const canUseInventoryImportExport = dashboardTab === 'non-serial';
	const visibleRowsLabel =
		dashboardTab === 'serials'
			? 'Productos serializados visibles en esta página'
			: dashboardTab === 'non-serial'
				? 'Productos sin serie visibles en esta página'
				: 'Productos visibles en esta página';
	const visibleRowsDescription =
		dashboardTab === 'serials'
			? 'Mostrando únicamente productos y variantes con tracking/serialización.'
			: dashboardTab === 'non-serial'
				? 'Mostrando únicamente productos y variantes sin tracking de serie.'
				: 'Mostrando padres paginados con sus variantes embebidas';
	const trackedRatio =
		summaryData.productsTotalAll > 0
			? (summaryData.serialTrackingCount / summaryData.productsTotalAll) * 100
			: 0;
	const untrackedRatio =
		summaryData.productsTotalAll > 0
			? (summaryData.withoutSerialTracking / summaryData.productsTotalAll) * 100
			: 0;
	const serialSoldRatio = serialsTotal > 0 ? (summaryData.serialsSold / serialsTotal) * 100 : 0;
	const inventoryOverviewCards = [
		{
			title: 'Catálogo sincronizado',
			value: formatNumber(summaryData.productsTotalAll),
			detail: `${formatNumber(summaryData.productsTotal)} padres · ${formatNumber(summaryData.totalChildrenProducts)} variantes`,
			icon: 'HeroSquares2X2',
			tone: 'text-slate-700 dark:text-slate-200',
			bg: 'bg-slate-50 dark:bg-neutral-900/60',
		},
		{
			title: 'Stock promedio',
			value: formatNumber(Math.round(summaryData.stockAverage)),
			detail: `${formatNumber(summaryData.stockTotal)} unidades totales`,
			icon: 'HeroChartBar',
			tone: 'text-indigo-600 dark:text-indigo-300',
			bg: 'bg-indigo-50 dark:bg-indigo-500/10',
		},
		{
			title: 'Con tracking',
			value: `${trackedRatio.toFixed(1)}%`,
			detail: `${formatNumber(summaryData.serialTrackingCount)} productos`,
			icon: 'HeroQrCode',
			tone: 'text-emerald-600 dark:text-emerald-300',
			bg: 'bg-emerald-50 dark:bg-emerald-500/10',
		},
		{
			title: 'Sin tracking',
			value: `${untrackedRatio.toFixed(1)}%`,
			detail: `${formatNumber(summaryData.withoutSerialTracking)} productos`,
			icon: 'HeroArchiveBoxXMark',
			tone: 'text-amber-600 dark:text-amber-300',
			bg: 'bg-amber-50 dark:bg-amber-500/10',
		},
	];
	const importSerialTrackedProductIds = useMemo(
		() =>
			Array.from(buildProductsById(products).values())
				.filter((product) => product.serial_tracking)
				.map((product) => product.id),
		[products],
	);

	return (
		<div className='space-y-6'>
			<InventoryImportModal
				isOpen={isImportModalOpen}
				onClose={() => setIsImportModalOpen(false)}
				branchId={selectedBranchId ?? null}
				onSubmit={handleImportInventory}
				isSubmitting={isImporting}
				serialTrackedProductIds={importSerialTrackedProductIds}
			/>

			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader className='gap-3 px-4 pb-2 pt-3 sm:pb-1 sm:pt-3'>
					<CardHeaderChild className='flex flex-col items-start justify-start gap-1'>
						<CardTitle className='flex justify-start gap-2'>
							<Icon
								icon='HeroCubeTransparent'
								className='h-5 w-5 text-emerald-600 dark:text-emerald-300'
							/>
							Gestión de Inventario
						</CardTitle>
						<p className='mt-0 text-sm text-neutral-500'>
							Resumen global del catálogo:{' '}
							{formatNumber(summaryData.productsTotalAll)} productos sincronizados
							para la sucursal seleccionada.
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

					<div className='mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-950/40'>
						<Tabs
							activeTab={dashboardTab}
							onTabChange={setDashboardTab}
							variant='pills'
							className='w-full'
							contentClassName='mt-4'>
							<Tab
								id='products'
								text='Productos'
								icon='HeroCubeTransparent'
								badge={formatNumber(summaryData.productsTotalAll)}>
								<div className='space-y-4'>
									<div className='grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]'>
										<div className='grid gap-4 sm:grid-cols-2'>
											{inventoryOverviewCards.map((card) => (
												<div
													key={card.title}
													className={`rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700 ${card.bg}`}>
													<div className='flex items-start justify-between gap-3'>
														<div>
															<p className='text-xs font-semibold uppercase tracking-wide text-neutral-400'>
																{card.title}
															</p>
															<p
																className={`mt-2 text-3xl font-semibold ${card.tone}`}>
																{card.value}
															</p>
															<p className='mt-1 text-sm text-neutral-500'>
																{card.detail}
															</p>
														</div>
														<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-900'>
															<Icon
																icon={card.icon}
																className={`h-5 w-5 ${card.tone}`}
															/>
														</div>
													</div>
												</div>
											))}
										</div>
										<div className='grid gap-4'>
											<div className='rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60'>
												<div className='flex items-center justify-between gap-3'>
													<div>
														<p className='text-xs font-semibold uppercase tracking-wide text-neutral-400'>
															Brand portfolio
														</p>
														<p className='mt-1 text-sm text-neutral-500'>
															Peso de la marca visible en esta página.
														</p>
													</div>
													<Icon
														icon='HeroBuildingOffice2'
														className='h-5 w-5 text-neutral-400'
													/>
												</div>
												<div className='mt-4 space-y-3'>
													{Object.entries(
														visibleInventoryRows.reduce<
															Record<string, number>
														>((acc, row) => {
															acc[row.brand] =
																(acc[row.brand] ?? 0) + row.stock;
															return acc;
														}, {}),
													)
														.sort((a, b) => b[1] - a[1])
														.slice(0, 4)
														.map(([brand, stock]) => {
															const pct =
																summaryData.stockTotal > 0
																	? (stock /
																			summaryData.stockTotal) *
																		100
																	: 0;
															return (
																<div
																	key={brand}
																	className='space-y-1.5'>
																	<div className='flex items-center justify-between gap-3 text-sm'>
																		<span className='font-medium text-neutral-700 dark:text-neutral-200'>
																			{brand}
																		</span>
																		<span className='text-neutral-500'>
																			{formatNumber(stock)}{' '}
																			units
																		</span>
																	</div>
																	<div className='h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800'>
																		<div
																			className='h-full rounded-full bg-neutral-900 dark:bg-neutral-100'
																			style={{
																				width: `${Math.max(pct, 6)}%`,
																			}}
																		/>
																	</div>
																</div>
															);
														})}
												</div>
											</div>
											<div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10'>
												<div className='flex items-start gap-3'>
													<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-neutral-900'>
														<Icon
															icon='HeroSparkles'
															className='h-5 w-5 text-amber-500'
														/>
													</div>
													<div>
														<p className='text-sm font-semibold text-amber-700 dark:text-amber-200'>
															Restock analysis
														</p>
														<p className='mt-1 text-xs text-amber-700/80 dark:text-amber-100/80'>
															{summaryData.outOfStock > 0
																? `${formatNumber(summaryData.outOfStock)} productos sin stock y ${formatNumber(summaryData.lowStockCount)} críticos requieren atención inmediata.`
																: 'No hay productos agotados en este momento.'}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
									<InventoryCriticalSection
										containerRef={criticalSectionRef}
										criticalItems={criticalItems}
										totalCriticalCount={totalCriticalCount}
										loading={loading}
										criticalSearch={criticalSearch}
										showOnlyOutOfStock={showOnlyOutOfStock}
										onCriticalSearchChange={setCriticalSearch}
										onToggleOutOfStock={() =>
											setShowOnlyOutOfStock((prev) => !prev)
										}
										onViewProduct={onViewProduct}
									/>
								</div>
							</Tab>
							<Tab
								id='serials'
								text='Seriales'
								icon='HeroFingerPrint'
								badge={hasSerialData ? formatNumber(serialsTotal) : undefined}
								disabled={!hasSerialData}>
								<div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
									<div className='rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60'>
										<div className='flex items-center justify-between gap-3'>
											<div>
												<p className='text-xs font-semibold uppercase tracking-wide text-neutral-400'>
													Pie chart
												</p>
												<p className='mt-1 text-sm text-neutral-500'>
													Estado actual de seriales aprobados.
												</p>
											</div>
											<Badge variant='outline' color='violet'>
												{formatNumber(serialsTotal)}
											</Badge>
										</div>
										<div className='mt-4 flex justify-center'>
											<CircularMetricChart
												segments={serialSegments}
												total={serialsTotal}
											/>
										</div>
									</div>
									<div className='space-y-4'>
										<div className='rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60'>
											<div className='flex items-center justify-between gap-3'>
												<div>
													<p className='text-xs font-semibold uppercase tracking-wide text-neutral-400'>
														Dashboard serializado
													</p>
													<p className='mt-1 text-sm text-neutral-500'>
														Productos con tracking, disponibilidad y
														salida comercial.
													</p>
												</div>
												<Icon
													icon='HeroChartPie'
													className='h-5 w-5 text-violet-400'
												/>
											</div>
											<div className='mt-4'>
												<SerialsDistributionBar
													segments={serialSegments}
													total={serialsTotal}
												/>
											</div>
											<div className='mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5'>
												{serialSegments.map((seg) => {
													const pct =
														serialsTotal > 0
															? (
																	(seg.value / serialsTotal) *
																	100
																).toFixed(1)
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
										</div>
										<div className='grid gap-4 md:grid-cols-3'>
											<div className='rounded-2xl border border-neutral-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10'>
												<p className='text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300'>
													Disponibles
												</p>
												<p className='mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-200'>
													{formatNumber(summaryData.serialsAvailable)}
												</p>
												<p className='mt-1 text-xs text-emerald-700/80 dark:text-emerald-100/80'>
													Seriales listos para operar
												</p>
											</div>
											<div className='rounded-2xl border border-neutral-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10'>
												<p className='text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300'>
													Vendidos
												</p>
												<p className='mt-2 text-3xl font-semibold text-violet-700 dark:text-violet-200'>
													{formatNumber(summaryData.serialsSold)}
												</p>
												<p className='mt-1 text-xs text-violet-700/80 dark:text-violet-100/80'>
													{serialSoldRatio.toFixed(1)}% del total aprobado
												</p>
											</div>
											<div className='rounded-2xl border border-neutral-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10'>
												<p className='text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300'>
													Tracking coverage
												</p>
												<p className='mt-2 text-3xl font-semibold text-sky-700 dark:text-sky-200'>
													{formatNumber(summaryData.serialTrackingCount)}
												</p>
												<p className='mt-1 text-xs text-sky-700/80 dark:text-sky-100/80'>
													Productos controlados por serial
												</p>
											</div>
										</div>
									</div>
								</div>
							</Tab>
							<Tab
								id='non-serial'
								text='Sin serie'
								icon='HeroArchiveBox'
								badge={formatNumber(summaryData.stockWithoutSerials)}>
								<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
									<div className='rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60'>
										<div className='flex items-start justify-between gap-3'>
											<div>
												<p className='text-xs font-semibold uppercase tracking-wide text-neutral-400'>
													Stock no serializado
												</p>
												<p className='mt-1 text-sm text-neutral-500'>
													Unidades disponibles sin serial asignado,
													separadas de las métricas serializadas.
												</p>
											</div>
											<Icon
												icon='HeroArchiveBoxXMark'
												className='h-5 w-5 text-amber-400'
											/>
										</div>
										<div className='mt-5 grid gap-4 sm:grid-cols-3'>
											<div className='rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/50'>
												<p className='text-xs uppercase tracking-wide text-neutral-400'>
													Stock sin serie
												</p>
												<p className='mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100'>
													{formatNumber(summaryData.stockWithoutSerials)}
												</p>
											</div>
											<div className='rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/50'>
												<p className='text-xs uppercase tracking-wide text-neutral-400'>
													Productos sin tracking
												</p>
												<p className='mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100'>
													{formatNumber(
														summaryData.withoutSerialTracking,
													)}
												</p>
											</div>
											<div className='rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/50'>
												<p className='text-xs uppercase tracking-wide text-neutral-400'>
													Participación
												</p>
												<p className='mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-100'>
													{summaryData.stockTotal > 0
														? (
																(summaryData.stockWithoutSerials /
																	summaryData.stockTotal) *
																100
															).toFixed(1)
														: '0.0'}
													%
												</p>
											</div>
										</div>
									</div>
									<div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10'>
										<p className='text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300'>
											Observación
										</p>
										<p className='mt-2 text-sm text-amber-700 dark:text-amber-100'>
											Este tab te deja separado el inventario no serializado
											para que no contamine el análisis de seriales vendidos,
											reservados o aprobados.
										</p>
									</div>
								</div>
							</Tab>
						</Tabs>
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700'>
						<div className='space-y-1 text-xs text-neutral-500'>
							<p>
								Inventario global: {formatNumber(summaryData.stockTotal)} unidades
								en {formatNumber(summaryData.productsTotalAll)} productos.
							</p>
							<p>
								Página actual: {formatNumber(currentPageInventory.parentCount)}{' '}
								padres, {formatNumber(currentPageInventory.childCount)} variantes y{' '}
								{formatNumber(currentPageInventory.visibleStock)} unidades visibles.
							</p>
						</div>
						<div className='flex flex-wrap gap-2'>
							{canUseInventoryImportExport ? (
								<>
									<Button
										variant='outline'
										icon='HeroArrowDownTray'
										size='sm'
										onClick={() => setIsImportModalOpen(true)}
										isDisable={
											!selectedBranchId || !subsidiaryId || isImporting
										}>
										Importar inventario
									</Button>
									<Button
										variant='outline'
										icon='HeroArrowUpTray'
										size='sm'
										onClick={handleExportInventory}>
										Exportar inventario
									</Button>
								</>
							) : (
								<div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>
									Los productos con serial tracking se gestionan desde el módulo
									de equipos. En esta vista no se habilita importar ni exportar
									inventario.
								</div>
							)}
							<Button
								size='sm'
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								onClick={handleLowStockClick}
								isDisable={totalCriticalCount === 0}>
								Ver productos críticos
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle className='flex items-center gap-2'>
							<Icon
								icon='HeroTableCells'
								className='h-5 w-5 text-sky-600 dark:text-sky-300'
							/>
							{visibleRowsLabel}
						</CardTitle>
					</CardHeaderChild>
					<CardHeaderChild>
						<Badge variant='outline' color='sky'>
							Página {formatNumber(activeMeta.current_page)} de{' '}
							{formatNumber(activeMeta.last_page)}
						</Badge>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]'>
						<div className='relative w-full'>
							<Input
								id='inventory-search'
								name='inventory-search'
								placeholder='Buscar padre o variante por nombre, SKU, marca o grado...'
								value={inventorySearch}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setInventorySearch(e.target.value)
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
							onClick={() => setShowOnlyChildren((prev) => !prev)}
							className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${showOnlyChildren ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300' : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}>
							Solo variantes
						</button>
						<button
							type='button'
							onClick={() => setHideZeroStock((prev) => !prev)}
							className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${hideZeroStock ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}>
							Ocultar stock 0
						</button>
					</div>

					<div className='mb-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900/30'>
						<p className='font-medium text-neutral-700 dark:text-neutral-200'>
							{visibleRowsDescription}
						</p>
						<p className='mt-1 text-xs text-neutral-500'>
							La API pagina {formatNumber(activeMeta.total)} productos padre. En esta
							página se están viendo del {formatNumber(currentPageInventory.from)} al{' '}
							{formatNumber(currentPageInventory.to)}, que despliegan{' '}
							{formatNumber(currentPageInventory.childCount)} variantes adicionales.
							Vista actual: {formatNumber(visibleInventoryRows.length)} registros
							filtrados por tab.
						</p>
					</div>

					{activeTableLoading ? (
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
					) : visibleRowsPreview.length === 0 ? (
						<div className='rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700'>
							No hay productos visibles para los filtros aplicados en esta pestaña.
						</div>
					) : (
						<div className='overflow-hidden rounded-lg border border-dashed border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900/40'>
							<table className='min-w-full divide-y divide-neutral-200 dark:divide-neutral-800'>
								<thead className='bg-neutral-50 dark:bg-neutral-900/60'>
									<tr>
										<th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
											Producto
										</th>
										<th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
											Tipo
										</th>
										<th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
											Stock
										</th>
										<th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
											Detalle
										</th>
										<th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400'>
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/60'>
									{visibleRowsPreview.map((row) => (
										<tr
											key={row.id}
											className='hover:bg-neutral-100 dark:hover:bg-neutral-900/40'>
											<td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
												<div className='space-y-1'>
													<p
														className={`font-medium ${row.isParent ? 'text-neutral-900 dark:text-neutral-100' : 'pl-4 text-neutral-800 dark:text-neutral-200'}`}>
														{row.isParent ? row.name : `↳ ${row.name}`}
													</p>
													<p className='text-xs text-neutral-500 dark:text-neutral-400'>
														SKU: {row.sku} · Marca: {row.brand}
													</p>
													<p className='text-xs text-neutral-400 dark:text-neutral-500'>
														Actualizado:{' '}
														{getFriendlyDate(row.updatedAt)}
													</p>
												</div>
											</td>
											<td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
												<div className='flex flex-wrap gap-2'>
													<Badge
														color={row.isParent ? 'sky' : 'violet'}
														variant='outline'>
														{row.isParent
															? 'Padre'
															: `Grado ${row.grade}`}
													</Badge>
													{row.isParent && row.childrenCount > 0 && (
														<Badge color='zinc' variant='outline'>
															{formatNumber(row.childrenCount)}{' '}
															variantes
														</Badge>
													)}
												</div>
											</td>
											<td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
												<p className='font-semibold'>
													{formatNumber(row.stock)}
												</p>
												<p className='text-xs text-neutral-500'>
													Disponibles: {formatNumber(row.available)}
												</p>
												{row.effectiveAvailable <= 0 &&
													(row.softHolds?.quantity ?? 0) > 0 && (
														<div className='mt-1.5'>
															<SoftHoldsBadge
																softHolds={row.softHolds}
																availableStock={
																	row.effectiveAvailable
																}
															/>
														</div>
													)}
											</td>
											<td className='px-4 py-4 align-top text-xs text-neutral-500 dark:text-neutral-400'>
												<div className='space-y-1'>
													<p>Reservado: {formatNumber(row.reserved)}</p>
													<p>En espera: {formatNumber(row.onHold)}</p>
													<p>
														En cotización:{' '}
														{formatNumber(row.inQuotation)}
													</p>
													<p>Vendidos: {formatNumber(row.sold)}</p>
													<p
														className={
															(row.softHolds?.quantity ?? 0) > 0
																? 'font-semibold text-amber-600 dark:text-amber-400'
																: undefined
														}>
														Apartado:{' '}
														{formatNumber(row.softHolds?.quantity ?? 0)}
													</p>
												</div>
											</td>
											<td className='px-4 py-4 align-top text-sm text-neutral-700 dark:text-neutral-200'>
												<Button
													size='sm'
													variant='outline'
													icon='HeroEye'
													isDisable={!onViewProduct || !row.product}
													onClick={() => {
														if (onViewProduct && row.product)
															onViewProduct(row.product);
													}}>
													Ver producto
												</Button>
											</td>
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
