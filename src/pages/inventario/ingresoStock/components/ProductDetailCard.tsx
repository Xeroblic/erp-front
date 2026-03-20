/**
 * ProductDetailCard.tsx
 * @UI_UX + @Full_React
 * Card de detalle de producto con desglose de stock por sucursal.
 * Consume fetchProductAllocations de productStockSlice al montarse.
 */
import { useEffect, useMemo, useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import type { IProduct } from '@/interface/product.interface';
import ApiService from '@/services/ApiService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProductAllocations } from '@/store/slices/products/productStockSlice';

interface ProductDetailCardProps {
	/** Producto seleccionado del catálogo */
	product: IProduct;
	/** Opciones de sucursales filtradas por subsidiaria activa */
	branches: { value: string; label: string }[];
	/** Sucursal destino elegida */
	targetBranchId: string;
	/** Handler al cambiar sucursal destino */
	onTargetBranchChange: (branchId: string) => void;
	/** Handler al confirmar "Comenzar Ajuste" */
	onStartAdjustment: () => void;
	/** Handler para cerrar la card */
	onClose: () => void;
	/** ID de subsidiaria activa para el fetch */
	subsidiaryId: number | null;
}

export const ProductDetailCard = ({
	product,
	branches,
	targetBranchId,
	onTargetBranchChange,
	onStartAdjustment,
	onClose,
	subsidiaryId,
}: ProductDetailCardProps) => {
	const dispatch = useAppDispatch();
	const { allocations, isLoadingAllocations } = useAppSelector((s) => s.productStock);
	const [branchStockFallback, setBranchStockFallback] = useState<Map<number, number>>(new Map());
	const [isLoadingBranchFallback, setIsLoadingBranchFallback] = useState(false);

	const allocationsByBranch = useMemo(() => {
		const map = new Map<number, number>();
		for (const alloc of allocations) {
			const branchId = Number(alloc.branch_id ?? 0);
			if (!branchId) continue;
			map.set(branchId, Number(alloc.stock ?? 0));
		}
		return map;
	}, [allocations]);

	const branchStockRows = useMemo(() => {
		if (!branches.length) {
			return allocations.map((alloc) => ({
				branchId: Number(alloc.branch_id ?? 0),
				branchName: alloc.branch_name,
				stock: Number(alloc.stock ?? 0),
			}));
		}

		return branches.map((branch) => {
			const branchId = Number(branch.value);
			const stockFromAlloc = allocationsByBranch.get(branchId);
			const stockFromFallback = branchStockFallback.get(branchId);
			const branchStock = Number(stockFromAlloc ?? stockFromFallback ?? 0);
			return {
				branchId,
				branchName: branch.label,
				stock: branchStock,
			};
		});
	}, [allocations, allocationsByBranch, branchStockFallback, branches]);

	const selectedBranchStock = useMemo(() => {
		const selectedId = Number(targetBranchId);
		if (!selectedId) return null;
		return (
			branchStockRows.find((row) => row.branchId === selectedId) ?? {
				branchId: selectedId,
				branchName:
					branches.find((branch) => Number(branch.value) === selectedId)?.label ??
					`Sucursal ${selectedId}`,
				stock: 0,
			}
		);
	}, [branchStockRows, branches, targetBranchId]);

	// Fetch de asignaciones al montar o al cambiar de producto
	useEffect(() => {
		if (subsidiaryId && product.id) {
			dispatch(fetchProductAllocations({ subsidiaryId, productId: product.id }));
		}
	}, [dispatch, subsidiaryId, product.id]);

	useEffect(() => {
		setBranchStockFallback(new Map());
	}, [product.id, subsidiaryId]);

	useEffect(() => {
		const shouldUseFallback =
			!isLoadingAllocations &&
			allocations.length === 0 &&
			branches.length > 0 &&
			Boolean(product.id);

		if (!shouldUseFallback) return;

		let isCancelled = false;
		const loadBranchStocks = async () => {
			setIsLoadingBranchFallback(true);
			try {
				const rows = await Promise.all(
					branches.map(async (branch) => {
						const branchId = Number(branch.value);
						if (!branchId) return { branchId: 0, stock: 0 };

						try {
							const response = await ApiService.fetchData({
								url: `/branches/${branchId}/products/${product.id}`,
								method: 'get',
							});

							const payload =
								(response.data as { data?: Record<string, unknown> } | undefined)
									?.data ??
								(response.data as Record<string, unknown> | undefined) ??
								{};
							const stock = Number(payload.stock ?? 0);
							return { branchId, stock: Number.isFinite(stock) ? stock : 0 };
						} catch {
							return { branchId, stock: 0 };
						}
					}),
				);

				if (isCancelled) return;
				setBranchStockFallback(
					new Map(
						rows
							.filter((row) => row.branchId > 0)
							.map((row) => [row.branchId, row.stock]),
					),
				);
			} finally {
				if (!isCancelled) setIsLoadingBranchFallback(false);
			}
		};

		void loadBranchStocks();

		return () => {
			isCancelled = true;
		};
	}, [allocations.length, branches, isLoadingAllocations, product.id]);

	return (
		<Card className='h-fit border border-amber-200 dark:border-amber-800'>
			<CardHeader className='flex items-start justify-between'>
				<div>
					<CardTitle className='text-lg'>{product.name}</CardTitle>
					<p className='text-xs text-zinc-500'>SKU: {product.sku}</p>
				</div>
				<Button
					color='zinc'
					variant='outline'
					size='sm'
					onClick={onClose}
					className='ml-2 shrink-0'>
					<Icon icon='DuoClose' className='h-4 w-4' />
				</Button>
			</CardHeader>
			<CardBody className='flex flex-col gap-4'>
				{/* Resumen del producto */}
				<div className='grid grid-cols-2 gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40'>
					<div>
						<p className='text-xs text-zinc-500'>Stock Total (Subsidiaria)</p>
						<p className='text-xl font-bold text-emerald-600'>
							{Number(product.stock ?? 0).toLocaleString('es-CL')}
						</p>
					</div>
					<div>
						<p className='text-xs text-zinc-500'>Precio</p>
						<p className='text-lg font-semibold'>
							${Number(product.price ?? 0).toLocaleString('es-CL')}
						</p>
					</div>
				</div>

				{/* Desglose por sucursal */}
				<div>
					<p className='mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
						Cuantos hay por sucursal
					</p>
					{isLoadingAllocations || isLoadingBranchFallback ? (
						<div className='flex flex-col gap-2'>
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className='h-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'
								/>
							))}
						</div>
					) : branchStockRows.length > 0 ? (
						<div className='flex flex-col gap-1'>
							{branchStockRows.map((row) => (
								<div
									key={row.branchId}
									className='flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-700'>
									<span className='text-zinc-600 dark:text-zinc-400'>
										{row.branchName}
									</span>
									<Badge
										variant='outline'
										color={row.stock > 0 ? 'emerald' : 'zinc'}>
										{row.stock.toLocaleString('es-CL')} uds
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className='text-xs text-zinc-400'>
							No hay asignaciones registradas para este producto.
						</p>
					)}
				</div>

				{/* Separador */}
				<hr className='border-zinc-200 dark:border-zinc-700' />

				{/* Fase 2: Selección de sucursal destino */}
				<div>
					<Label htmlFor='targetBranch' className='mb-1 block text-sm font-semibold'>
						Sucursal Destino del Ajuste
					</Label>
					<Select
						id='targetBranch'
						name='targetBranch'
						value={targetBranchId}
						onChange={(e) => onTargetBranchChange(e.target.value)}>
						<option value=''>— Selecciona una sucursal —</option>
						{branches.map((b) => (
							<option key={b.value} value={b.value}>
								{b.label}
							</option>
						))}
					</Select>
					{targetBranchId && selectedBranchStock && (
						<div className='mt-2 flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700'>
							<span className='text-zinc-600 dark:text-zinc-300'>
								Stock en {selectedBranchStock.branchName}
							</span>
							<Badge
								variant='outline'
								color={selectedBranchStock.stock > 0 ? 'emerald' : 'zinc'}>
								{selectedBranchStock.stock.toLocaleString('es-CL')} uds
							</Badge>
						</div>
					)}
				</div>

				{/* Botón Comenzar Ajuste (Habilitado solo en Fase 2+) */}
				<Button
					color='amber'
					variant='solid'
					className='w-full'
					isDisable={!targetBranchId}
					onClick={onStartAdjustment}>
					<Icon icon='DuoRocket' className='mr-2 h-5 w-5' />
					Comenzar Ajuste
				</Button>
			</CardBody>
		</Card>
	);
};
