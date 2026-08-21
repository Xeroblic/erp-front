import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import type { IProduct } from '@/interface/product.interface';
import type { CriticalItemRow } from './inventoryTab.types';
import { formatNumber, getFriendlyDate } from './inventoryTab.utils';

interface InventoryCriticalSectionProps {
	criticalItems: CriticalItemRow[];
	totalCriticalCount: number;
	loading: boolean;
	criticalSearch: string;
	showOnlyOutOfStock: boolean;
	onCriticalSearchChange: (value: string) => void;
	onToggleOutOfStock: () => void;
	onViewProduct?: (product: IProduct) => void;
	containerRef?: React.RefObject<HTMLDivElement | null>;
}

const InventoryCriticalSection: React.FC<InventoryCriticalSectionProps> = ({
	criticalItems,
	totalCriticalCount,
	loading,
	criticalSearch,
	showOnlyOutOfStock,
	onCriticalSearchChange,
	onToggleOutOfStock,
	onViewProduct,
	containerRef,
}) => {
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
				cell: ({ row }) => (
					<span className='text-sm font-semibold text-neutral-700 dark:text-neutral-200'>
						{formatNumber(row.original.stock)}
					</span>
				),
			},
			{
				id: 'status',
				header: 'Estado',
				cell: ({ row }) => {
					const { status, stock } = row.original;
					const label =
						status === 'out' ? 'Sin stock' : `Stock bajo (${formatNumber(stock)})`;
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

	return (
		<div ref={containerRef}>
			<Card className='border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Productos con stock crítico</CardTitle>
					</CardHeaderChild>
					{!loading ? (
						<CardHeaderChild>
							<Badge variant='outline' color='red'>
								{totalCriticalCount} producto{totalCriticalCount === 1 ? '' : 's'}
							</Badge>
						</CardHeaderChild>
					) : null}
				</CardHeader>
				<CardBody>
					{totalCriticalCount > 0 && !loading && (
						<div className='mb-4 flex flex-wrap items-center gap-3'>
							<div className='relative w-full max-w-xs'>
								<Input
									id='critical-search'
									name='critical-search'
									placeholder='Buscar por nombre, SKU o marca...'
									value={criticalSearch}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										onCriticalSearchChange(e.target.value)
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
								onClick={onToggleOutOfStock}
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

export default InventoryCriticalSection;
