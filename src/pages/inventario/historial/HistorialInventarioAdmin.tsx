/**
 * Vista principal del módulo de Historial de Inventario
 * Diseño basado en la estructura de Gestión de Ventas
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks y servicios
import useMovementsManager, { MovementFilters } from './hooks/useMovementsManager';
import { IInventoryMovement } from '@/interface/inventory.interface';
import { NormalizedMovementType } from './utils/movementType.utils';

// Componentes específicos del módulo
import MovementsTable from './components/tables/MovementsTable';
import MovementDetailsModal from './components/modals/MovementDetailsModal';

// UI Components
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/ui/Card';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Input from '../../../components/form/Input';
import Select from '../../../components/form/Select';
import Icon from '../../../components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';

const HistorialInventarioAdmin: React.FC = () => {
	// Estados locales para modales
	const [selectedMovement, setSelectedMovement] = useState<IInventoryMovement | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

	// Hooks de búsqueda y navegación
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	// Hook de gestión principal
	const {
		filteredMovements,
		loading,
		error,
		stats,
		filters,
		setFilters,
		currentPage,
		setCurrentPage,
		itemsPerPage,
		totalItems,
		totalPages,
		clearFilters,
		warehouses,
	} = useMovementsManager();

	// Cargar filtros desde URL
	useEffect(() => {
		const tipoParam = searchParams.get('tipo');
		const tipo = tipoParam
			? (tipoParam.toUpperCase() as NormalizedMovementType)
			: undefined;
		const almacen = searchParams.get('almacen');

		if (tipo || almacen) {
			const urlFilters: MovementFilters = {};
			if (tipo) urlFilters.type = tipo;
			if (almacen) urlFilters.warehouseId = parseInt(almacen);

			setFilters({ ...filters, ...urlFilters });
			toast.info(`Filtros aplicados desde la navegación`);
		}
	}, [searchParams]);

	// Handlers para modales
	const handleViewDetails = (movement: IInventoryMovement) => {
		setSelectedMovement(movement);
		setIsDetailsModalOpen(true);
	};

	// Obtener movimientos paginados
	const paginatedMovements = filteredMovements;

	return (
		<PageWrapper title='Historial de Inventario' name='historial'>
			<Container>
				{/* Header Principal - Estilo Gestión de Ventas */}
				<div className='mb-6 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900'>
							<Icon
								icon='HeroClipboardDocumentList'
								className='h-8 w-8 text-blue-600'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
								Historial de Inventario
							</h1>
							<p className='text-gray-500 dark:text-gray-400'>
								Administra y controla todos los movimientos del inventario
							</p>
						</div>
					</div>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							color='gray'
							icon='HeroArrowDownTray'
							onClick={() => console.log('Exportar')}>
							Exportar
						</Button>
						<Button
							color='sky'
							icon='HeroPlus'
							onClick={() => navigate('/inventario/transferencias')}>
							Nueva Transferencia
						</Button>
					</div>
				</div>

				{/* Tarjetas de Estadísticas - Estilo Gestión de Ventas */}
				<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='p-4'>
							<div className='flex items-center gap-3'>
								<div className='rounded-full bg-blue-100 p-3 dark:bg-blue-900'>
									<Icon
										icon='HeroChartBarSquare'
										className='h-6 w-6 text-blue-600'
									/>
								</div>
								<div>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Movimientos Totales
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.totalMovements.toLocaleString()}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='p-4'>
							<div className='flex items-center gap-3'>
								<div className='rounded-full bg-green-100 p-3 dark:bg-green-900'>
									<Icon
										icon='HeroArrowUpCircle'
										className='h-6 w-6 text-green-600'
									/>
								</div>
								<div>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Entradas
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.totalEntries.toLocaleString()}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='p-4'>
							<div className='flex items-center gap-3'>
								<div className='rounded-full bg-orange-100 p-3 dark:bg-orange-900'>
									<Icon
										icon='HeroArrowDownCircle'
										className='h-6 w-6 text-orange-600'
									/>
								</div>
								<div>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Salidas
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.totalExits.toLocaleString()}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='p-4'>
							<div className='flex items-center gap-3'>
								<div className='rounded-full bg-purple-100 p-3 dark:bg-purple-900'>
									<Icon
										icon='HeroArrowsRightLeft'
										className='h-6 w-6 text-purple-600'
									/>
								</div>
								<div>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Transferencias
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.totalTransfers.toLocaleString()}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Filtros y Búsqueda - Estilo Gestión de Ventas */}
				<Card className='mb-6'>
					<CardHeader>
						<CardTitle>Filtros y Búsqueda</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
							{/* Búsqueda */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar
								</label>
								<Input
									name='search'
									type='text'
									placeholder='Número, producto...'
									value={filters.search || ''}
									onChange={(e) =>
										setFilters({ ...filters, search: e.target.value })
									}
								/>
							</div>

							{/* Tipo de Movimiento */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Tipo de movimiento
								</label>
								<Select
									name='movementType'
									value={filters.type || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											type: (e.target.value || undefined) as NormalizedMovementType | undefined,
										})
									}>
									<option value=''>Todos los estados</option>
									<option value='IN'>Entradas</option>
									<option value='OUT'>Salidas</option>
									<option value='TRANSFER'>Transferencias</option>
									<option value='ADJUST'>Ajustes</option>
									<option value='RETURN'>Retornos</option>
								</Select>
							</div>

							{/* Almacén */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Almacén
								</label>
								<Select
									name='warehouse'
									value={filters.warehouseId || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											warehouseId: e.target.value
												? parseInt(e.target.value)
												: undefined,
										})
									}>
									<option value=''>Todos los almacenes</option>
									{warehouses.map((warehouse) => (
										<option key={warehouse.id} value={warehouse.id}>
											{warehouse.name}
										</option>
									))}
								</Select>
							</div>

							{/* Fecha Desde */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha Desde
								</label>
								<Input
									name='dateFrom'
									type='date'
									value={filters.dateFrom || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											dateFrom: e.target.value || undefined,
										})
									}
								/>
							</div>

							{/* Fecha Hasta */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha Hasta
								</label>
								<Input
									name='dateTo'
									type='date'
									value={filters.dateTo || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											dateTo: e.target.value || undefined,
										})
									}
								/>
							</div>
						</div>

						{/* Botones de acción de filtros */}
						<div className='mt-4 flex justify-end gap-3'>
							<Button variant='outline' color='gray' onClick={clearFilters}>
								Limpiar Filtros
							</Button>
						</div>
					</CardBody>
				</Card>

				{/* Lista de Movimientos - Estilo Gestión de Ventas */}
				<Card>
					<CardHeader>
						<div className='flex w-full items-center justify-between'>
							<CardTitle>
								Lista de Movimientos ({filteredMovements.length} registros)
							</CardTitle>
							<div className='text-sm text-gray-500 dark:text-gray-400'>
								Página {currentPage} de {totalPages}
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						<MovementsTable
							data={paginatedMovements}
							loading={loading}
							onViewDetails={handleViewDetails}
						/>
					</CardBody>
				</Card>

				{/* Modal de detalles */}
				<MovementDetailsModal
					movement={selectedMovement}
					isOpen={isDetailsModalOpen}
					setIsOpen={setIsDetailsModalOpen}
				/>
			</Container>
		</PageWrapper>
	);
};

export default HistorialInventarioAdmin;
