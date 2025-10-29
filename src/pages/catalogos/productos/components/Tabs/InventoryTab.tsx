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
import type { IProduct } from '@/interface/product.interface';

interface InventoryTabProps {
	products: IProduct[];
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

const InventoryTab: React.FC<InventoryTabProps> = ({
	products = [],
	loading = false,
	branchName,
	lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
	onShowLowStock,
	onViewProduct,
}) => {
	type CriticalItemRow = {
		product: IProduct;
		id: number;
		name: string;
		sku: string;
		brand: string;
		stock: number;
		status: 'low' | 'out';
		updatedAt?: string | null;
	};

	const inventory = useMemo(() => {
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

	const criticalItems = useMemo<CriticalItemRow[]>(() => {
		const merged = [...inventory.lowStockItems, ...inventory.outOfStockItems];
		return merged
			.map((product) => ({
				product,
				id: product.id,
				name: product.name,
				sku: product.sku,
				brand: product.brand?.name ?? 'Sin marca',
				stock: Number(product.stock ?? 0),
				status: Number(product.stock ?? 0) <= 0 ? 'out' : 'low',
				updatedAt: product.updated_at,
			}))
			.sort((a, b) => {
				const stockDiff = a.stock - b.stock;
				if (stockDiff !== 0) return stockDiff;
				const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
				const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
				return bDate - aDate;
			})
			.slice(0, 8);
	}, [inventory.lowStockItems, inventory.outOfStockItems]);

	const columns = useMemo<ColumnDef<CriticalItemRow>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div className='space-y-1'>
							<p className='font-medium text-neutral-100'>{item.name}</p>
							<p className='text-xs text-neutral-400'>
								SKU: {item.sku} · Marca: {item.brand}
							</p>
							<p className='text-xs text-neutral-500'>
								Actualizado: {getFriendlyDate(item.updatedAt)}
							</p>
						</div>
					);
				},
			},
			{
				id: 'status',
				header: 'Estado',
				cell: ({ row }) => {
					const { status, stock } = row.original;
					return (
						<Badge color={status === 'out' ? 'red' : 'amber'} variant='outline'>
							{status === 'out'
								? 'Sin stock'
								: `Stock bajo · ${formatNumber(stock)}`}
						</Badge>
					);
				},
			},
			{
				id: 'actions',
				header: '',
				size: 120,
				cell: ({ row }) => {
					const { product } = row.original;
					return (
						<Button
							size='sm'
							variant='outline'
							icon='HeroEye'
							isDisable={!onViewProduct}
							onClick={() => onViewProduct?.(product)}>
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
			value: inventory.totalStock,
			description: `${inventory.productCount} productos sincronizados`,
			accentBg: 'bg-blue-100',
			accentText: 'text-blue-600',
		},
		{
			id: 'average',
			icon: 'HeroChartBarSquare',
			label: 'Stock promedio',
			value: Math.round(inventory.averageStock),
			description: `${inventory.serialTracked} con tracking de serie`,
			accentBg: 'bg-indigo-100',
			accentText: 'text-indigo-600',
		},
		{
			id: 'low',
			icon: 'HeroExclamationTriangle',
			label: `Stock bajo (≤ ${lowStockThreshold})`,
			value: inventory.lowStockItems.length,
			description:
				inventory.lowStockItems.length > 0
					? 'Revisa los productos en alerta'
					: 'Sin alertas por ahora',
			accentBg: 'bg-amber-100',
			accentText: 'text-amber-600',
			valueClass: inventory.lowStockItems.length > 0 ? 'text-amber-600' : undefined,
		},
		{
			id: 'out',
			icon: 'HeroXCircle',
			label: 'Productos agotados',
			value: inventory.outOfStockItems.length,
			description:
				inventory.outOfStockItems.length > 0
					? 'Necesitan reposición'
					: 'Todos con stock disponible',
			accentBg: 'bg-red-100',
			accentText: 'text-red-600',
			valueClass: inventory.outOfStockItems.length > 0 ? 'text-red-600' : undefined,
		},
	];

	const summaryStyles: Record<
		typeof summaryCards[number]['id'],
		{ iconBg: string; iconColor: string; accentBorder: string }
	> = {
		total: {
			iconBg: 'bg-emerald-500/10',
			iconColor: 'text-emerald-500',
			accentBorder: 'border-emerald-500/40',
		},
		average: {
			iconBg: 'bg-indigo-500/10',
			iconColor: 'text-indigo-500',
			accentBorder: 'border-indigo-500/40',
		},
		low: {
			iconBg: 'bg-amber-500/10',
			iconColor: 'text-amber-500',
			accentBorder: 'border-amber-500/40',
		},
		out: {
			iconBg: 'bg-rose-500/10',
			iconColor: 'text-rose-500',
			accentBorder: 'border-rose-500/40',
		},
	};

	const branchLabel = branchName ?? 'Todas las sucursales disponibles';
	const handleLowStockClick = () => {
		if (inventory.lowStockItems.length === 0 && inventory.outOfStockItems.length === 0) return;
		onShowLowStock?.();
	};

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardHeaderChild className='flex flex-col gap-1'>
						<CardTitle className='flex items-center gap-2'>
							<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
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
						{summaryCards.map((card) => (
							<Card
								key={card.id}
								className={`h-full border border-dashed ${summaryStyles[card.id].accentBorder}`}>
								<CardBody className='flex h-full flex-col justify-between gap-4'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<p className='text-sm text-neutral-500'>{card.label}</p>
											{loading ? (
												<div className='mt-3 h-7 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
											) : (
												<>
													<p
														className={`text-2xl font-semibold ${card.valueClass ?? ''}`}>
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
											className={`flex h-10 w-10 items-center justify-center rounded-xl ${summaryStyles[card.id].iconBg}`}>
											<Icon
												icon={card.icon as any}
												className={`h-5 w-5 ${summaryStyles[card.id].iconColor}`}
											/>
										</div>
									</div>
								</CardBody>
							</Card>
						))}
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-4'>
						<p className='text-xs text-neutral-500'>
							Inventario total: {formatNumber(inventory.totalStock)} unidades en{' '}
							{inventory.productCount} productos.
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
									(inventory.lowStockItems.length === 0 && inventory.outOfStockItems.length === 0)
								}>
								Ver productos críticos
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Productos con stock crítico</CardTitle>
					</CardHeaderChild>
					<CardHeaderChild>
						<Badge variant='outline' color='red'>
							{criticalItems.length} productos
						</Badge>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					{loading ? (
						<div className='space-y-3'>
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={index}
									className='flex items-center justify-between gap-4 rounded border p-3'>
									<div className='h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
									<div className='h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700' />
								</div>
							))}
						</div>
					) : criticalItems.length === 0 ? (
						<div className='rounded-lg border border-dashed p-6 text-center text-sm text-neutral-500'>
							No hay productos con alertas de stock para esta sucursal.
						</div>
					) : (
						<div className='space-y-3'>
							{criticalItems.map((item) => (
								<Card key={item.id}>
									<CardBody className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
										<div className='space-y-1'>
											<p className='font-semibold text-gray-900 dark:text-gray-100'>
												{item.name}
											</p>
											<p className='text-xs text-neutral-500'>
												SKU: {item.sku} · Marca: {item.brand}
											</p>
											<p className='text-xs text-neutral-400'>
												Actualizado: {getFriendlyDate(item.updatedAt)}
											</p>
										</div>
										<div className='flex flex-wrap items-center gap-2'>
											<Badge
												color={item.status === 'out' ? 'red' : 'amber'}
												variant='outline'
												className='text-xs font-semibold'>
												{item.status === 'out'
													? 'Sin stock'
													: `Stock bajo · ${formatNumber(item.stock)}`}
											</Badge>
											<Button
												size='sm'
												variant='outline'
												icon='HeroEye'
												isDisable={!onViewProduct}
												onClick={() => {
													if (onViewProduct) onViewProduct(item.product);
												}}>
												Ver producto
											</Button>
										</div>
									</CardBody>
								</Card>
							))}
						</div>
					)}
				</CardBody>
			</Card>
		</div>
	);
};

export default InventoryTab;

