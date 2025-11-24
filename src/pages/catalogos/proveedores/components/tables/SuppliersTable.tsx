import React, { useMemo } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ISupplier } from '@/interface/supplier.interface';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

type SuppliersTableProps = {
	suppliers: ISupplier[];
	loading: boolean;
	onView: (supplier: ISupplier) => void;
	// onEdit: (supplier: ISupplier) => void;
	onDelete: (supplier: ISupplier) => void;
};

const SuppliersTable: React.FC<SuppliersTableProps> = ({
	suppliers,
	loading,
	onView,
	// onEdit,
	onDelete,
}) => {
	const columns = useMemo<ColumnDef<ISupplier, any>[]>(() => [
		{
			header: 'Proveedor',
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
			header: 'Clientes asociados',
			accessorKey: 'customer_suppliers',
			cell: ({ row }) => {
				const customerSuppliers =
					(row.original as any).customerSuppliers ||
					(row.original as any).customer_suppliers ||
					[];
				const hasCustomers = customerSuppliers.length > 0;

				if (!hasCustomers) {
					return <span className='text-xs text-gray-400'>Sin clientes</span>;
				}

				return (
					<div className='flex flex-col gap-1'>
						{customerSuppliers.slice(0, 3).map((cs: any, idx: number) => (
							<div key={cs.id || idx} className='flex items-center gap-2'>
								<Badge variant='outline' color='sky' className='text-xs'>
									{cs.customer_name ||
										cs.name ||
										cs.customer?.name ||
										`Cliente ${cs.customer_id || cs.id}`}
								</Badge>
							</div>
						))}
						{customerSuppliers.length > 3 && (
							<span className='text-xs text-gray-500'>
								+{customerSuppliers.length - 3} más
							</span>
						)}
					</div>
				);
			},
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
						className='text-blue-600 hover:text-blue-900 dark:text-blue-400'>
						<Icon icon='HeroEye' className='h-4 w-4' />
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={() => onDelete(row.original)}
						className='text-red-600 hover:text-red-900 dark:text-red-400'>
						<Icon icon='HeroTrash' className='h-4 w-4' />
					</Button>
				</div>
			),
		},
	], [onView, onDelete]);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle>Lista de Proveedores</CardTitle>
					<span className='text-sm text-gray-500'>{suppliers.length} proveedores</span>
				</div>
			</CardHeader>
			<CardBody className='p-0'>
				<DataTable<ISupplier>
					columns={columns}
					data={suppliers}
					loading={loading}
					emptyMessage='No hay proveedores'
					searchPlaceholder='Buscar proveedor...'
				/>
			</CardBody>
		</Card>
	);
};

export default SuppliersTable;
