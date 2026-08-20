import React, { useMemo } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import Table, { TBody, Td, THead, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentListItem,
} from '@/interface/deferredPayments.interface';
import {
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
	DEFERRED_PAYMENT_STATUS_LABELS,
	formatDeferredPaymentAmount,
	formatDeferredPaymentDate,
} from '../../utils';
import DaysUntilDueBadge from '../badges/DaysUntilDueBadge';
import DeferredStatusPill from '../badges/DeferredStatusPill';

interface DeferredPaymentsTableProps {
	rows: IDeferredPaymentListItem[];
	meta: DeferredPaymentsPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	sort: DeferredPaymentsSortState;
	onSort: (key: DeferredPaymentsSortKey) => void;
	onPaginationChange: (page: number, perPage: number) => void;
	onRowClick: (id: number) => void;
}

interface DeferredPaymentsPaginationProps {
	meta: DeferredPaymentsPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}

export type DeferredPaymentsSortKey =
	| 'document_number'
	| 'company'
	| 'purchase_order'
	| 'total_amount'
	| 'outstanding_amount'
	| 'due_date'
	| 'status'
	| 'days_until_due';
export type DeferredPaymentsSortState = TableSortState<DeferredPaymentsSortKey>;

const getCustomerDisplayName = (row: IDeferredPaymentListItem): string =>
	row.customer.billing_company || row.customer.contact_name || 'Cliente sin nombre';

const getSortValue = (
	row: IDeferredPaymentListItem,
	key: DeferredPaymentsSortKey,
): string | number | null => {
	switch (key) {
		case 'document_number':
			return row.document_number;
		case 'company':
			return getCustomerDisplayName(row);
		case 'purchase_order':
			return row.purchase_order;
		case 'total_amount':
			return Number(row.total_amount);
		case 'outstanding_amount':
			return Number(row.outstanding_amount);
		case 'due_date':
			return row.due_date;
		case 'status':
			return DEFERRED_PAYMENT_STATUS_LABELS[row.status];
		case 'days_until_due':
			return row.status === 'paid' ? null : row.days_until_due;
		default:
			return null;
	}
};

const compareRows = (
	left: IDeferredPaymentListItem,
	right: IDeferredPaymentListItem,
	sort: NonNullable<DeferredPaymentsSortState>,
): number => {
	const leftValue = getSortValue(left, sort.key);
	const rightValue = getSortValue(right, sort.key);
	if (leftValue === null) return rightValue === null ? 0 : 1;
	if (rightValue === null) return -1;
	const comparison =
		typeof leftValue === 'number' && typeof rightValue === 'number'
			? leftValue - rightValue
			: String(leftValue).localeCompare(String(rightValue), 'es', {
					numeric: true,
					sensitivity: 'base',
				});
	return sort.direction === 'asc' ? comparison : -comparison;
};

const DeferredPaymentsPagination: React.FC<DeferredPaymentsPaginationProps> = ({
	meta,
	loading,
	onChange,
}) => {
	const pagination: PaginationState = {
		pageIndex: meta.current_page - 1,
		pageSize: meta.per_page,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: (updater) => {
			const pageSize = typeof updater === 'function' ? updater(pagination.pageSize) : updater;
			onChange(1, pageSize);
		},
		setPageIndex: (updater) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onChange(pageIndex + 1, pagination.pageSize);
		},
		getCanPreviousPage: () => pagination.pageIndex > 0,
		previousPage: () => onChange(Math.max(1, meta.current_page - 1), pagination.pageSize),
		getPageCount: () => meta.last_page,
		getCanNextPage: () => meta.current_page < meta.last_page,
		nextPage: () => onChange(meta.current_page + 1, pagination.pageSize),
	};

	return <TableCardFooterTemplateV2 table={table} isDisabled={loading} />;
};

