import React, { useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import { WarehouseLabel } from '@/components/procurement';
import { formatDate } from '@/utils/format.utils';
import type { IApiPaginationMeta, IStockReceiptListRow } from '@/interface/procurement.interface';
import { STOCK_RECEIPT_STATUS_LABELS } from '../../types';
import StockReceiptStatusBadge from '../parts/StockReceiptStatusBadge';

interface IRecepcionesTableProps {
	rows: IStockReceiptListRow[];
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasActiveFilters: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onView: (id: number) => void;
}

const COLUMN_COUNT = 7;

type SortKey = 'id' | 'warehouse' | 'supplier' | 'purchase_document' | 'total_quantity' | 'status';
type SortState = TableSortState<SortKey>;

const getSortValue = (receipt: IStockReceiptListRow, key: SortKey): string | number => {
	switch (key) {
		case 'id':
			return receipt.id;
		case 'warehouse':
			return receipt.warehouse.name;
		case 'supplier':
			return receipt.supplier?.display_name ?? '';
		case 'purchase_document':
			return receipt.purchase_document?.document_number ?? '';
		case 'total_quantity':
			return receipt.total_quantity;
		case 'status':
			return STOCK_RECEIPT_STATUS_LABELS[receipt.status];
		default:
			return '';
	}
};

const compareRows = (
	left: IStockReceiptListRow,
	right: IStockReceiptListRow,
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

const RecepcionesPagination: React.FC<{
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}> = ({ meta, loading, onChange }) => {
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

const RecepcionesTable: React.FC<IRecepcionesTableProps> = ({
	rows,
	meta,
	loading,
	hasError,
	hasActiveFilters,
	onPaginationChange,
	onView,
}) => {
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
				<CardTitle className='text-lg'>Recepciones</CardTitle>
				{!hasError && (
					<span className='text-sm text-zinc-500'>
						{meta?.total ?? rows.length} recepciones
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table className='min-w-[1080px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Recepción'
								sortKey='id'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Bodega'
								sortKey='warehouse'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Proveedor'
								sortKey='supplier'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Documento'
								sortKey='purchase_document'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Cantidad'
								sortKey='total_quantity'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Estado'
								sortKey='status'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<Th className='text-center'>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 5 }, (_, rowIndex) => (
								<Tr key={`recepcion-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`recepcion-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar las recepciones
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
										{hasActiveFilters
											? 'Sin resultados para los filtros aplicados'
											: 'Aún no hay recepciones registradas'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasActiveFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'Las recepciones aparecerán aquí cuando se registren.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((receipt) => (
								<Tr key={receipt.id}>
									<Td>
										<div className='flex flex-col items-center text-center'>
											<span className='font-medium'>#{receipt.id}</span>
											<span className='text-xs text-zinc-500'>
												{formatDate(receipt.received_on)}
											</span>
										</div>
									</Td>
									<Td>
										<WarehouseLabel warehouse={receipt.warehouse} />
									</Td>
									<Td>
										{receipt.supplier ? (
											<div className='flex flex-col'>
												<span className='font-medium'>
													{receipt.supplier.display_name}
												</span>
												<span className='font-mono text-xs text-zinc-500'>
													{receipt.supplier.rut}
												</span>
											</div>
										) : (
											<span className='text-zinc-400'>Sin proveedor</span>
										)}
									</Td>
									<Td>
										{receipt.purchase_document ? (
											<span className='font-mono text-sm'>
												{receipt.purchase_document.document_number}
											</span>
										) : (
											<span className='text-zinc-400'>Sin documento</span>
										)}
									</Td>
									<Td className='text-right tabular-nums'>
										{receipt.total_quantity}
									</Td>
									<Td>
										<div className='flex justify-center'>
											<StockReceiptStatusBadge status={receipt.status} />
										</div>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<Button
												size='sm'
												variant='outline'
												icon='HeroEye'
												color='violet'
												onClick={() => onView(receipt.id)}>
												Ver
											</Button>
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{meta && !hasError && (
				<RecepcionesPagination
					meta={meta}
					loading={loading}
					onChange={onPaginationChange}
				/>
			)}
		</Card>
	);
};

export default RecepcionesTable;
