import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';
import DataTable from '@/components/ui/DataTable/DataTable';

interface CustomersTableProps {
	customers: ICustomerSupplier[];
	onView: (c: ICustomerSupplier) => void;
	onEdit: (c: ICustomerSupplier) => void;
	onDelete: (c: ICustomerSupplier) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onView, onDelete }) => {
	const columns = useMemo<ColumnDef<ICustomerSupplier, any>[]>(
		() => [
			{
				header: 'Cliente',
				accessorKey: 'name',
				cell: ({ row }) => (
					<div>
						<div className='text-sm font-medium text-gray-900 dark:text-white'>
							{row.original.name}
						</div>
						<div className='text-xs text-gray-500'>ID: {row.original.id}</div>
					</div>
				),
			},
			{
				header: 'Creado',
				accessorKey: 'created_at',
				cell: ({ row }) => (
					<div className='text-xs text-gray-500'>
						{row.original.created_at
							? new Date(String(row.original.created_at)).toLocaleDateString('es-CO')
							: '-'}
					</div>
				),
			},
			{
				id: 'acciones',
				header: 'Acciones',
				cell: ({ row }) => (
					<div className='flex space-x-2'>
						<Button
							size='sm'
							variant='outline'
							onClick={() => onView(row.original)}
							className='text-blue-600 hover:text-blue-900'>
							<Icon icon='HeroEye' className='h-4 w-4' />
						</Button>
						<Button
							size='sm'
							variant='outline'
							onClick={() => onDelete(row.original)}
							className='text-red-600 hover:text-red-900'>
							<Icon icon='HeroTrash' className='h-4 w-4' />
						</Button>
					</div>
				),
			},
		],
		[onView, onDelete],
	);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle>Lista de Clientes-Proveedor</CardTitle>
					<span className='text-sm text-gray-500'>{customers.length} clientes</span>
				</div>
			</CardHeader>
			<CardBody className='p-0'>
				<DataTable<ICustomerSupplier>
					columns={columns}
					data={customers}
					loading={false}
					emptyMessage='No hay clientes'
					searchPlaceholder='Buscar cliente...'
				/>
			</CardBody>
		</Card>
	);
};

export default CustomersTable;
