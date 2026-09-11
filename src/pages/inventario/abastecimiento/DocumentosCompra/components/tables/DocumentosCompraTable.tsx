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
import { formatDate } from '@/utils/format.utils';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import type {
	IApiPaginationMeta,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';
import {
	DOCUMENT_RECEPTION_STATUS_LABELS,
	DOCUMENT_STATUS_LABELS,
	DOCUMENT_TYPE_LABELS,
} from '../../types';
import DocumentTypeBadge from '../parts/DocumentTypeBadge';
import DocumentStatusBadge from '../parts/DocumentStatusBadge';
import ReceptionStatusBadge from '../parts/ReceptionStatusBadge';

interface IDocumentosCompraTableProps {
	rows: IPurchaseDocumentListRow[];
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasActiveFilters: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onView: (id: number) => void;
}

const COLUMN_COUNT = 8;

type SortKey =
	| 'document_number'
	| 'document_type'
	| 'issue_date'
	| 'supplier'
	| 'total_amount'
	| 'status'
	| 'reception_status';
type SortState = TableSortState<SortKey>;

const getSortValue = (document: IPurchaseDocumentListRow, key: SortKey): string | number => {
	switch (key) {
		case 'document_number':
			return document.document_number;
		case 'document_type':
			return DOCUMENT_TYPE_LABELS[document.document_type];
		case 'issue_date':
			return document.issue_date;
		case 'supplier':
			return document.supplier?.display_name ?? '';
		case 'total_amount':
			return document.total_amount === null ? -Infinity : Number(document.total_amount);
		case 'status':
			return DOCUMENT_STATUS_LABELS[document.status];
		case 'reception_status':
			return document.reception_status
				? DOCUMENT_RECEPTION_STATUS_LABELS[document.reception_status]
				: '';
		default:
			return '';
	}
};

const compareRows = (
	left: IPurchaseDocumentListRow,
	right: IPurchaseDocumentListRow,
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

const DocumentosCompraPagination: React.FC<{
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

const DocumentosCompraTable: React.FC<IDocumentosCompraTableProps> = ({
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
				<CardTitle className='text-lg'>Documentos de compra</CardTitle>
				{!hasError && (
					<span className='text-sm text-zinc-500'>
						{meta?.total ?? rows.length} documentos
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table className='min-w-[1080px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Folio'
								sortKey='document_number'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Tipo'
								sortKey='document_type'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Emisión'
								sortKey='issue_date'
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
								label='Total'
								sortKey='total_amount'
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
							<SortableTableHeader
								label='Cobertura'
								sortKey='reception_status'
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
								<Tr key={`document-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`document-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
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
						{!loading && !hasError && rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasActiveFilters
											? 'Sin resultados para los filtros aplicados'
											: 'Aún no hay documentos de compra registrados'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasActiveFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'Los documentos aparecerán aquí cuando se registren.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((document) => (
								<Tr key={document.id}>
									<Td className='font-mono'>{document.document_number}</Td>
									<Td>
										<div className='flex justify-center'>
											<DocumentTypeBadge
												documentType={document.document_type}
											/>
										</div>
									</Td>
									<Td className='text-center'>
										{formatDate(document.issue_date)}
									</Td>
									<Td>
										{document.supplier ? (
											<div className='flex flex-col'>
												<span className='font-medium'>
													{document.supplier.display_name}
												</span>
												<span className='font-mono text-xs text-zinc-500'>
													{document.supplier.rut}
												</span>
											</div>
										) : (
											<span className='text-zinc-400'>Sin proveedor</span>
										)}
									</Td>
									<Td className='text-right'>
										{formatDecimalAmount(
											document.total_amount,
											document.currency_code,
										) ?? <span className='text-zinc-400'>—</span>}
									</Td>
									<Td>
										<div className='flex justify-center'>
											<DocumentStatusBadge status={document.status} />
										</div>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<ReceptionStatusBadge
												receptionStatus={document.reception_status}
											/>
										</div>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<Button
												size='sm'
												variant='outline'
												icon='HeroEye'
												color='violet'
												onClick={() => onView(document.id)}>
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
				<DocumentosCompraPagination
					meta={meta}
					loading={loading}
					onChange={onPaginationChange}
				/>
			)}
		</Card>
	);
};

export default DocumentosCompraTable;
