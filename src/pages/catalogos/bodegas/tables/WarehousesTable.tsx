import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusPill } from '@/components/procurement';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import ProtectedButton from '@/components/ui/ProtectedButton';
// eslint-disable-next-line import/extensions
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type { IWarehouse } from '@/interface/warehouse.interface';
import WarehouseCapacityBar from '../components/WarehouseCapacityBar';

const COLUMN_COUNT = 7;

type SortKey = 'name' | 'type' | 'units' | 'status';
type SortState = TableSortState<SortKey>;

const getSortValue = (warehouse: IWarehouse, key: SortKey): string | number => {
	switch (key) {
		case 'name':
			return warehouse.name;
		case 'type':
			return warehouse.warehouse_type;
		case 'units':
			return warehouse.current_capacity ?? 0;
		case 'status':
			return Number(warehouse.is_active);
		default:
			return '';
	}
};

const compareRows = (left: IWarehouse, right: IWarehouse, sort: NonNullable<SortState>) => {
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

interface WarehousesTableProps {
	warehouses: IWarehouse[];
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	onEdit: (warehouse: IWarehouse) => void;
	onDelete: (warehouse: IWarehouse) => void;
	branchId?: number | null;
}

/** Bodegas de la sucursal activa: stock, capacidad y acciones de mantención. */
const WarehousesTable: React.FC<WarehousesTableProps> = ({
	warehouses,
	loading,
	hasError,
	hasFilters,
	onEdit,
	onDelete,
	branchId,
}) => {
	const navigate = useNavigate();
	const [sort, setSort] = useState<SortState>(null);
	const sortedRows = useMemo(
		() =>
			sort === null
				? warehouses
				: [...warehouses].sort((left, right) => compareRows(left, right, sort)),
		[warehouses, sort],
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
				<CardTitle className='text-lg'>Bodegas de la sucursal</CardTitle>
				{!loading && !hasError && (
					<span className='text-sm text-zinc-500'>
						{warehouses.length} {warehouses.length === 1 ? 'bodega' : 'bodegas'}
					</span>
				)}
			</CardHeader>
			<CardBody className='overflow-x-auto p-0'>
				<Table aria-label='Bodegas de la sucursal' className='min-w-[1040px]'>
					<THead>
						<Tr>
							<SortableTableHeader
								label='Bodega'
								sortKey='name'
								sort={sort}
								onSort={handleSort}
							/>
							<SortableTableHeader
								label='Tipo'
								sortKey='type'
								sort={sort}
								onSort={handleSort}
							/>
							<Th scope='col' className='text-left'>
								Encargado
							</Th>
							<SortableTableHeader
								label='Unidades'
								sortKey='units'
								sort={sort}
								onSort={handleSort}
								align='right'
							/>
							<Th scope='col' className='text-left'>
								Capacidad
							</Th>
							<SortableTableHeader
								label='Estado'
								sortKey='status'
								sort={sort}
								onSort={handleSort}
								align='center'
							/>
							<Th scope='col' className='text-center'>
								Acciones
							</Th>
						</Tr>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: 3 }, (_, rowIndex) => (
								<Tr key={`warehouses-skeleton-${rowIndex}`}>
									{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
										<Td key={`warehouses-skeleton-${rowIndex}-${cellIndex}`}>
											<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
										</Td>
									))}
								</Tr>
							))}
						{!loading && hasError && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-red-700 dark:text-red-300'>
										No fue posible mostrar las bodegas
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										Revisa el mensaje de error e intenta cargar la información
										nuevamente.
									</p>
								</Td>
							</Tr>
						)}
						{!loading && !hasError && warehouses.length === 0 && (
							<Tr>
								<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
									<p className='font-medium text-zinc-700 dark:text-zinc-200'>
										{hasFilters
											? 'Sin resultados para los filtros aplicados'
											: 'Esta sucursal aún no tiene bodegas'}
									</p>
									<p className='mt-1 text-sm text-zinc-500'>
										{hasFilters
											? 'Prueba ajustando o limpiando los filtros.'
											: 'Crea la primera con «Nueva bodega».'}
									</p>
								</Td>
							</Tr>
						)}
						{!loading &&
							!hasError &&
							sortedRows.map((warehouse) => (
								<Tr key={warehouse.id}>
									<Td>
										<p className='font-medium'>{warehouse.name}</p>
										<p className='font-mono text-xs text-zinc-500'>
											{warehouse.code}
										</p>
									</Td>
									<Td className='text-sm text-zinc-600 dark:text-zinc-300'>
										{warehouse.warehouse_type}
									</Td>
									<Td className='text-sm'>
										{warehouse.manager_name ?? (
											<span className='text-zinc-400'>Sin encargado</span>
										)}
									</Td>
									<Td className='text-right text-lg font-semibold tabular-nums'>
										{(warehouse.current_capacity ?? 0).toLocaleString('es-CL')}
									</Td>
									<Td>
										<WarehouseCapacityBar
											current={warehouse.current_capacity ?? 0}
											maximum={warehouse.maximum_capacity}
										/>
									</Td>
									<Td>
										<div className='flex justify-center'>
											<StatusPill
												color={warehouse.is_active ? 'emerald' : 'zinc'}
												width={6.5}>
												{warehouse.is_active ? 'Activa' : 'Inactiva'}
											</StatusPill>
										</div>
									</Td>
									<Td>
										<div className='flex flex-wrap justify-center gap-2'>
											<ProtectedButton
												permission='view-warehouse-detail'
												branchId={branchId}
												scope='visible'
												size='sm'
												variant='outline'
												icon='HeroEye'
												color='violet'
												aria-label={`Ver ${warehouse.name}`}
												onClick={() =>
													navigate(`/inventario/bodegas/${warehouse.id}`)
												}>
												Ver
											</ProtectedButton>
											<ProtectedButton
												permission='edit-warehouse'
												branchId={branchId}
												scope='access'
												size='sm'
												variant='outline'
												color='blue'
												icon='HeroPencil'
												aria-label={`Editar ${warehouse.name}`}
												onClick={() => onEdit(warehouse)}>
												Editar
											</ProtectedButton>
											<ProtectedButton
												permission='delete-warehouse'
												branchId={branchId}
												scope='access'
												size='sm'
												variant='outline'
												color='red'
												icon='HeroTrash'
												aria-label={`Eliminar ${warehouse.name}`}
												onClick={() => onDelete(warehouse)}>
												Eliminar
											</ProtectedButton>
										</div>
									</Td>
								</Tr>
							))}
					</TBody>
				</Table>
			</CardBody>
		</Card>
	);
};

export default WarehousesTable;
