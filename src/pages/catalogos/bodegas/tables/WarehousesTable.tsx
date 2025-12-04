import React, { useMemo } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type SortingState,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IWarehouse } from '@/interface/warehouse.interface';
import WarehouseCapacityBar from '../components/WarehouseCapacityBar';

interface WarehousesTableProps {
	warehouses: IWarehouse[];
	loading?: boolean;
	onEdit: (warehouse: IWarehouse) => void;
	onDelete: (warehouse: IWarehouse) => void;
}

const columnHelper = createColumnHelper<IWarehouse>();

const WarehousesTable: React.FC<WarehousesTableProps> = ({
	warehouses,
	loading = false,
	onEdit,
	onDelete,
}) => {
	const navigate = useNavigate();
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const columns = useMemo(
		() => [
			columnHelper.accessor('name', {
				id: 'name',
				header: 'Nombre',
				cell: (info) => (
					<div>
						<div className='font-semibold text-gray-900 dark:text-white'>
							{info.getValue()}
						</div>
						<div className='text-sm text-gray-500 dark:text-gray-400'>
							{info.row.original.code}
						</div>
					</div>
				),
			}),
			columnHelper.accessor('warehouse_type', {
				id: 'warehouse_type',
				header: 'Tipo',
				cell: (info) => (
					<Badge variant='outline' color='blue'>
						{info.getValue()}
					</Badge>
				),
			}),
			columnHelper.accessor('maximum_capacity', {
				id: 'capacity',
				header: 'Capacidad',
				cell: (info) => {
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
			}),
			columnHelper.accessor('manager_name', {
				id: 'manager',
				header: 'Encargado',
				cell: (info) => (
					<div>
						{info.getValue() ? (
							<div className='text-sm text-gray-700 dark:text-gray-300'>
								{info.getValue()}
							</div>
						) : (
							<div className='text-sm font-medium text-red-600 dark:text-red-400'>
								Sin encargado
							</div>
						)}
					</div>
				),
			}),
			columnHelper.accessor('is_active', {
				id: 'status',
				header: 'Estado',
				cell: (info) => (
					<Badge variant='solid' color={info.getValue() ? 'emerald' : 'gray'}>
						{info.getValue() ? (
							<>
								<Icon icon='HeroCheckCircle' className='mr-1 size-4' />
								Activa
							</>
						) : (
							<>
								<Icon icon='HeroXCircle' className='mr-1 size-4' />
								Inactiva
							</>
						)}
					</Badge>
				),
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex items-center gap-2'>
						<Button
							icon='HeroEye'
							color='zinc'
							variant='outline'
							size='sm'
							onClick={() => navigate(`/catalogos/bodegas/${info.row.original.id}`)}
							title='Ver detalle'
						/>
						<Button
							icon='HeroPencil'
							color='blue'
							variant='outline'
							size='sm'
							onClick={() => onEdit(info.row.original)}
							title='Editar'
						/>
						<Button
							icon='HeroTrash'
							color='red'
							variant='outline'
							size='sm'
							onClick={() => onDelete(info.row.original)}
							title='Eliminar'
						/>
					</div>
				),
			}),
		],
		[navigate, onEdit, onDelete],
	);

	const table = useReactTable({
		data: warehouses,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (loading) {
		return (
			<div className='flex items-center justify-center py-12'>
				<div className='text-center'>
					<Icon
						icon='HeroArrowPath'
						className='mx-auto size-8 animate-spin text-blue-600'
					/>
					<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
						Cargando bodegas...
					</p>
				</div>
			</div>
		);
	}

	if (warehouses.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700'>
				<Icon icon='HeroHomeModern' className='size-12 text-gray-400' />
				<h3 className='mt-2 text-sm font-semibold text-gray-900 dark:text-white'>
					No hay bodegas registradas
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
					Comienza creando tu primera bodega
				</p>
			</div>
		);
	}

	return (
		<div className='overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
			<Table>
				<THead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Th
									key={header.id}
									onClick={header.column.getToggleSortingHandler()}
									className={
										header.column.getCanSort()
											? 'cursor-pointer select-none'
											: ''
									}>
									<div className='flex items-center gap-2'>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
										{header.column.getCanSort() && (
											<Icon
												icon={
													header.column.getIsSorted() === 'asc'
														? 'HeroChevronUp'
														: header.column.getIsSorted() === 'desc'
															? 'HeroChevronDown'
															: 'HeroChevronUpDown'
												}
												className='size-4'
											/>
										)}
									</div>
								</Th>
							))}
						</Tr>
					))}
				</THead>
				<TBody>
					{table.getRowModel().rows.map((row) => (
						<Tr
							key={row.id}
							className='cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'>
							{row.getVisibleCells().map((cell) => (
								<Td key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</Td>
							))}
						</Tr>
					))}
				</TBody>
			</Table>
		</div>
	);
};

export default WarehousesTable;
