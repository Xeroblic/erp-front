import React from 'react';
import { IWarehouse } from '../types';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Card, { CardBody } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import useDarkMode from '@/hooks/useDarkMode';

interface WarehousesTableProps {
	warehouses: IWarehouse[];
	onView: (warehouse: IWarehouse) => void;
	onEdit: (warehouse: IWarehouse) => void;
	onDelete: (warehouse: IWarehouse) => void;
}

// no hooks at module scope

const getTypeColor = (type: string) => {
	switch (type) {
		case 'CENTRAL':
			return 'violet';
		case 'SUCURSAL':
			return 'sky';
		case 'DISTRIBUCION':
			return 'emerald';
		case 'TEMPORAL':
			return 'amber';
		default:
			return 'gray';
	}
};

const getCapacityColor = (current: number, max: number) => {
	const percentage = (current / max) * 100;
	if (percentage >= 90) return 'red';
	if (percentage >= 75) return 'amber';
	if (percentage >= 50) return 'sky';
	return 'emerald';
};

const getCapacityPercentage = (current: number, max: number) => {
	return Math.round((current / max) * 100);
};

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);

const WarehousesTable: React.FC<WarehousesTableProps> = ({
	warehouses,
	onView,
	onEdit,
	onDelete,
}) => {
	const { isDarkTheme: isDark } = useDarkMode();
	const [sorting, setSorting] = React.useState<SortingState>([{ id: 'name', desc: false }]);

	const columns = React.useMemo<ColumnDef<IWarehouse>[]>(
		() => [
			{
				id: 'name',
				accessorKey: 'name',
				header: 'Bodega',
				cell: ({ row }) => {
					const w = row.original;
					return (
						<div>
							<div
								className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-zinc-900'}`}>
								{w.name}
							</div>
							<div className='text-sm'>{w.code}</div>
							<div className='text-sm'>Gerente: {w.manager_name}</div>
						</div>
					);
				},
				sortingFn: 'alphanumeric',
			},
			{
				id: 'location',
				header: 'Ubicación',
				cell: ({ row }) => {
					const w = row.original;
					return (
						<div>
							<div 
                                className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-zinc-900'}`}>
                                {w.address}
                            </div>
							<div className='text-sm'>
								{w.city}, {w.country}
							</div>
							<div className='text-sm'>{w.postal_code}</div>
						</div>
					);
				},
				enableSorting: false,
			},
			{
				id: 'type',
				accessorKey: 'warehouse_type',
				header: 'Tipo',
				cell: ({ row }) => {
					const w = row.original;
					return (
						<div className='space-y-1'>
							<Badge color={getTypeColor(w.warehouse_type)}>{w.warehouse_type}</Badge>
							<div className='flex space-x-1'>
								{w.has_climate_control && (
									<Badge color='sky' variant='outline'>
										<Icon icon='HeroSnowflake' className='mr-1 h-3 w-3' />
										Clima
									</Badge>
								)}
								{w.has_security_system && (
									<Badge color='emerald' variant='outline'>
										<Icon icon='HeroShieldCheck' className='mr-1 h-3 w-3' />
										Seguridad
									</Badge>
								)}
							</div>
						</div>
					);
				},
			},
			{
				id: 'capacity',
				header: 'Capacidad',
				accessorFn: (w) => w.current_capacity / w.max_capacity,
				cell: ({ row }) => {
					const w = row.original;
					const pct = getCapacityPercentage(w.current_capacity, w.max_capacity);
					const color = getCapacityColor(w.current_capacity, w.max_capacity);
					return (
						<div>
							<div className='text-sm font-medium'>
								{w.current_capacity.toLocaleString()} /{' '}
								{w.max_capacity.toLocaleString()}
							</div>
							<div className='mt-1 h-2 w-full rounded-full bg-gray-200'>
								<div
									className={`h-2 rounded-full bg-${color}-500`}
									style={{ width: `${pct}%` }}
								/>
							</div>
							<div className='mt-1 text-xs'>{pct}% usado</div>
						</div>
					);
				},
				sortingFn: 'alphanumeric',
			},
			{
				id: 'inventory',
				header: 'Inventario',
				accessorFn: (w) => w.total_value,
				cell: ({ row }) => {
					const w = row.original;
					return (
						<div>
							<div className='font-medium'>{w.products_count} productos</div>
							<div className='text-gray-500'>{formatCurrency(w.total_value)}</div>
							<div className='text-xs text-gray-500'>{w.operating_hours}</div>
						</div>
					);
				},
			},
			{
				id: 'status',
				accessorKey: 'is_active',
				header: 'Estado',
				cell: ({ row }) => (
					<Badge color={row.original.is_active ? 'emerald' : 'red'}>
						{row.original.is_active ? 'Activo' : 'Inactivo'}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => {
					const w = row.original;
					return (
						<div className='flex space-x-2'>
							<Button
								size='sm'
								variant='outline'
								onClick={() => onView(w)}
								className='text-blue-600 hover:text-blue-900'>
								<Icon icon='HeroEye' className='h-4 w-4' />
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => onEdit(w)}
								className='text-indigo-600 hover:text-indigo-900'>
								<Icon icon='HeroPencilSquare' className='h-4 w-4' />
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => onDelete(w)}
								isDisable={w.products_count > 0}
								className={
									w.products_count > 0
										? 'cursor-not-allowed text-gray-400'
										: 'text-red-600 hover:text-red-900'
								}>
								<Icon icon='HeroTrash' className='h-4 w-4' />
							</Button>
						</div>
					);
				},
				enableSorting: false,
			},
		],
		[onDelete, onEdit, onView],
	);

	const table = useReactTable({
		data: warehouses,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<Container>
			<Card className='overflow-x-auto'>
				<CardBody>
					<Table className='w-full table-fixed'>
						<THead>
							{table.getHeaderGroups().map((hg) => (
								<Tr key={hg.id}>
									{hg.headers.map((header) => (
										<Th key={header.id} className='text-left'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</Th>
									))}
								</Tr>
							))}
						</THead>
						<TBody>
							{table.getRowModel().rows.map((row) => (
								<Tr key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									))}
								</Tr>
							))}
						</TBody>
					</Table>
					<div className='mt-4'>
						<TableCardFooterTemplateV2 table={table} />
					</div>
				</CardBody>
			</Card>
		</Container>
	);
};

export default WarehousesTable;
