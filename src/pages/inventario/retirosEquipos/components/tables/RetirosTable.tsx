import React from 'react';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { IEquipmentWithdrawalListItem } from '@/interface/equipmentWithdrawals.interface';
import { formatDate } from '@/utils/format.utils';
import StaleChip from '../parts/StaleChip';
import WithdrawalStatusBadge from '../parts/WithdrawalStatusBadge';

interface IRetirosTableProps {
	rows: IEquipmentWithdrawalListItem[];
	loading: boolean;
	pageCount: number;
	pageIndex: number;
	pageSize: number;
	onPageChange: (pageIndex: number) => void;
}

const columns: ColumnDef<IEquipmentWithdrawalListItem>[] = [
	{
		id: 'code',
		header: 'Código',
		accessorFn: (row) => row.code,
		cell: ({ row }) => (
			<div className='flex flex-col gap-1'>
				<span className='font-semibold'>{row.original.code}</span>
				{row.original.is_stale && <StaleChip className='w-fit' />}
			</div>
		),
	},
	{
		id: 'type',
		header: 'Tipo',
		accessorFn: (row) => row.type.label,
		cell: ({ getValue }) => <span>{getValue<string>()}</span>,
	},
	{
		id: 'customer_supplier',
		header: 'Cliente / Proveedor',
		accessorFn: (row) => row.customer_supplier.name,
	},
	{
		id: 'contact',
		header: 'Contacto',
		accessorFn: (row) => row.contact?.name ?? '',
		cell: ({ getValue }) =>
			getValue<string>() ? (
				<span>{getValue<string>()}</span>
			) : (
				<span className='text-zinc-400'>—</span>
			),
	},
	{
		id: 'branch',
		header: 'Sucursal',
		accessorFn: (row) => row.branch.name,
	},
	{
		id: 'status',
		header: 'Estado',
		accessorFn: (row) => row.status.value,
		cell: ({ row }) => <WithdrawalStatusBadge status={row.original.status} />,
	},
	{
		id: 'totals.items',
		header: 'Equipos',
		accessorFn: (row) => row.totals.items,
		cell: ({ getValue }) => <span className='tabular-nums'>{getValue<number>()}</span>,
	},
	{
		id: 'pending_return',
		header: 'Pend. devolución',
		accessorFn: (row) => row.totals.pending_return,
		cell: ({ row }) => {
			const { items, pending_return: pending, returned } = row.original.totals;
			const isLoan = row.original.type.value === 'loan';
			return (
				<div className='flex flex-col'>
					<span className='tabular-nums'>{pending}</span>
					{isLoan && returned > 0 && (
						<span className='text-xs text-zinc-500 dark:text-zinc-400'>
							{returned} de {items} devueltos
						</span>
					)}
				</div>
			);
		},
	},
	{
		id: 'created_at',
		header: 'Fecha',
		accessorFn: (row) => row.created_at,
		cell: ({ getValue }) => formatDate(getValue<string>()),
	},
];

/**
 * Listado de retiros (contrato §9): código, tipo, cliente-proveedor,
 * contacto, sucursal, estado, equipos, pendientes de devolución y fecha.
 */
const RetirosTable: React.FC<IRetirosTableProps> = ({
	rows,
	loading,
	pageCount,
	pageIndex,
	pageSize,
	onPageChange,
}) => {
	return (
		<DataTable
			columns={columns}
			data={rows}
			loading={loading}
			emptyMessage='Sin retiros para los filtros seleccionados'
			enableSearch={false}
			pageSize={pageSize}
			manualPagination
			pageCount={pageCount || 1}
			paginationState={{ pageIndex, pageSize } satisfies PaginationState}
			onPaginationChange={(updater) => {
				if (typeof updater === 'function') {
					onPageChange(updater({ pageIndex, pageSize }).pageIndex);
				} else {
					onPageChange(updater.pageIndex);
				}
			}}
		/>
	);
};

export default RetirosTable;
