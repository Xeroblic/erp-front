import React, { useCallback, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import useCan from '@/hooks/useCan';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleProductStatus } from '@/store/slices/products/productsSlice';
import type { IProduct, ProductListMeta } from '@/interface/product.interface';
import { useProductColumns } from './useProductColumns';
import ProductVariantsRow from './ProductVariantsRow';
import { extractProductVariants } from './productTable.utils';

interface ProductsTableProps {
	products: IProduct[];
	meta: ProductListMeta;
	loading?: boolean;
	onView?: (product: IProduct) => void;
	onDelete: (product: IProduct) => void;
	subsidiaryId?: number | null;
	onRefresh?: () => Promise<void> | void;
}

const TableSkeleton: React.FC = () => (
	<>
		{Array.from({ length: 3 }).map((_, index) => (
			<tr key={index}>
				<td colSpan={8} className='px-6 py-4'>
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

const TableEmpty: React.FC = () => (
	<tr>
		<td colSpan={8} className='px-6 py-12'>
			<div className='flex flex-col items-center justify-center gap-3 text-center'>
				<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
					<Icon icon='HeroInboxStack' className='h-8 w-8 text-zinc-400' />
				</div>
				<div>
					<p className='font-medium text-zinc-900 dark:text-zinc-100'>
						No se encontraron productos
					</p>
					<p className='text-sm text-zinc-500'>Intenta ajustar los filtros de búsqueda</p>
				</div>
			</div>
		</td>
	</tr>
);

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
				toast.error(
					'No se pudo resolver la subsidiaria para cambiar el estado del producto',
				);
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

	const columns = useProductColumns({
		isAdmin,
		subsidiaryId,
		isUpdating,
		onToggleStatus: handleToggleStatus,
		onView,
		onDelete,
	});

	const table = useReactTable({
		data: products,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});
	const columnCount = Math.max(1, table.getVisibleFlatColumns().length);

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
							{loading ? (
								<TableSkeleton />
							) : products.length === 0 ? (
								<TableEmpty />
							) : (
								table.getRowModel().rows.map((row) => {
									const product = row.original;
									const isExpanded = Boolean(expandedRows[product.id]);
									const childVariants = extractProductVariants(product);
									const hasVariants = childVariants.length > 0;
									// Filas con variantes son clicables (expanden): hover azul
									// claramente visible en claro y oscuro para señalar interacción.
									// El resto: hover zinc sutil, sin cursor pointer.
									const rowClasses = hasVariants
										? 'cursor-pointer hover:bg-blue-500/20 dark:hover:bg-blue-500/20'
										: 'cursor-default hover:bg-zinc-100 dark:hover:bg-zinc-800/60';

									return (
										<React.Fragment key={row.id}>
											<tr
												className={`${rowClasses}`}
												onClick={() =>
													hasVariants && toggleExpand(product.id)
												}>
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
												<ProductVariantsRow
													product={product}
													childVariants={childVariants}
													colSpan={columnCount}
													onView={onView}
												/>
											)}
										</React.Fragment>
									);
								})
							)}
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
