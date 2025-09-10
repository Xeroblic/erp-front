/**
 * Página Principal de Administración de Transferencias
 * Sistema completo de gestión de transferencias entre sucursales
 */
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import { ITransfer, TransferStatus } from '@/interface/transfers.interface';
import {
	ITransferFilters,
	ITransferStats,
	ICreateTransferRequest,
	IReceiveTransferRequest,
} from './types/transfers.types';
import {
	CreateEditTransferModal,
	ReceiveTransferModal,
	TransferDetailModal,
	CancelTransferModal,
	TransfersTable,
} from './components';
import { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';

const TransferenciasAdmin: React.FC = () => {
	// Estados principales
	const [transfers, setTransfers] = useState<ITransfer[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);

	// Estados para filtros
	const [filters, setFilters] = useState<ITransferFilters>({
		search: '',
		status: undefined,
		from_warehouse_id: '',
		to_warehouse_id: '',
		date_from: '',
		date_to: '',
	});

	// Estados para estadísticas
	const [stats, setStats] = useState<ITransferStats>({
		total_transfers: 0,
		pending_transfers: 0,
		in_transit_transfers: 0,
		completed_transfers: 0,
		total_items_transferred: 0,
		total_value_transferred: 0,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [receiveModalOpen, setReceiveModalOpen] = useState(false);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [selectedTransfer, setSelectedTransfer] = useState<ITransfer | null>(null);

	// Mock data - reemplazar con datos reales
	const [warehouses] = useState<TSelectOptions>([
		{ value: '', label: 'Todas las sucursales' },
		{ value: '1', label: 'Almacén Central - Bogotá' },
		{ value: '2', label: 'Sucursal Norte - Medellín' },
		{ value: '3', label: 'Sucursal Sur - Cali' },
		{ value: '4', label: 'Sucursal Oriente - Bucaramanga' },
	]);

	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'PENDING', label: 'Pendientes' },
		{ value: 'SHIPPED', label: 'Enviadas' },
		{ value: 'COMPLETED', label: 'Completadas' },
		{ value: 'CANCELLED', label: 'Canceladas' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadTransfers();
		loadStats();
	}, [filters, currentPage]);

	const loadTransfers = async () => {
		setLoading(true);
		try {
			// Mock data - reemplazar con llamada real a la API
			const mockTransfers: ITransfer[] = [
				{
					id: 1,
					company_id: 1,
					transfer_number: 'TR-2024-001',
					from_warehouse_id: 1,
					to_warehouse_id: 2,
					status: 'PENDING' as TransferStatus,
					created_at: '2024-01-15T10:00:00Z',
					updated_at: '2024-01-15T10:00:00Z',
					from_warehouse: {
						id: 1,
						name: 'Almacén Central',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					to_warehouse: {
						id: 2,
						name: 'Sucursal Norte',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					items: [
						{
							id: 1,
							transfer_id: 1,
							product_id: 1,
							quantity: 10,
							received_quantity: 0,
							created_at: '2024-01-15T10:00:00Z',
							updated_at: '2024-01-15T10:00:00Z',
						},
					],
					total_quantity: 10,
					items_count: 1,
				},
				{
					id: 2,
					company_id: 1,
					transfer_number: 'TR-2024-002',
					from_warehouse_id: 2,
					to_warehouse_id: 3,
					status: 'SHIPPED' as TransferStatus,
					created_at: '2024-01-14T08:30:00Z',
					updated_at: '2024-01-14T14:30:00Z',
					shipped_at: '2024-01-14T14:30:00Z',
					from_warehouse: {
						id: 2,
						name: 'Sucursal Norte',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					to_warehouse: {
						id: 3,
						name: 'Sucursal Sur',
						company_id: 1,
						is_active: true,
						created_at: '',
						updated_at: '',
					},
					items: [
						{
							id: 2,
							transfer_id: 2,
							product_id: 2,
							quantity: 25,
							received_quantity: 0,
							created_at: '2024-01-14T08:30:00Z',
							updated_at: '2024-01-14T08:30:00Z',
						},
					],
					total_quantity: 25,
					items_count: 1,
				},
			];

			setTransfers(mockTransfers);
			setTotalItems(mockTransfers.length);
		} catch (error) {
			console.error('Error loading transfers:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			// Mock stats - reemplazar con llamada real a la API
			const mockStats: ITransferStats = {
				total_transfers: 45,
				pending_transfers: 12,
				in_transit_transfers: 8,
				completed_transfers: 23,
				total_items_transferred: 1250,
				total_value_transferred: 35000000,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Handlers para filtros
	const handleFilterChange = (key: keyof ITransferFilters, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			status: undefined,
			from_warehouse_id: '',
			to_warehouse_id: '',
			date_from: '',
			date_to: '',
		});
		setCurrentPage(1);
	};

	// Handlers para modales
	const handleCreateTransfer = async (transferData: ICreateTransferRequest) => {
		try {
			// Mock - reemplazar con llamada real a la API
			console.log('Creating transfer:', transferData);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setCreateModalOpen(false);
			await loadTransfers();
			await loadStats();
		} catch (error) {
			console.error('Error creating transfer:', error);
		}
	};

	const handleEditTransfer = (transfer: ITransfer) => {
		setSelectedTransfer(transfer);
		setEditModalOpen(true);
	};

	const handleUpdateTransfer = async (transferData: ICreateTransferRequest) => {
		try {
			// Mock - reemplazar con llamada real a la API
			console.log('Updating transfer:', transferData);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setEditModalOpen(false);
			setSelectedTransfer(null);
			await loadTransfers();
			await loadStats();
		} catch (error) {
			console.error('Error updating transfer:', error);
		}
	};

	const handleReceiveTransfer = (transfer: ITransfer) => {
		setSelectedTransfer(transfer);
		setReceiveModalOpen(true);
	};

	const handleConfirmReceive = async (receiveData: IReceiveTransferRequest) => {
		try {
			// Mock - reemplazar con llamada real a la API
			console.log('Receiving transfer:', receiveData);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setReceiveModalOpen(false);
			setSelectedTransfer(null);
			await loadTransfers();
			await loadStats();
		} catch (error) {
			console.error('Error receiving transfer:', error);
		}
	};

	const handleViewTransfer = (transfer: ITransfer) => {
		setSelectedTransfer(transfer);
		setDetailModalOpen(true);
	};

	const handleCancelTransfer = (transfer: ITransfer) => {
		setSelectedTransfer(transfer);
		setCancelModalOpen(true);
	};

	const handleConfirmCancel = async (transfer: ITransfer) => {
		try {
			// Mock - reemplazar con llamada real a la API
			console.log('Cancelling transfer:', transfer.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setCancelModalOpen(false);
			setSelectedTransfer(null);
			await loadTransfers();
			await loadStats();
		} catch (error) {
			console.error('Error cancelling transfer:', error);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const getProgressColor = (count: number, total: number) => {
		const percentage = total > 0 ? (count / total) * 100 : 0;
		if (percentage >= 80) return 'emerald';
		if (percentage >= 50) return 'amber';
		return 'red';
	};

	return (
		<PageWrapper name='transferencias-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
							<Icon
								icon='HeroTruck'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Transferencias
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de transferencias entre sucursales
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={() => setCreateModalOpen(true)} icon='HeroPlus'>
						Nueva Transferencia
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon
									icon='HeroDocumentDuplicate'
									className='h-6 w-6 text-blue-600'
								/>
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Total Transferencias
								</p>
								<p className='text-2xl font-bold text-gray-900 dark:text-white'>
									{stats.total_transfers.toLocaleString('es-CO')}
								</p>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
								<Icon icon='HeroClock' className='h-6 w-6 text-amber-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Pendientes
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.pending_transfers.toLocaleString('es-CO')}
									</p>
									<Badge
										color={getProgressColor(
											stats.pending_transfers,
											stats.total_transfers,
										)}>
										{stats.total_transfers > 0
											? Math.round(
													(stats.pending_transfers /
														stats.total_transfers) *
														100,
												)
											: 0}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroTruck' className='h-6 w-6 text-blue-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									En Tránsito
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.in_transit_transfers.toLocaleString('es-CO')}
									</p>
									<Badge color='blue'>
										{stats.total_transfers > 0
											? Math.round(
													(stats.in_transit_transfers /
														stats.total_transfers) *
														100,
												)
											: 0}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody className='flex items-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20'>
								<Icon icon='HeroCheckCircle' className='h-6 w-6 text-emerald-600' />
							</div>
							<div className='ml-4'>
								<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
									Completadas
								</p>
								<div className='flex items-center space-x-2'>
									<p className='text-2xl font-bold text-gray-900 dark:text-white'>
										{stats.completed_transfers.toLocaleString('es-CO')}
									</p>
									<Badge color='emerald'>
										{stats.total_transfers > 0
											? Math.round(
													(stats.completed_transfers /
														stats.total_transfers) *
														100,
												)
											: 0}
										%
									</Badge>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Filtros de Búsqueda</CardTitle>
							<Button variant='outline' size='sm' onClick={clearFilters}>
								<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
								Limpiar Filtros
							</Button>
						</div>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar
								</label>
								<Input
									type='text'
									name='search'
									placeholder='Número, producto...'
									value={filters.search}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Estado
								</label>
								<SelectReact
									name='status'
									options={statusOptions}
									value={statusOptions.find(
										(option) => option.value === filters.status,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('status', option?.value || '');
									}}
									placeholder='Seleccionar estado...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Sucursal Origen
								</label>
								<SelectReact
									name='from_warehouse'
									options={warehouses}
									value={warehouses.find(
										(option) => option.value === filters.from_warehouse_id,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'from_warehouse_id',
											option?.value || '',
										);
									}}
									placeholder='Seleccionar origen...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Sucursal Destino
								</label>
								<SelectReact
									name='to_warehouse'
									options={warehouses}
									value={warehouses.find(
										(option) => option.value === filters.to_warehouse_id,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('to_warehouse_id', option?.value || '');
									}}
									placeholder='Seleccionar destino...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha Desde
								</label>
								<Input
									type='date'
									name='date_from'
									value={filters.date_from}
									onChange={(e) =>
										handleFilterChange('date_from', e.target.value)
									}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha Hasta
								</label>
								<Input
									type='date'
									name='date_to'
									value={filters.date_to}
									onChange={(e) => handleFilterChange('date_to', e.target.value)}
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de Transferencias */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Transferencias</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{transfers.length} de {totalItems} transferencias
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody className='p-0'>
						<TransfersTable
							transfers={transfers}
							isLoading={loading}
							onView={handleViewTransfer}
							onEdit={handleEditTransfer}
							onReceive={handleReceiveTransfer}
							onCancel={handleCancelTransfer}
						/>
					</CardBody>
				</Card>
			</Container>

			{/* Modales */}
			<CreateEditTransferModal
				isOpen={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSubmit={handleCreateTransfer}
				isLoading={loading}
			/>

			<CreateEditTransferModal
				isOpen={editModalOpen}
				onClose={() => {
					setEditModalOpen(false);
					setSelectedTransfer(null);
				}}
				onSubmit={handleUpdateTransfer}
				transfer={selectedTransfer}
				isLoading={loading}
			/>

			<ReceiveTransferModal
				isOpen={receiveModalOpen}
				onClose={() => {
					setReceiveModalOpen(false);
					setSelectedTransfer(null);
				}}
				onSubmit={handleConfirmReceive}
				transfer={selectedTransfer}
				isLoading={loading}
			/>

			<TransferDetailModal
				isOpen={detailModalOpen}
				onClose={() => {
					setDetailModalOpen(false);
					setSelectedTransfer(null);
				}}
				transfer={selectedTransfer}
			/>

			<CancelTransferModal
				isOpen={cancelModalOpen}
				onClose={() => {
					setCancelModalOpen(false);
					setSelectedTransfer(null);
				}}
				onConfirm={handleConfirmCancel}
				transfer={selectedTransfer}
				loading={loading}
			/>
		</PageWrapper>
	);
};

export default TransferenciasAdmin;
