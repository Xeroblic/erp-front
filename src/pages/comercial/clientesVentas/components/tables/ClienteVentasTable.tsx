import React, { useMemo, useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import type { ICustomerSaleOverview } from '@/interface/customerSales.interface';
import type { PaginationMeta } from '@/services/salesService';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';

interface ClienteVentasTableProps {
	rows: ICustomerSaleOverview[];
	meta: PaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasSearch: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onDelete: (id: number) => void;
	onView: (id: number) => void;
	branchId?: number | null;
	subsidiaryId?: number | null;
}

interface ClientesVentasPaginationProps {
	meta: PaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}

type SortKey = 'name' | 'rut' | 'loyalty' | 'total_sales' | 'is_active';
type SortState = TableSortState<SortKey>;

const getLoyaltyColor = (loyalty: number): 'green' | 'yellow' | 'red' => {
	if (loyalty > 60) return 'green';
	if (loyalty > 30) return 'yellow';
	return 'red';
};

const getSortValue = (customer: ICustomerSaleOverview, key: SortKey): string | number => {
	switch (key) {
		case 'name':
			return customer.name;
		case 'rut':
			return customer.rut;
		case 'loyalty':
			return customer.loyalty;
		case 'total_sales':
			return customer.total_sales;
		case 'is_active':
			return Number(customer.is_active);
		default:
			return '';
	}
};

const compareRows = (
	left: ICustomerSaleOverview,
	right: ICustomerSaleOverview,
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

const ClientesVentasPagination: React.FC<ClientesVentasPaginationProps> = ({
	meta,
	loading,
	onChange,
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

const ClienteVentasTable: React.FC<ClienteVentasTableProps> = ({
	rows,
	meta,
	loading,
	hasError,
	hasSearch,
	onPaginationChange,
	onDelete,
	onView,
	branchId,
	subsidiaryId,
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
				<CardTitle className='text-lg'>Clientes de ventas</CardTitle>
				{!hasError && (
					<span className='text-sm text-zinc-500'>
						{meta?.total ?? rows.length} clientes
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table className='min-w-[980px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Nombre'
								sortKey='name'
								sort={sort}
								onSort={handleSort}
							/>
							<SortableTableHeader
								label='RUT'
								sortKey='rut'
								sort={sort}
								onSort={handleSort}
							/>
							<Th>Contacto</Th>
							<SortableTableHeader
								label='Fidelidad'
								sortKey='loyalty'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<SortableTableHeader
								label='Total ventas'
								sortKey='total_sales'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<SortableTableHeader
								label='Estado'
								sortKey='is_active'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<Th>Acciones</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 5 }, (_, rowIndex) => (
								<Tr key={`customer-skeleton-${rowIndex}`}>
									{Array.from({ length: 7 }, (_cell, cellIndex) => (
										<Td key={`customer-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={7} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar los clientes
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && rows.length === 0 && (meta?.total ?? 0) === 0 && (
							<Tr>
								<Td colSpan={7} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasSearch
											? 'Sin resultados para la búsqueda aplicada'
											: 'Aún no hay clientes registrados'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasSearch
											? 'Prueba ajustando o limpiando la búsqueda.'
											: 'Los clientes aparecerán aquí cuando sean registrados.'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((customer) => (
								<Tr key={customer.id}>
									<Td className='font-medium'>{customer.name}</Td>
									<Td className='font-mono'>{customer.rut}</Td>
									<Td>
										{customer.contact ? (
											<div className='flex flex-col text-sm'>
												<span>{customer.contact.name}</span>
												<span className='text-xs text-zinc-500'>
													{customer.contact.email}
												</span>
												<span className='text-xs text-zinc-500'>
													{customer.contact.phone}
												</span>
											</div>
										) : (
											<span className='text-zinc-400'>Sin datos</span>
										)}
									</Td>
									<Td>
										<div className='flex justify-center'>
											<Badge
												color={getLoyaltyColor(customer.loyalty)}
												variant='solid'>
												{customer.loyalty}%
											</Badge>
										</div>
									</Td>
									<Td className='text-right font-semibold tabular-nums'>
										${customer.total_sales.toLocaleString('es-CL')}
									</Td>
									<Td>
										<div className='flex justify-center'>
											<Badge
												color={customer.is_active ? 'green' : 'red'}
												variant='solid'>
												{customer.is_active ? 'Activo' : 'Inactivo'}
											</Badge>
										</div>
									</Td>
									<Td>
										<div className='flex gap-2'>
											<Button
												size='sm'
												variant='outline'
												icon='HeroEye'
												color='violet'
												onClick={() => onView(customer.id)}>
												Ver
											</Button>
											<ProtectedButton
												permission={ERP_PERMISSIONS.CUSTOMER_SALES.DELETE}
												branchId={branchId}
												subsidiaryId={subsidiaryId}
												scope='access'
												size='sm'
												variant='outline'
												icon='HeroTrash'
												color='red'
												onClick={() => onDelete(customer.id)}>
												Eliminar
											</ProtectedButton>
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
			{meta && !hasError && (
				<ClientesVentasPagination
					meta={meta}
					loading={loading}
					onChange={onPaginationChange}
				/>
			)}
		</Card>
	);
};

export default ClienteVentasTable;
