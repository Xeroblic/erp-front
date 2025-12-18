import React from 'react';
import { ColumnDef, PaginationState, OnChangeFn } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ICustomerSaleOverview } from '@/interface/customerSales.interface';
import type { PaginationMeta } from '@/services/salesService';
import Icon from '@/components/icon/Icon';

interface Props {
	data: ICustomerSaleOverview[];
	loading?: boolean;
	meta?: PaginationMeta | null;
	pagination?: PaginationState;
	onPaginationChange?: OnChangeFn<PaginationState>;
	onDelete?: (id: number) => void;
	onView?: (id: number) => void;
}

const ClienteVentasTable: React.FC<Props> = ({
	data,
	loading = false,
	meta = null,
	pagination = { pageIndex: 0, pageSize: 5 },
	onPaginationChange,
	onDelete,
	onView,
}) => {
	const columns: ColumnDef<ICustomerSaleOverview>[] = [
		{
			accessorKey: 'name',
			header: 'Nombre',
			cell: ({ row }) => <div className='font-semibold'>{row.original.name}</div>,
		},
		{
			accessorKey: 'rut',
			header: 'RUT',
			cell: ({ row }) => <span className='font-mono'>{row.original.rut}</span>,
		},
		{
			accessorKey: 'contact',
			header: 'Contacto',
			cell: ({ row }) => {
				const c = row.original.contact;
				if (!c) return <span className='text-gray-400'>Sin datos</span>;
				return (
					<div className='flex flex-col text-sm'>
						<span>{c.name}</span>
						<span className='text-xs text-gray-400'>{c.email}</span>
						<span className='text-xs text-gray-400'>{c.phone}</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'loyalty',
			header: 'Fidelidad',
			cell: ({ row }) => {
				const val = row.original.loyalty;
				return (
					<Badge color={val > 60 ? 'green' : val > 30 ? 'yellow' : 'red'} variant='solid'>
						{val}%
					</Badge>
				);
			},
		},
		{
			accessorKey: 'total_sales',
			header: 'Total Ventas',
			cell: ({ row }) => (
				<div className='font-semibold'>
					${row.original.total_sales.toLocaleString('es-CL')}
				</div>
			),
		},
		{
			accessorKey: 'is_active',
			header: 'Estado',
			cell: ({ row }) => (
				<Badge color={row.original.is_active ? 'green' : 'red'} variant='solid'>
					{row.original.is_active ? 'Activo' : 'Inactivo'}
				</Badge>
			),
		},
		// OPCIONAL ACCIONES
		{
			id: 'acciones',
			header: 'Acciones',
			cell: ({ row }) => (
				<div className='flex gap-2'>
					<Button
						size='sm'
						variant='outline'
						icon='HeroEye'
						color='violet'
						className='bg-violet-400/20'
						onClick={() => onView?.(row.original.id)}>
						Ver
					</Button>
					<Button
						size='sm'
						variant='outline'
						icon='HeroTrash'
						color='red'
						className='bg-red-400/20'
						onClick={() => onDelete?.(row.original.id)}>
						Eliminar
					</Button>
				</div>
			),
		},
	];

	return (
		<DataTable<ICustomerSaleOverview>
			columns={columns}
			data={data}
			loading={loading}
			searchPlaceholder='Buscar cliente, RUT o contacto...'
			emptyMessage='No hay clientes registrados'
			manualPagination={!!meta}
			pageCount={meta?.last_page ?? 1}
			paginationState={pagination}
			onPaginationChange={onPaginationChange}
		/>
	);
};

export default ClienteVentasTable;
