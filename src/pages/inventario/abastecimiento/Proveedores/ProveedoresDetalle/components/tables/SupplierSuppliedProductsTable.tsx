import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PaginationState, Updater } from '@tanstack/react-table';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import ProductCard from '@/components/procurement/ProductCard';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import { formatDate } from '@/utils/format.utils';
import { COST_EFFECTIVE_BASIS_LABELS } from '@/utils/procurementCost.util';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import type { IProcurementCost } from '@/interface/procurement.interface';
import type { ISupplierSuppliedProductRow } from '../../types';

/**
 * «Productos suministrados» de la ficha de proveedor. Mismo diseño que
 * `ProveedoresTable` (cabeceras ordenables, esqueleto, estados vacío/error y
 * `TableCardFooterTemplateV2`), pero ordena y pagina en el cliente: las filas
 * son una agregación local de recepciones, no un listado paginado del
 * servidor (ver `ISupplierSuppliedProductRow`).
 *
 * El último costo no es ordenable a propósito: cada fila puede venir en base
 * neta, bruta o mixta, y ordenar esos importes juntos los compararía como si
 * fueran equivalentes.
 */

interface ISupplierSuppliedProductsTableProps {
	rows: ISupplierSuppliedProductRow[];
	loading: boolean;
	error: string | null;
	subsidiaryId: number | null;
	onRetry: () => void;
}

const COLUMN_COUNT = 5;
const DEFAULT_PAGE_SIZE = 10;

type SortKey = 'product' | 'receipt_count' | 'total_units_received' | 'last_purchase';
type SortState = TableSortState<SortKey>;

const compareRows = (
	left: ISupplierSuppliedProductRow,
	right: ISupplierSuppliedProductRow,
	sort: NonNullable<SortState>,
): number => {
	let comparison = 0;
	switch (sort.key) {
		case 'product':
			comparison = left.product.name.localeCompare(right.product.name, 'es', {
				numeric: true,
				sensitivity: 'base',
			});
			break;
		case 'receipt_count':
			comparison = left.receipt_count - right.receipt_count;
			break;
		case 'total_units_received':
			comparison = left.total_units_received - right.total_units_received;
			break;
		case 'last_purchase':
			comparison =
				left.last_purchase.received_on.localeCompare(right.last_purchase.received_on) ||
				left.last_purchase.stock_receipt_id - right.last_purchase.stock_receipt_id;
			break;
		default:
			comparison = 0;
	}
	return sort.direction === 'asc' ? comparison : -comparison;
};

/** Un costo sin importe se dice desconocido, nunca `$0` (mismo criterio que `CostBlock`). */
const LastCostCell: React.FC<{ cost: IProcurementCost | null }> = ({ cost }) => {
	if (cost === null) return <span className='text-sm italic text-zinc-500'>Varias líneas</span>;

	const amount = formatDecimalAmount(cost.effective_unit_amount, cost.currency_code);
	if (amount === null) return <span className='text-sm italic text-zinc-500'>Desconocido</span>;

	return (
		<div className='flex flex-col items-center'>
			<span className='font-medium tabular-nums'>{amount}</span>
			<span className='text-xs text-zinc-500'>
				{COST_EFFECTIVE_BASIS_LABELS[cost.effective_basis]}
			</span>
		</div>
	);
};

