import React, { useMemo } from 'react';
import type { ColumnDef, PaginationState, OnChangeFn } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { PaginationMeta } from '@/services/salesService';
import Tooltip from '@/components/ui/Tooltip';

interface CustomersTableProps {
	customers: ICustomerSupplier[];
	onView: (c: ICustomerSupplier) => void;
	onEdit: (c: ICustomerSupplier) => void;
	onDelete: (c: ICustomerSupplier) => void;
	loading?: boolean;
	meta?: PaginationMeta | null;
	pagination?: PaginationState;
	onPaginationChange?: OnChangeFn<PaginationState>;
}

const CustomersTable: React.FC<CustomersTableProps> = ({
	customers,
	onView,
	onDelete,
	loading = false,
	meta = null,
	pagination,
	onPaginationChange,
}) => {
	const totalCustomers = meta?.total ?? customers.length;

	const columns = useMemo<ColumnDef<ICustomerSupplier>[]>(
		() => [
			{
				header: 'Cliente',
				accessorKey: 'name',
				cell: ({ row }) => (
					<div className='flex items-center gap-3 py-1'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'>
							<Icon icon='HeroUserCircle' className='h-5 w-5' />
						</div>
						<div className='min-w-0'>
							<div className='truncate text-sm font-semibold text-gray-900 dark:text-white'>
								{row.original.name}
							</div>
							<div className='mt-1 flex flex-wrap items-center gap-2'>
								<Badge variant='outline' color='blue'>
									ID #{row.original.id}
								</Badge>
								<Badge variant='outline' color='zinc'>
									Cliente proveedor
								</Badge>
							</div>
						</div>
					</div>
				),
			},
			{
				header: 'Creado',
				accessorKey: 'created_at',
				cell: ({ row }) => {
					const formattedDate = row.original.created_at
						? new Date(String(row.original.created_at)).toLocaleDateString('es-CO')
						: '-';

					return (
						<div className='space-y-1 py-1'>
							<div className='text-sm font-medium text-gray-800 dark:text-gray-100'>
								{formattedDate}
							</div>
							<div className='text-xs text-gray-500 dark:text-gray-400'>
								Registro en catálogo
							</div>
						</div>
					);
				},
			},
			{
				id: 'estado',
				header: 'Estado',
				cell: () => (
					<div className='py-1'>
						<Badge variant='outline' color='emerald'>
							Activo
						</Badge>
					</div>
				),
			},
			{
				id: 'acciones',
				header: 'Acciones',
				cell: ({ row }) => (
					<div className='flex flex-wrap gap-2 py-1'>
						<Tooltip text='Ver detalle'>
							<Button
								size='sm'
								variant='outline'
								onClick={() => onView(row.original)}
								className='border-violet-200 text-violet-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/10'>
								<Icon icon='HeroEye' color={'violet'} className='text-2xl' />
							</Button>
						</Tooltip>
						<Tooltip text='Eliminar'>
							<Button
								size='sm'
								variant='outline'
								color='red'
								onClick={() => onDelete(row.original)}
								className='border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10'>
								<Icon icon='HeroTrash' color={'red'} className='text-2xl' />
							</Button>
						</Tooltip>
					</div>
				),
			},
		],
		[onView, onDelete],
	);

	return (
		<Card className='overflow-hidden border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70'>
			<CardHeader className='border-b border-neutral-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-4 dark:border-neutral-800 dark:from-blue-950/20 dark:via-neutral-900 dark:to-cyan-950/10'>
				<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex items-start gap-3'>
						<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-300'>
							<Icon icon='HeroUsers' className='h-5 w-5' />
						</div>
						<div>
							<CardTitle className='text-xl font-semibold text-neutral-900 dark:text-white'>
								Lista de Clientes-Proveedor
							</CardTitle>
							<p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
								Gestiona tus relaciones comerciales y accede rápido a cada ficha.
							</p>
						</div>
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						<Badge variant='outline' color='blue'>
							{totalCustomers} registro{totalCustomers === 1 ? '' : 's'}
						</Badge>
						{meta?.current_page ? (
							<Badge variant='outline' color='zinc'>
								Página {meta.current_page} de {meta.last_page}
							</Badge>
						) : null}
					</div>
				</div>
			</CardHeader>
			<CardBody className='p-0'>
				<div className='border-b border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400'>
					Visualiza clientes, consulta su ficha y elimina registros rápidamente desde la
					misma tabla.
				</div>
				<DataTable<ICustomerSupplier>
					columns={columns}
					data={customers}
					loading={loading}
					emptyMessage='No hay clientes registrados para esta subsidiaria'
					searchPlaceholder='Buscar cliente por nombre...'
					manualPagination={!!meta}
					pageCount={meta?.last_page ?? 1}
					paginationState={pagination}
					onPaginationChange={onPaginationChange}
					className='px-5 py-4'
				/>
			</CardBody>
		</Card>
	);
};

export default CustomersTable;
