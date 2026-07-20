import React, { useMemo } from 'react';
import { type ColumnDef, type CellContext } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import type { IWarehouse } from '@/interface/warehouse.interface';
import WarehouseCapacityBar from '../components/WarehouseCapacityBar';
import Card, { CardBody } from '@/components/ui/Card';

interface WarehousesTableProps {
	warehouses: IWarehouse[];
	loading?: boolean;
	onEdit: (warehouse: IWarehouse) => void;
	onDelete: (warehouse: IWarehouse) => void;
	branchId?: number | null;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
}

const WarehousesTable: React.FC<WarehousesTableProps> = ({
	warehouses,
	loading = false,
	onEdit,
	onDelete,
	branchId,
	searchValue,
	onSearchChange,
}) => {
	const navigate = useNavigate();

	const columns = useMemo<ColumnDef<IWarehouse>[]>(
		() => [
			{
				id: 'name',
				header: 'Nombre',
				accessorKey: 'name',
				cell: (info: CellContext<IWarehouse, string>) => (
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
							<Icon icon='HeroBuildingStorefront' className='h-5 w-5' />
						</div>
						<div>
							<div className='font-semibold text-gray-900 dark:text-white'>
								{info.row.original.name}
							</div>
							<div className='font-mono text-xs text-gray-500 dark:text-gray-400'>
								{info.row.original.code}
							</div>
						</div>
					</div>
				),
			},
			{
				id: 'warehouse_type',
				header: 'Tipo',
				accessorKey: 'warehouse_type',
				cell: (info: CellContext<IWarehouse, string>) => (
					<Badge
						variant='outline'
						color={
							info.row.original.warehouse_type === 'physical' ? 'indigo' : 'fuchsia'
						}
						className='border-dashed px-2'>
						{info.row.original.warehouse_type === 'physical'
							? 'Física'
							: info.row.original.warehouse_type}
					</Badge>
				),
			},
			{
				id: 'capacity',
				header: 'Capacidad',
				accessorKey: 'maximum_capacity',
				cell: (info: CellContext<IWarehouse, number | null>) => {
					const warehouse = info.row.original;
					return (
						<div className='min-w-[200px]'>
							<WarehouseCapacityBar
								current={warehouse.current_capacity || 0}
								maximum={warehouse.maximum_capacity}
								size='sm'
							/>
						</div>
					);
				},
			},
			{
				id: 'manager',
				header: 'Encargado',
				accessorKey: 'manager_name',
				cell: (info: CellContext<IWarehouse, string | null>) => (
					<div>
						{info.row.original.manager_name ? (
							<Badge variant='outline' color='sky' className='px-2'>
								<Icon icon='HeroUser' className='mr-1.5 h-3.5 w-3.5' />
								{info.row.original.manager_name}
							</Badge>
						) : (
							<Badge variant='outline' color='zinc' className='px-2 text-zinc-500'>
								Sin encargado
							</Badge>
						)}
					</div>
				),
			},
			{
				id: 'status',
				header: 'Estado',
				accessorKey: 'is_active',
				cell: (info: CellContext<IWarehouse, boolean>) => (
					<Badge
						variant='solid'
						color={info.row.original.is_active ? 'emerald' : 'zinc'}
						className='px-2 font-medium shadow-sm'>
						{info.row.original.is_active ? (
							<>
								<Icon
									icon='HeroCheckCircle'
									color='white'
									className='mr-1.5 size-4'
								/>
								Activa
							</>
						) : (
							<>
								<Icon icon='HeroXCircle' color='white' className='mr-1.5 size-4' />
								Inactiva
							</>
						)}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				cell: (info: CellContext<IWarehouse, unknown>) => (
					<div className='flex items-center gap-2'>
						<Button
							icon='HeroEye'
							color='violet'
							variant='outline'
							size='sm'
							onClick={() => navigate(`/inventario/bodegas/${info.row.original.id}`)}
							title='Ver detalle'
						/>
						<ProtectedButton
							permission='update-warehouse'
							branchId={branchId}
							scope='access'
							icon='HeroPencil'
							color='blue'
							variant='outline'
							size='sm'
							onClick={() => onEdit(info.row.original)}
							title='Editar'
						/>
						<ProtectedButton
							permission='delete-warehouse'
							branchId={branchId}
							scope='access'
							icon='HeroTrash'
							color='red'
							variant='outline'
							size='sm'
							onClick={() => onDelete(info.row.original)}
							title='Eliminar'
						/>
					</div>
				),
			},
		],
		[navigate, onEdit, onDelete, branchId],
	);

	return (
		<Card className='border-0 shadow-lg shadow-zinc-200/50 ring-1 ring-zinc-200 dark:shadow-zinc-900/50 dark:ring-zinc-800'>
			<CardBody className='p-0'>
				<DataTable
					columns={columns}
					data={warehouses}
					loading={loading}
					pageSize={10}
					searchValue={searchValue}
					onSearchChange={onSearchChange}
					searchPlaceholder='Buscar por nombre o código...'
					emptyMessage={
						warehouses.length === 0 && !loading
							? 'No hay bodegas registradas. Comienza creando tu primera bodega.'
							: 'No se encontraron bodegas que coincidan.'
					}
				/>
			</CardBody>
		</Card>
	);
};

export default WarehousesTable;