const SupplierSuppliedProductsTable: React.FC<ISupplierSuppliedProductsTableProps> = ({
	rows,
	loading,
	error,
	subsidiaryId,
	onRetry,
}) => {
	const [sort, setSort] = useState<SortState>(null);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	const sortedRows = useMemo(
		() =>
			sort === null ? rows : [...rows].sort((left, right) => compareRows(left, right, sort)),
		[rows, sort],
	);

	// La página se acota contra las filas actuales: si una recarga trae menos
	// productos, no se queda mostrando una página que ya no existe.
	const pageCount = Math.max(1, Math.ceil(sortedRows.length / pagination.pageSize));
	const current: PaginationState = {
		pageIndex: Math.min(pagination.pageIndex, pageCount - 1),
		pageSize: pagination.pageSize,
	};
	const pageRows = sortedRows.slice(
		current.pageIndex * current.pageSize,
		(current.pageIndex + 1) * current.pageSize,
	);

	const goToPage = (pageIndex: number) =>
		setPagination({ ...current, pageIndex: Math.min(Math.max(0, pageIndex), pageCount - 1) });

	const table: TablePaginationController = {
		getState: () => ({ pagination: current }),
		setPageSize: (updater: Updater<number>) => {
			const pageSize = typeof updater === 'function' ? updater(current.pageSize) : updater;
			setPagination({ pageIndex: 0, pageSize });
		},
		setPageIndex: (updater: Updater<number>) =>
			goToPage(typeof updater === 'function' ? updater(current.pageIndex) : updater),
		getCanPreviousPage: () => current.pageIndex > 0,
		previousPage: () => goToPage(current.pageIndex - 1),
		getPageCount: () => pageCount,
		getCanNextPage: () => current.pageIndex < pageCount - 1,
		nextPage: () => goToPage(current.pageIndex + 1),
	};

	const handleSort = (key: SortKey) => {
		setSort((previous) => ({
			key,
			direction: previous?.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
		}));
		setPagination((previous) => ({ ...previous, pageIndex: 0 }));
	};

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle className='text-lg'>Productos suministrados</CardTitle>
					<p className='text-sm text-zinc-500'>
						Según recepciones contabilizadas; las revertidas no cuentan.
					</p>
				</div>
				{!loading && !error && (
					<span className='text-sm text-zinc-500'>
						{rows.length} {rows.length === 1 ? 'producto' : 'productos'}
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table className='min-w-[860px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Producto'
								sortKey='product'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Recepciones'
								sortKey='receipt_count'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Unidades recibidas'
								sortKey='total_units_received'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Última compra'
								sortKey='last_purchase'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<Th className='text-center'>Último costo efectivo</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 3 }, (_, rowIndex) => (
								<Tr key={`supplied-product-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td
											key={`supplied-product-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && error && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										{error}
									</p>
									<div className='mt-3 flex justify-center'>
										<Button size='sm' variant='outline' onClick={onRetry}>
											Reintentar
										</Button>
									</div>
								</Td>
							</Tr>
						)}
						{!loading && !error && rows.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										Este proveedor aún no tiene recepciones contabilizadas
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										Los productos aparecerán aquí cuando se contabilice una
										recepción suya.
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!error &&
							pageRows.map((row) => (
								<Tr key={row.product.id}>
									<Td>
										<ProductCard
											product={row.product}
											density='compact'
											showCatalogPricing={false}
										/>
									</Td>
									<Td className='text-center tabular-nums'>
										{row.receipt_count.toLocaleString('es-CL')}
									</Td>
									<Td className='text-center tabular-nums'>
										{row.total_units_received.toLocaleString('es-CL')}
									</Td>
									<Td>
										<div className='flex flex-col items-center text-sm'>
											<span>{formatDate(row.last_purchase.received_on)}</span>
											<span className='text-xs text-zinc-500'>
												{row.last_purchase.quantity.toLocaleString('es-CL')}{' '}
												u.
												{row.last_purchase.purchase_document
													? ` · Doc. N° ${row.last_purchase.purchase_document.document_number}`
													: ' · Sin documento'}
											</span>
											<PermissionGuard
												permission='view-product'
												branchId={row.last_purchase.branch_id}
												subsidiaryId={subsidiaryId}
												scope='visible'>
												<Link
													to={`/inventario/abastecimiento/recepciones/${row.last_purchase.stock_receipt_id}`}
													className='text-xs text-blue-600 hover:underline dark:text-blue-400'>
													Ver recepción #
													{row.last_purchase.stock_receipt_id}
												</Link>
											</PermissionGuard>
										</div>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<LastCostCell cost={row.last_purchase.cost} />
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{!loading && !error && rows.length > 0 && (
				<TableCardFooterTemplateV2 table={table} isDisabled={loading} />
			)}
		</Card>
	);
};

export default SupplierSuppliedProductsTable;