const DeferredPaymentsTable: React.FC<DeferredPaymentsTableProps> = ({
	rows,
	meta,
	loading,
	hasError,
	hasFilters,
	sort,
	onSort,
	onPaginationChange,
	onRowClick,
}) => {
	const sortedRows = useMemo(
		() =>
			sort === null ? rows : [...rows].sort((left, right) => compareRows(left, right, sort)),
		[rows, sort],
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>Documentos por cobrar</CardTitle>
				{!hasError && (
					<span className='text-sm text-zinc-500'>
						{meta?.total ?? rows.length} documentos
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table className='min-w-[1150px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='N° documento'
								sortKey='document_number'
								sort={sort}
								onSort={onSort}
							/>
							<SortableTableHeader
								label='Empresa'
								sortKey='company'
								sort={sort}
								onSort={onSort}
							/>
							<SortableTableHeader
								label='OC'
								sortKey='purchase_order'
								sort={sort}
								onSort={onSort}
							/>
							<SortableTableHeader
								label='Monto'
								sortKey='total_amount'
								sort={sort}
								onSort={onSort}
								align='right'
							/>
							<SortableTableHeader
								label='Saldo'
								sortKey='outstanding_amount'
								sort={sort}
								onSort={onSort}
								align='right'
							/>
							<SortableTableHeader
								label='Vencimiento'
								sortKey='due_date'
								sort={sort}
								onSort={onSort}
							/>
							<SortableTableHeader
								label='Estado del pago'
								sortKey='status'
								sort={sort}
								onSort={onSort}
								align='center'
							/>
							<SortableTableHeader
								label='Situación de vencimiento'
								sortKey='days_until_due'
								sort={sort}
								onSort={onSort}
								align='center'
							/>
						</Tr>
					</THead>
					<TBody>
						{!loading && hasError && (
							<Tr>
								<Td colSpan={8} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar los documentos
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										Revisa el mensaje de error e intenta cargar la información
										nuevamente.
									</p>
								</Td>
							</Tr>
						)}
						{loading &&
							Array.from({ length: 5 }, (_, index) => (
								<Tr key={`skeleton-${index}`}>
									{Array.from({ length: 8 }, (__, cellIndex) => (
										<Td key={`skeleton-${index}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && !hasError && rows.length === 0 && (
							<Tr>
								<Td colSpan={8} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasFilters
											? 'Sin resultados para los filtros aplicados'
											: 'A\u00FAn no hay documentos de pago diferido'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'Los documentos aparecer\u00E1n aqu\u00ED cuando sean registrados.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((row) => (
								<Tr
									key={row.id}
									role='button'
									tabIndex={0}
									aria-label={`Abrir detalle del documento ${row.document_number}`}
									onClick={() => onRowClick(row.id)}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											onRowClick(row.id);
										}
									}}
									className={`cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
										row.is_overdue ? 'border-l-4 border-red-500' : ''
									}`}>
									<Td>
										<p className='font-medium'>{row.document_number}</p>
										<p className='text-xs text-zinc-500'>
											{
												DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS[
													row.document_type
												]
											}
										</p>
									</Td>
									<Td>
										<p className='font-medium'>
											{row.customer.billing_company ||
												row.customer.contact_name ||
												'Cliente sin nombre'}
										</p>
										<p className='text-xs text-zinc-500'>{row.customer.rut}</p>
									</Td>
									<Td>{row.purchase_order ?? '\u2014'}</Td>
									<Td className='text-right tabular-nums'>
										{formatDeferredPaymentAmount(row.total_amount)}
									</Td>
									<Td className='text-right font-semibold tabular-nums'>
										{formatDeferredPaymentAmount(row.outstanding_amount)}
									</Td>
									<Td>{formatDeferredPaymentDate(row.due_date)}</Td>
									<Td>
										<div className='flex justify-center'>
											<DeferredStatusPill status={row.status} />
										</div>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<DaysUntilDueBadge
												daysUntilDue={
													row.status === 'paid'
														? null
														: row.days_until_due
												}
												isOverdue={row.is_overdue}
											/>
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{meta && (
				<DeferredPaymentsPagination
					meta={meta}
					loading={loading}
					onChange={onPaginationChange}
				/>
			)}
		</Card>
	);
};

export default React.memo(DeferredPaymentsTable);
