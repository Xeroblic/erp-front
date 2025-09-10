import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
	fetchInventoryMovements,
	selectInventoryMovements,
	selectInventoryLoading,
} from '@/store/slices/inventory/inventorySlice';	const getTypeBadge = (type: string) => {
		const typeConfig = {
			SALE: { color: 'emerald' as const, text: 'Venta', icon: '🛒' },
			PURCHASE: { color: 'blue' as const, text: 'Compra', icon: '📦' },
			ADJUSTMENT: { color: 'blue' as const, text: 'Ajuste', icon: '⚖️' },
			TRANSFER: { color: 'violet' as const, text: 'Transferencia', icon: '🔄' },
			PRODUCTION: { color: 'amber' as const, text: 'Producción', icon: '🏭' },
			RETURN: { color: 'orange' as const, text: 'Devolución', icon: '↩️' },
		};

		const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['ADJUSTMENT'];
		return (
			<Badge color={config.color} variant='outline'>
				{config.icon} {config.text}
			</Badge>
		);
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/ui/Card';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Input from '../../../components/form/Input';
import Select from '../../../components/form/Select';
import Badge from '../../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../../components/ui/Modal';
import { ERP_PERMISSIONS } from '../../../constants/temp-permissions.constant';
import PermissionGuard from '../../../components/authorization/PermissionGuard';
import type { IInventoryMovement, MovementType } from '../../../interface/inventory.interface';
import { formatDate, formatCurrency } from '../../../utils/format.utils';

// TanStack Table
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnFiltersState,
	type SortingState,
} from '@tanstack/react-table';

// Mock data para filtros
const MOCK_WAREHOUSES = [
	{ id: 1, name: 'Bodega Central', code: 'BC01' },
	{ id: 2, name: 'Bodega Norte', code: 'BN02' },
	{ id: 3, name: 'Bodega Sur', code: 'BS03' },
	{ id: 4, name: 'Bodega Distribución', code: 'BD04' },
];

const MOCK_BRANCHES = [
	{ id: 1, name: 'Sucursal Principal', code: 'SP01' },
	{ id: 2, name: 'Sucursal Norte', code: 'SN02' },
	{ id: 3, name: 'Sucursal Sur', code: 'SS03' },
];

const MOCK_USERS = [
	{ id: 1, name: 'Ana García' },
	{ id: 2, name: 'Carlos Rodríguez' },
	{ id: 3, name: 'María López' },
	{ id: 4, name: 'José Martínez' },
];

