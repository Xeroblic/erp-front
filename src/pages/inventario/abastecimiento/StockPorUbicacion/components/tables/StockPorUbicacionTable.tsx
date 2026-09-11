import { useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import { ProductCard, WarehouseLabel } from '@/components/procurement';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	IApiPaginationMeta,
	IInventoryLocationContext,
	IInventoryStockRow,
} from '@/interface/procurement.interface';

const COLUMN_COUNT = 6;

type SortKey =
	| 'product'
	| 'physical_quantity'
	| 'fit_quantity'
	| 'unfit_quantity'
	| 'documented_quantity'
	| 'undocumented_quantity';
type SortState = TableSortState<SortKey>;

const getSortValue = (row: IInventoryStockRow, key: SortKey): string | number => {
	switch (key) {
		case 'product':
			return row.product.name;
		default:
			return row[key];
	}
};

const compareRows = (
	left: IInventoryStockRow,
	right: IInventoryStockRow,
	sort: NonNullable<SortState>,
): number => {
	const leftValue = getSortValue(left, sort.key);
	const rightValue = getSortValue(right, sort.key);
	const comparison =
		typeof leftValue === 'number' && typeof rightValue === 'number'
			? leftValue - rightValue
			: String(leftValue).localeCompare(String(rightValue), 'es', {
					numeric: true,
					sensitivity: 'base',
				});
	return sort.direction === 'asc' ? comparison : -comparison;
};

interface IStockPorUbicacionTableProps {
	rows: IInventoryStockRow[];
	context: IInventoryLocationContext | null;
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onRowClick: (row: IInventoryStockRow) => void;
}

const StockPorUbicacionPagination = ({
	meta,
	loading,
	onChange,
}: {
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}) => {
	const pagination: PaginationState = {
		pageIndex: Math.max(0, meta.current_page - 1),
		pageSize: meta.per_page,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: (updater: Updater<number>) => {
			const perPage = typeof updater === 'function' ? updater(pagination.pageSize) : updater;
			onChange(1, perPage);
		},
		setPageIndex: (updater: Updater<number>) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onChange(Math.min(Math.max(1, pageIndex + 1), meta.last_page), pagination.pageSize);
		},
		getCanPreviousPage: () => meta.current_page > 1,
		previousPage: () => onChange(Math.max(1, meta.current_page - 1), pagination.pageSize),
		getPageCount: () => meta.last_page,
		getCanNextPage: () => meta.current_page < meta.last_page,
		nextPage: () => onChange(meta.current_page + 1, pagination.pageSize),
	};

	return <TableCardFooterTemplateV2 table={table} isDisabled={loading} />;
};

const StockPorUbicacionTable = ({
	rows,
	context,
	meta,
	loading,
	hasError,
	hasFilters,
	onPaginationChange,
	onRowClick,
}: IStockPorUbicacionTableProps) => {
	const [sort, setSort] = useState<SortState>(null);
	const sortedRows = useMemo(
		() =>
			sort === null ? rows : [...rows].sort((left, right) => compareRows(left, right, sort)),
		[rows, sort],
	);
	const handleSort = (key: SortKey) => {
		setSort((current) => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>Stock físico</CardTitle>
				<div className='flex flex-wrap items-center gap-3'>
					{context && !loading && (
						<span className='text-sm text-zinc-500'>
							Sucursal {context.branch_id} ·{' '}
							{context.scope === 'branch' ? (
								'Sucursal completa'
							) : (
								<WarehouseLabel warehouse={context.warehouse} withIcon={false} />
							)}
						</span>
					)}
					{!hasError && (
						<span className='text-sm text-zinc-500'>
							{meta?.total ?? rows.length} productos
						</span>
					)}
				</div>
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label='Stock físico por ubicación' className='min-w-[900px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Producto'
								sortKey='product'
								sort={sort}
								onSort={handleSort}
								align='center'
								scope='col'
								rowSpan={2}
							/>
							<SortableTableHeader
								label='Físico'
								sortKey='physical_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
								scope='col'
								rowSpan={2}
							/>
							<Th scope='colgroup' colSpan={2} className='text-center'>
								Condición
							</Th>
							<Th scope='colgroup' colSpan={2} className='text-center'>
								Documentación
							</Th>
						</Tr>
						<Tr>
							<SortableTableHeader
								label='Apto'
								sortKey='fit_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='No apto'
								sortKey='unfit_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Documentado'
								sortKey='documented_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Sin documento'
								sortKey='undocumented_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 5 }, (_, rowIndex) => (
								<Tr key={`stock-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`stock-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar el stock
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										Revisa el mensaje de error e intenta cargar la información
										nuevamente.
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasFilters
											? 'Sin resultados para esta ubicación o búsqueda'
											: 'Aún no hay stock registrado en esta ubicación'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'El stock aparecerá aquí cuando haya movimientos.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((row) => (
								<Tr
									key={row.product.id}
									role='button'
									tabIndex={0}
									aria-label={`Ver detalle de ${row.product.name}`}
									onClick={() => onRowClick(row)}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											onRowClick(row);
										}
									}}
									className='cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'>
									<Td>
										<ProductCard
											product={row.product}
											density='compact'
											showCatalogPricing={false}
										/>
									</Td>
									<Td className='text-lg font-semibold tabular-nums'>
										{row.physical_quantity}
									</Td>
									<Td className='tabular-nums'>{row.fit_quantity}</Td>
									<Td
										className={
											row.unfit_quantity > 0
												? 'font-semibold text-amber-700 dark:text-amber-300'
												: ''
										}>
										{row.unfit_quantity}
									</Td>
									<Td className='border-l border-zinc-200 tabular-nums dark:border-zinc-700'>
										{row.documented_quantity}
									</Td>
									<Td className='tabular-nums'>{row.undocumented_quantity}</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{meta && !hasError && (
				<StockPorUbicacionPagination
					meta={meta}
					loading={loading}
					onChange={onPaginationChange}
				/>
			)}
		</Card>
	);
};

export default StockPorUbicacionTable;
