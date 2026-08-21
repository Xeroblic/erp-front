import React, { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import type { ISupplier } from '@/interface/supplier.interface';
import DataTable from '@/components/ui/DataTable/DataTable';

type SuppliersTableProps = {
	suppliers: ISupplier[];
	loading: boolean;
	onView: (supplier: ISupplier) => void;
	onDelete: (supplier: ISupplier) => void;
};

const SuppliersTable: React.FC<SuppliersTableProps> = ({
	suppliers,
	loading,
	onView,
	onDelete,
}) => {
	const totalSuppliers = suppliers.length;

	const columns = useMemo<ColumnDef<ISupplier, any>[]>(
		() => [
			{
				header: 'Proveedor',
				accessorKey: 'name',
				cell: ({ row }) => (
					<div className='flex items-center gap-3 py-1'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300'>
							<Icon icon='HeroBuildingStorefront' className='h-5 w-5' />
						</div>
						<div className='min-w-0'>
							<div className='truncate text-sm font-semibold text-gray-900 dark:text-white'>
								{row.original.name}
							</div>
							<div className='mt-1 flex flex-wrap items-center gap-2'>
								<Badge variant='outline' color='amber'>
									ID #{row.original.id}
								</Badge>
								<Badge variant='outline' color='zinc'>
									Proveedor
								</Badge>
							</div>
						</div>
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
						return (
							<div className='py-1'>
								<Badge variant='outline' color='zinc'>
									Sin clientes
								</Badge>
							</div>
						);
					}

					return (
						<div className='flex flex-col gap-1.5 py-1'>
							{customerSuppliers.slice(0, 3).map((cs: any, idx: number) => (
								<div key={cs.id || idx}>
									<Badge variant='outline' color='sky' className='text-xs'>
										{cs.customer_name ||
											cs.name ||
											cs.customer?.name ||
											`Cliente ${cs.customer_id || cs.id}`}
									</Badge>
								</div>
							))}
							{customerSuppliers.length > 3 && (
								<span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
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
				cell: ({ row }) => {
					const formattedDate = row.original.created_at
						? new Date(String(row.original.created_at)).toLocaleDateString('es-CL')
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
								<Icon icon='HeroEye' color='violet' className='text-2xl' />
							</Button>
						</Tooltip>
						<Tooltip text='Eliminar'>
							<Button
								size='sm'
								variant='outline'
								color='red'
								onClick={() => onDelete(row.original)}
								className='border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10'>
								<Icon icon='HeroTrash' color='red' className='text-2xl' />
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
			<CardHeader className='border-b border-neutral-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-5 py-4 dark:border-neutral-800 dark:from-amber-950/20 dark:via-neutral-900 dark:to-orange-950/10'>
				<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex items-start gap-3'>
						<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-900/20 dark:text-amber-300'>
							<Icon icon='HeroBuildingStorefront' className='h-5 w-5' />
						</div>
						<div>
							<CardTitle className='text-xl font-semibold text-neutral-900 dark:text-white'>
								Lista de Proveedores
							</CardTitle>
							<p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
								Administra tus proveedores y revisa sus clientes asociados.
							</p>
						</div>
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						<Badge variant='outline' color='amber'>
							{totalSuppliers} proveedor{totalSuppliers === 1 ? '' : 'es'}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardBody className='p-0'>
				<div className='border-b border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400'>
					Visualiza proveedores, consulta su ficha y elimina registros rápidamente desde
					la misma tabla.
				</div>
				<DataTable<ISupplier>
					columns={columns}
					data={suppliers}
					loading={loading}
					emptyMessage='No hay proveedores registrados para esta subsidiaria'
					searchPlaceholder='Buscar proveedor por nombre...'
					className='px-5 py-4'
				/>
			</CardBody>
		</Card>
	);
};

export default SuppliersTable;