// Datos mock de movimientos para demostración
const MOCK_MOVEMENTS: IInventoryMovement[] = [
	{
		id: 1,
		company_id: 1,
		movement_number: 'MOV-001',
		movement_type: 'TRANSFER',
		scope: 'ITEM',
		product_id: 1,
		warehouse_id: 1,
		quantity: 5,
		reference_type: 'transfer',
		reference_id: 123,
		notes: 'Transferencia - Responsable: Ana García',
		performed_by: 1,
		performed_at: '2025-09-10T10:00:00Z',
		created_at: '2025-09-10T10:00:00Z',
		product: { id: 1, name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-15' },
		warehouse: { name: 'Bodega Central' },
		performer: { name: 'Ana García' },
	},
	{
		id: 2,
		company_id: 1,
		movement_number: 'MOV-002',
		movement_type: 'IN',
		scope: 'ITEM',
		product_id: 2,
		warehouse_id: 2,
		quantity: 10,
		reference_type: 'purchase',
		reference_id: 456,
		notes: 'Compra de monitores',
		performed_by: 2,
		performed_at: '2025-09-09T14:30:00Z',
		created_at: '2025-09-09T14:30:00Z',
		product: { id: 2, name: 'Monitor Samsung 24"', sku: 'MON-SAM-24' },
		warehouse: { name: 'Bodega Norte' },
		performer: { name: 'Carlos Rodríguez' },
	},
	{
		id: 3,
		company_id: 1,
		movement_number: 'MOV-003',
		movement_type: 'OUT',
		scope: 'ITEM',
		product_id: 1,
		warehouse_id: 1,
		quantity: 2,
		reference_type: 'sale',
		reference_id: 789,
		notes: 'Venta a cliente corporativo',
		performed_by: 3,
		performed_at: '2025-09-08T16:15:00Z',
		created_at: '2025-09-08T16:15:00Z',
		product: { id: 1, name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-15' },
		warehouse: { name: 'Bodega Central' },
		performer: { name: 'María López' },
	},
	{
		id: 4,
		company_id: 1,
		movement_number: 'MOV-004',
		movement_type: 'ADJUSTMENT',
		scope: 'ITEM',
		product_id: 3,
		warehouse_id: 3,
		quantity: -1,
		reference_type: 'adjustment',
		reference_id: 101,
		notes: 'Ajuste por inventario físico',
		performed_by: 4,
		performed_at: '2025-09-07T09:45:00Z',
		created_at: '2025-09-07T09:45:00Z',
		product: { id: 3, name: 'Teclado Mecánico Logitech', sku: 'TEC-LOG-MEC' },
		warehouse: { name: 'Bodega Sur' },
		performer: { name: 'José Martínez' },
	},
	{
		id: 5,
		company_id: 1,
		movement_number: 'MOV-005',
		movement_type: 'TRANSFER',
		scope: 'ITEM',
		product_id: 4,
		warehouse_id: 2,
		quantity: 15,
		reference_type: 'transfer',
		reference_id: 124,
		notes: 'Transferencia - Responsable: Carlos Rodríguez',
		performed_by: 2,
		performed_at: '2025-09-06T11:20:00Z',
		created_at: '2025-09-06T11:20:00Z',
		product: { id: 4, name: 'Mouse Óptico HP', sku: 'MOU-HP-OPT' },
		warehouse: { name: 'Bodega Norte' },
		performer: { name: 'Carlos Rodríguez' },
	},
];

const columnHelper = createColumnHelper<IInventoryMovement>();

const HistorialInventario: React.FC = () => {
	const dispatch = useAppDispatch();
	const [searchParams] = useSearchParams();

	// Redux state
	const movements = useAppSelector(selectInventoryMovements);
	const loading = useAppSelector(selectInventoryLoading);

	// Local state
	const [data, setData] = useState<IInventoryMovement[]>(MOCK_MOVEMENTS);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [selectedMovement, setSelectedMovement] = useState<IInventoryMovement | null>(null);
	const [showInfoModal, setShowInfoModal] = useState(false);

	// Filtros específicos
	const [filters, setFilters] = useState({
		dateFrom: '',
		dateTo: '',
		type: '',
		sku: '',
		warehouse: '',
		branch: '',
		user: '',
		referenceType: '',
		referenceId: '',
	});

	// Inicializar con parámetros de URL
	useEffect(() => {
		const tipoParam = searchParams.get('tipo');
		const refIdParam = searchParams.get('ref_id');

		if (tipoParam) {
			setFilters((prev) => ({ ...prev, type: tipoParam }));
		}

		if (refIdParam) {
			setFilters((prev) => ({ ...prev, referenceId: refIdParam }));
		}
	}, [searchParams]);

	// Definición de columnas con TanStack Table
	const columns = useMemo(
		() => [
			columnHelper.accessor('movement_number', {
				header: 'Número',
				cell: (info) => <span className='font-mono text-sm'>{info.getValue()}</span>,
				size: 120,
			}),
			columnHelper.accessor('movement_type', {
				header: 'Tipo',
				cell: (info) => getMovementTypeBadge(info.getValue()),
				size: 100,
			}),
			columnHelper.accessor('performed_at', {
				header: 'Fecha',
				cell: (info) => formatDate(info.getValue()),
				size: 120,
			}),
			columnHelper.accessor((row) => row.product?.sku, {
				id: 'sku',
				header: 'SKU',
				cell: (info) => (
					<span className='font-mono text-sm'>{info.getValue() || 'N/A'}</span>
				),
				size: 120,
			}),
			columnHelper.accessor((row) => row.product?.name, {
				id: 'product_name',
				header: 'Producto',
				cell: (info) => info.getValue() || 'N/A',
				size: 200,
			}),
			columnHelper.accessor('quantity', {
				header: 'Cantidad',
				cell: (info) => {
					const value = info.getValue();
					const isNegative = value && value < 0;
					return (
						<span
							className={`font-medium ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
							{isNegative ? '' : '+'}
							{value || 0}
						</span>
					);
				},
				size: 100,
			}),
			columnHelper.accessor((row) => row.warehouse?.name, {
				id: 'warehouse_name',
				header: 'Bodega',
				cell: (info) => info.getValue() || 'N/A',
				size: 150,
			}),
			columnHelper.accessor((row) => row.performer?.name, {
				id: 'performer_name',
				header: 'Usuario',
				cell: (info) => info.getValue() || 'N/A',
				size: 120,
			}),
			columnHelper.display({
				id: 'reference',
				header: 'Referencia',
				cell: ({ row }) => {
					const movement = row.original;
					if (movement.reference_type && movement.reference_id) {
						return (
							<span className='text-sm'>
								{movement.reference_type}#{movement.reference_id}
							</span>
						);
					}
					return <span className='text-gray-400'>-</span>;
				},
				size: 120,
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: ({ row }) => (
					<Button
						size='sm'
						variant='outline'
						icon='HeroInformationCircle'
						onClick={() => handleShowInfo(row.original)}
					/>
				),
				size: 100,
			}),
		],
		[],
	);

	// TanStack Table setup
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
	});

	const getMovementTypeBadge = (type: MovementType) => {
		const typeConfig = {
			IN: { color: 'green' as const, text: 'Entrada', icon: '↗️' },
			OUT: { color: 'red' as const, text: 'Salida', icon: '↙️' },
			ADJUSTMENT: { color: 'blue' as const, text: 'Ajuste', icon: '⚖️' },
			TRANSFER: { color: 'purple' as const, text: 'Transferencia', icon: '🔄' },
			PRODUCTION: { color: 'amber' as const, text: 'Producción', icon: '🏭' },
			RETURN: { color: 'orange' as const, text: 'Devolución', icon: '↩️' },
		};

		const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['ADJUSTMENT'];
		return (
			<Badge color={config.color} variant='outline'>
				{config.icon} {config.text}
			</Badge>
		);
	};

	const handleShowInfo = (movement: IInventoryMovement) => {
		setSelectedMovement(movement);
		setShowInfoModal(true);
	};

	const handleApplyFilters = () => {
		// Aplicar filtros a la tabla
		const activeFilters: ColumnFiltersState = [];

		if (filters.type) {
			activeFilters.push({ id: 'movement_type', value: filters.type });
		}
		if (filters.sku) {
			activeFilters.push({ id: 'sku', value: filters.sku });
		}
		if (filters.warehouse) {
			activeFilters.push({ id: 'warehouse_name', value: filters.warehouse });
		}
		if (filters.user) {
			activeFilters.push({ id: 'performer_name', value: filters.user });
		}

		setColumnFilters(activeFilters);
	};

	const handleClearFilters = () => {
		setFilters({
			dateFrom: '',
			dateTo: '',
			type: '',
			sku: '',
			warehouse: '',
			branch: '',
			user: '',
			referenceType: '',
			referenceId: '',
		});
		setColumnFilters([]);
		setGlobalFilter('');
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Historial de Movimientos</h1>
					<p className='text-zinc-500'>Registro completo de movimientos de inventario</p>
				</div>
			</div>

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6'>
						{/* Búsqueda global */}
						<Input
							placeholder='Buscar...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							icon='HeroMagnifyingGlass'
						/>

						{/* Fecha desde */}
						<Input
							name='dateFrom'
							type='date'
							placeholder='Fecha desde'
							value={filters.dateFrom}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
							}
						/>

						{/* Fecha hasta */}
						<Input
							type='date'
							placeholder='Fecha hasta'
							value={filters.dateTo}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
							}
						/>

						{/* Tipo de movimiento */}
						<Select
							value={filters.type}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, type: e.target.value }))
							}>
							<option value=''>Todos los tipos</option>
							<option value='IN'>Entrada</option>
							<option value='OUT'>Salida</option>
							<option value='TRANSFER'>Transferencia</option>
							<option value='ADJUSTMENT'>Ajuste</option>
							<option value='PRODUCTION'>Producción</option>
							<option value='RETURN'>Devolución</option>
						</Select>

						{/* SKU */}
						<Input
							placeholder='SKU'
							value={filters.sku}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, sku: e.target.value }))
							}
						/>

						{/* Bodega */}
						<Select
							value={filters.warehouse}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, warehouse: e.target.value }))
							}>
							<option value=''>Todas las bodegas</option>
							{MOCK_WAREHOUSES.map((warehouse) => (
								<option key={warehouse.id} value={warehouse.name}>
									{warehouse.name}
								</option>
							))}
						</Select>

						{/* Sucursal */}
						<Select
							value={filters.branch}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, branch: e.target.value }))
							}>
							<option value=''>Todas las sucursales</option>
							{MOCK_BRANCHES.map((branch) => (
								<option key={branch.id} value={branch.name}>
									{branch.name}
								</option>
							))}
						</Select>

						{/* Usuario */}
						<Select
							value={filters.user}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, user: e.target.value }))
							}>
							<option value=''>Todos los usuarios</option>
							{MOCK_USERS.map((user) => (
								<option key={user.id} value={user.name}>
									{user.name}
								</option>
							))}
						</Select>

						{/* Tipo de referencia */}
						<Select
							value={filters.referenceType}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, referenceType: e.target.value }))
							}>
							<option value=''>Todos los orígenes</option>
							<option value='transfer'>Transferencia</option>
							<option value='sale'>Venta</option>
							<option value='purchase'>Compra</option>
							<option value='adjustment'>Ajuste</option>
						</Select>

						{/* ID de referencia */}
						<Input
							placeholder='ID referencia'
							value={filters.referenceId}
							onChange={(e) =>
								setFilters((prev) => ({ ...prev, referenceId: e.target.value }))
							}
						/>

						{/* Botones */}
						<Button onClick={handleApplyFilters} icon='HeroFunnel'>
							Filtrar
						</Button>

						<Button variant='outline' onClick={handleClearFilters} icon='HeroXMark'>
							Limpiar
						</Button>
					</div>
				</CardBody>
			</Card>

			{/* Tabla con TanStack */}
			<Card>
				<CardHeader>
					<CardTitle>
						Movimientos ({table.getFilteredRowModel().rows.length} de {data.length})
					</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='overflow-x-auto'>
						<table className='min-w-full table-auto'>
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className='border-b px-4 py-3 text-left font-medium'
												style={{ width: header.getSize() }}
												onClick={header.column.getToggleSortingHandler()}>
												{header.isPlaceholder ? null : (
													<div className='flex cursor-pointer select-none items-center space-x-1'>
														{flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
														{{
															asc: ' ↗️',
															desc: ' ↙️',
														}[header.column.getIsSorted() as string] ??
															null}
													</div>
												)}
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.map((row) => (
									<tr key={row.id} className='hover:bg-gray-50'>
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className='border-b px-4 py-3'>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Paginación */}
					<div className='mt-4 flex items-center justify-between'>
						<div className='flex items-center space-x-2'>
							<span className='text-sm text-gray-700'>
								Mostrando{' '}
								{table.getState().pagination.pageIndex *
									table.getState().pagination.pageSize +
									1}{' '}
								a{' '}
								{Math.min(
									(table.getState().pagination.pageIndex + 1) *
										table.getState().pagination.pageSize,
									table.getFilteredRowModel().rows.length,
								)}{' '}
								de {table.getFilteredRowModel().rows.length} registros
							</span>
						</div>
						<div className='flex items-center space-x-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}>
								Anterior
							</Button>
							<span className='text-sm'>
								Página {table.getState().pagination.pageIndex + 1} de{' '}
								{table.getPageCount()}
							</span>
							<Button
								variant='outline'
								size='sm'
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}>
								Siguiente
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Modal de información del movimiento */}
			<Modal isOpen={showInfoModal} setIsOpen={setShowInfoModal} size='2xl'>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Información del Movimiento</h3>
				</ModalHeader>
				<ModalBody>
					{selectedMovement && (
						<div className='space-y-6'>
							{/* Información básica */}
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Número de Movimiento
									</label>
									<p className='mt-1 font-mono text-sm'>
										{selectedMovement.movement_number}
									</p>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Tipo
									</label>
									<div className='mt-1'>
										{getMovementTypeBadge(selectedMovement.movement_type)}
									</div>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Fecha
									</label>
									<p className='mt-1 text-sm'>
										{formatDate(selectedMovement.performed_at)}
									</p>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Usuario
									</label>
									<p className='mt-1 text-sm'>
										{selectedMovement.performer?.name || 'N/A'}
									</p>
								</div>
							</div>

							{/* Producto */}
							<div>
								<label className='block text-sm font-medium text-gray-700'>
									Producto
								</label>
								<div className='mt-1 rounded-lg bg-gray-50 p-3'>
									<p className='font-medium'>{selectedMovement.product?.name}</p>
									<p className='font-mono text-sm text-gray-600'>
										SKU: {selectedMovement.product?.sku}
									</p>
								</div>
							</div>

							{/* Cantidad y bodega */}
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Cantidad
									</label>
									<p
										className={`mt-1 text-lg font-semibold ${
											selectedMovement.quantity &&
											selectedMovement.quantity < 0
												? 'text-red-600'
												: 'text-emerald-600'
										}`}>
										{selectedMovement.quantity && selectedMovement.quantity < 0
											? ''
											: '+'}
										{selectedMovement.quantity || 0}
									</p>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Bodega
									</label>
									<p className='mt-1 text-sm'>
										{selectedMovement.warehouse?.name || 'N/A'}
									</p>
								</div>
							</div>

							{/* Referencia */}
							{selectedMovement.reference_type && selectedMovement.reference_id && (
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Referencia
									</label>
									<div className='mt-1 rounded-lg bg-sky-50 p-3'>
										<p className='font-medium'>
											{selectedMovement.reference_type}#
											{selectedMovement.reference_id}
										</p>
										<Button
											size='sm'
											variant='outline'
											className='mt-2'
											onClick={() => {
												// Deep-link a la referencia correspondiente
												if (
													selectedMovement.reference_type === 'transfer'
												) {
													window.open(
														`/inventario/transferencias?id=${selectedMovement.reference_id}`,
														'_blank',
													);
												}
											}}>
											Ver Referencia
										</Button>
									</div>
								</div>
							)}

							{/* Notas */}
							{selectedMovement.notes && (
								<div>
									<label className='block text-sm font-medium text-gray-700'>
										Notas
									</label>
									<div className='mt-1 rounded-lg bg-gray-50 p-3'>
										<p className='text-sm'>{selectedMovement.notes}</p>
									</div>
								</div>
							)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowInfoModal(false)}>
						Cerrar
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default HistorialInventario;
