/**
 * Vista principal del módulo de Historial de Inventario
 * Diseño basado en la estructura de Gestión de Ventas
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks y servicios
import useMovementsManager, { MovementFilters } from './hooks/useMovementsManager';
import { TransferDirection } from '@/interface/transfers.interface';

// Componentes específicos del módulo
import TransfersTable from '@/pages/comercial/transferencias/components/tables/TransfersTable';
import TransferDetailModal from '@/pages/comercial/transferencias/components/modals/TransferDetailModal';

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
	const [selectedTransfer, setSelectedTransfer] = useState<number | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const hasAppliedUrlFilters = useRef(false);

	// Hooks de búsqueda y navegación
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	// Hook de gestión principal
	const {
		transfers,
		loading,
		error,
		stats,
		filters,
		setFilters,
		totalPages,
		clearFilters,
		refreshTransfers,
	} = useMovementsManager();

	// Cargar filtros desde URL
	useEffect(() => {
		if (hasAppliedUrlFilters.current) return;
		const rawDirection = (searchParams.get('tipo') || '').toLowerCase();
		const allowedDirections: TransferDirection[] = ['all', 'sent', 'received'];
		if (rawDirection && allowedDirections.includes(rawDirection as TransferDirection)) {
			const urlFilters: MovementFilters = { direction: rawDirection as TransferDirection };
			setFilters({ ...filters, ...urlFilters });
			hasAppliedUrlFilters.current = true;
			toast.info(`Filtros aplicados desde la navegación`);
		}
	}, [searchParams, filters, setFilters]);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	// Handlers para modales
	const handleViewDetails = (transferId: number) => {
		setSelectedTransfer(transferId);
		setIsDetailsModalOpen(true);
	};

	return (
		<PageWrapper title='Historial de Transferencias' name='historial'>
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
								Historial de Transferencias
							</h1>
							<p className='text-gray-500 dark:text-gray-400'>
								Consulta las transferencias registradas en la sucursal seleccionada
							</p>
						</div>
					</div>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							color='gray'
							icon='HeroArrowDownTray'
							onClick={() => refreshTransfers()}>
							Actualizar
						</Button>
						<Button color='sky' icon='HeroPlus' onClick={() => navigate('/inventario/transferencias')}>
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
										Transferencias Totales
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.total.toLocaleString()}
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
										Enviadas
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.sent.toLocaleString()}
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
										Recibidas
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.received.toLocaleString()}
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
										Pendientes / borrador
									</p>
									<p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
										{stats.pending.toLocaleString()}
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
									placeholder='Número, notas...'
									value={filters.search || ''}
									onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								/>
							</div>

							{/* Dirección */}
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Dirección
								</label>
								<Select
									name='direction'
									value={filters.direction || 'all'}
									onChange={(e) => setFilters({ ...filters, direction: e.target.value as TransferDirection })}>
									<option value='all'>Todas</option>
									<option value='sent'>Enviadas</option>
									<option value='received'>Recibidas</option>
								</Select>
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
								Lista de Transferencias ({transfers.length} registros)
							</CardTitle>
							<div className='text-sm text-gray-500 dark:text-gray-400'>Total páginas {totalPages}</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						<TransfersTable transfers={transfers} isLoading={loading} onView={(transfer) => handleViewDetails(transfer.id)} />
					</CardBody>
				</Card>

				{/* Modal de detalles */}
				<TransferDetailModal
					transfer={transfers.find((t) => t.id === selectedTransfer) || null}
					isOpen={isDetailsModalOpen}
					onClose={() => setIsDetailsModalOpen(false)}
				/>
			</Container>
		</PageWrapper>
	);
};

export default HistorialInventarioAdmin;
