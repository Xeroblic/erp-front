/**
 * Tabla de movimientos de inventario con TanStack React Table
 * Implementa funcionalidades avanzadas de ordenamiento, filtrado y paginación
 * Sigue el mismo patrón de diseño que otras tablas del sistema
 */
import React, { useMemo } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getSortedRowModel,
	SortingState,
} from '@tanstack/react-table';
import { IInventoryMovement, MovementType } from '../../mocks/movements.mock';
import Table, { Th, THead, Tr, TBody, Td } from '../../../../../components/ui/Table';
import Button from '../../../../../components/ui/Button';
import Badge from '../../../../../components/ui/Badge';
import Icon from '../../../../../components/icon/Icon';
import { formatDate } from '../../../../../utils/format.utils';

interface MovementsTableProps {
	data: IInventoryMovement[];
	loading?: boolean;
	onViewDetails?: (movement: IInventoryMovement) => void;
	onRefresh?: () => void;
}

const columnHelper = createColumnHelper<IInventoryMovement>();

const MovementsTable: React.FC<MovementsTableProps> = ({
	data,
	loading = false,
	onViewDetails,
	onRefresh,
}) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	// Función para obtener badge del tipo de movimiento
	const getMovementTypeBadge = (type: MovementType) => {
		const config = {
			ENTRY: { color: 'emerald' as const, text: 'Entrada', icon: 'HeroArrowUp' },
			EXIT: { color: 'red' as const, text: 'Salida', icon: 'HeroArrowDown' },
			TRANSFER: { color: 'sky' as const, text: 'Transferencia', icon: 'HeroArrowsRightLeft' },
			ADJUSTMENT: { color: 'amber' as const, text: 'Ajuste', icon: 'HeroCog6Tooth' },
			SALE: { color: 'violet' as const, text: 'Venta', icon: 'HeroShoppingCart' },
			PURCHASE: { color: 'emerald' as const, text: 'Compra', icon: 'HeroShoppingBag' },
		};

		const { color, text, icon } = config[type] || config.ADJUSTMENT;
		return (
			<Badge color={color} variant='outline' className='gap-1'>
				<Icon icon={icon} className='h-3 w-3' />
				{text}
			</Badge>
		);
	};

	// Definición de columnas
	const columns = useMemo(
		() => [
			columnHelper.accessor('id', {
				header: 'ID',
				cell: (info) => <span className='font-mono text-sm'>#{info.getValue()}</span>,
				size: 80,
			}),
			columnHelper.accessor('type', {
				header: 'Tipo',
				cell: (info) => getMovementTypeBadge(info.getValue()),
				size: 140,
			}),
			columnHelper.accessor('created_at', {
				header: 'Fecha',
				cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
				size: 120,
			}),
			columnHelper.accessor('product', {
				header: 'Producto',
				cell: (info) => {
					const product = info.getValue();
					return (
						<div>
							<div className='font-medium'>{product?.name || 'N/A'}</div>
							<div className='text-xs text-gray-500'>
								SKU: {product?.sku || 'N/A'}
							</div>
						</div>
					);
				},
				size: 200,
			}),
			columnHelper.accessor('quantity', {
				header: 'Cantidad',
				cell: (info) => {
					const quantity = info.getValue();
					return (
						<span
							className={`font-semibold ${
								quantity < 0 ? 'text-red-600' : 'text-emerald-600'
							}`}>
							{quantity < 0 ? '' : '+'}
							{quantity}
						</span>
					);
				},
				size: 100,
			}),
			columnHelper.accessor('warehouse', {
				header: 'Almacén',
				cell: (info) => <span className='text-sm'>{info.getValue()?.name || 'N/A'}</span>,
				size: 120,
			}),
			columnHelper.accessor('performer', {
				header: 'Responsable',
				cell: (info) => <span className='text-sm'>{info.getValue()?.name || 'N/A'}</span>,
				size: 120,
			}),
			columnHelper.display({
				id: 'stock_change',
				header: 'Stock',
				cell: (info) => {
					const movement = info.row.original;
					return (
						<div className='text-xs'>
							<div className='font-mono'>
								{movement.previous_stock} → {movement.current_stock}
							</div>
						</div>
					);
				},
				size: 100,
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex gap-1'>
						<Button
							size='xs'
							variant='outline'
							color='sky'
							onClick={() => onViewDetails?.(info.row.original)}>
							<Icon icon='HeroEye' className='h-3 w-3' />
						</Button>
					</div>
				),
				size: 80,
			}),
		],
		[onViewDetails],
	);

	// Configuración de la tabla
	const table = useReactTable({
		data,
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
			<div className='flex min-h-[400px] items-center justify-center'>
				<div className='flex items-center gap-2'>
					<div className='h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent'></div>
					<span>Cargando movimientos...</span>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Header con acciones */}
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-semibold'>Movimientos de Inventario</h3>
					<p className='text-sm text-gray-600'>
						{data.length} movimiento{data.length !== 1 ? 's' : ''} encontrado
						{data.length !== 1 ? 's' : ''}
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' color='gray' onClick={onRefresh} isDisable={loading}>
						<Icon icon='HeroArrowPath' className='h-4 w-4' />
						Actualizar
					</Button>
				</div>
			</div>

			{/* Tabla */}
			<div className='overflow-x-auto rounded-lg border'>
				<Table>
					<THead>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<Th
										key={header.id}
										style={{ width: header.getSize() }}
										className={
											header.column.getCanSort()
												? 'cursor-pointer select-none hover:bg-gray-50'
												: ''
										}
										onClick={header.column.getToggleSortingHandler()}>
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
													className='h-3 w-3'
												/>
											)}
										</div>
									</Th>
								))}
							</Tr>
						))}
					</THead>
					<TBody>
						{data.length === 0 ? (
							<Tr>
								<Td colSpan={columns.length} className='py-12 text-center'>
									<div className='flex flex-col items-center gap-2'>
										<Icon
											icon='HeroDocumentMagnifyingGlass'
											className='h-12 w-12 text-gray-400'
										/>
										<div className='text-gray-500'>
											No se encontraron movimientos
										</div>
										<div className='text-sm text-gray-400'>
											Ajusta los filtros para ver más resultados
										</div>
									</div>
								</Td>
							</Tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<Tr key={row.id} className='transition-colors hover:bg-gray-50'>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id} style={{ width: cell.column.getSize() }}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									))}
								</Tr>
							))
						)}
					</TBody>
				</Table>
			</div>
		</div>
	);
};

export default MovementsTable;
