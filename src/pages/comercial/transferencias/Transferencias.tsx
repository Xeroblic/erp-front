import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchTransfers,
	setFilters,
	clearFilters,
	selectTransfers,
	selectTransfersLoading,
	selectTransfersPagination,
	selectTransferFilters,
} from '@/store/slices/transfers/transfersSlice';
import { shipTransfer, cancelTransfer } from '@/store/slices/transfers/transfersSlice';

// Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TBody, Td, TFoot, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Pagination from '@/components/ui/Pagination';
import { ERP_PERMISSIONS } from '@/constants/erp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import type { ITransfer, TransferStatus } from '@/interface/transfers.interface';
import { formatDate } from '@/utils/format.utils';

const Transferencias: React.FC = () => {
	const dispatch = useAppDispatch();

	// Redux state
	const transfers = useAppSelector(selectTransfers);
	const loading = useAppSelector(selectTransfersLoading);
	const pagination = useAppSelector(selectTransfersPagination);
	const filters = useAppSelector(selectTransferFilters);

	// Local state
	const [selectedTransfer, setSelectedTransfer] = useState<ITransfer | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showActionModal, setShowActionModal] = useState(false);
	const [actionType, setActionType] = useState<'ship' | 'cancel' | null>(null);

	// Filtros locales
	const [localFilters, setLocalFilters] = useState({
		status: '',
		from_warehouse_id: '',
		to_warehouse_id: '',
		date_from: '',
		date_to: '',
	});

	// Cargar transferencias al montar
	useEffect(() => {
		dispatch(fetchTransfers({ page: 1, filters }));
	}, [dispatch, filters]);

	// Handlers
	const handleApplyFilters = () => {
		const activeFilters = Object.fromEntries(
			Object.entries(localFilters).filter(([_, value]) => value !== ''),
		);
		dispatch(setFilters(activeFilters));
	};

	const handleClearFilters = () => {
		setLocalFilters({
			status: '',
			from_warehouse_id: '',
			to_warehouse_id: '',
			date_from: '',
			date_to: '',
		});
		dispatch(clearFilters());
	};

	const handlePageChange = (page: number) => {
		dispatch(fetchTransfers({ page, filters }));
	};

	const handleTransferAction = async () => {
		if (!selectedTransfer || !actionType) return;

		try {
			if (actionType === 'ship') {
				await dispatch(shipTransfer(selectedTransfer.id)).unwrap();
			} else if (actionType === 'cancel') {
				await dispatch(cancelTransfer(selectedTransfer.id)).unwrap();
			}

			setShowActionModal(false);
			setSelectedTransfer(null);
			setActionType(null);

			// Recargar lista
			dispatch(fetchTransfers({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice con toast
		}
	};

	const getStatusBadge = (status: TransferStatus) => {
		const statusConfig = {
			PENDING: { color: 'amber' as const, text: 'Pendiente' },
			APPROVED: { color: 'blue' as const, text: 'Aprobada' },
			SHIPPED: { color: 'violet' as const, text: 'Enviada' },
			PARTIALLY_RECEIVED: { color: 'amber' as const, text: 'Parcialmente Recibida' },
			COMPLETED: { color: 'emerald' as const, text: 'Completada' },
			CANCELLED: { color: 'red' as const, text: 'Cancelada' },
		};

		const config = statusConfig[status] || statusConfig['PENDING'];
		return <Badge color={config.color}>{config.text}</Badge>;
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Transferencias</h1>
					<p className='text-zinc-500'>Gestión de transferencias entre almacenes</p>
				</div>

				<PermissionGuard permissions={[ERP_PERMISSIONS.TRANSFERS.CREATE]}>
					<Button
						variant='solid'
						onClick={() => setShowCreateModal(true)}
						icon='HeroPlus'>
						Nueva Transferencia
					</Button>
				</PermissionGuard>
			</div>

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Filtros</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
						<Select
							name='status'
							placeholder='Estado'
							value={localFilters.status}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, status: e.target.value })
							}>
							<option value=''>Todos</option>
							<option value='PENDING'>Pendiente</option>
							<option value='APPROVED'>Aprobada</option>
							<option value='SHIPPED'>Enviada</option>
							<option value='PARTIALLY_RECEIVED'>Parcialmente Recibida</option>
							<option value='COMPLETED'>Completada</option>
							<option value='CANCELLED'>Cancelada</option>
						</Select>

						<Input
							name='date_from'
							type='date'
							placeholder='Fecha desde'
							value={localFilters.date_from}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_from: e.target.value })
							}
						/>

						<Input
							name='date_to'
							type='date'
							placeholder='Fecha hasta'
							value={localFilters.date_to}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_to: e.target.value })
							}
						/>

						<Button onClick={handleApplyFilters} icon='HeroMagnifyingGlass'>
							Filtrar
						</Button>

						<Button variant='outline' onClick={handleClearFilters} icon='HeroXMark'>
							Limpiar
						</Button>
					</div>
				</CardBody>
			</Card>

			{/* Tabla de transferencias */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Lista de Transferencias ({pagination.totalTransfers})</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table className='table-fixed max-md:min-w-[70rem]'>
						<THead>
							<Tr>
								<Th className='w-32'>Número</Th>
								<Th>Origen</Th>
								<Th>Destino</Th>
								<Th>Estado</Th>
								<Th>Items</Th>
								<Th>Progreso</Th>
								<Th>Fecha Creación</Th>
								<Th className='w-40'>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{loading ? (
								<Tr>
									<Td colSpan={8} className='py-8 text-center'>
										Cargando transferencias...
									</Td>
								</Tr>
							) : transfers.length === 0 ? (
								<Tr>
									<Td colSpan={8} className='py-8 text-center'>
										No hay transferencias registradas
									</Td>
								</Tr>
							) : (
								transfers.map((transfer) => (
									<Tr key={transfer.id}>
										<Td className='font-mono'>{transfer.transfer_number}</Td>
										<Td>{transfer.from_warehouse?.name || 'N/A'}</Td>
										<Td>{transfer.to_warehouse?.name || 'N/A'}</Td>
										<Td>{getStatusBadge(transfer.status)}</Td>
										<Td>{transfer.items_count || 0}</Td>
										<Td>
											{transfer.completion_percentage !== undefined && (
												<div className='flex items-center space-x-2'>
													<div className='h-2 flex-1 rounded-full bg-gray-200'>
														<div
															className='h-2 rounded-full bg-blue-500'
															style={{
																width: `${transfer.completion_percentage}%`,
															}}
														/>
													</div>
													<span className='text-sm text-gray-600'>
														{Math.round(transfer.completion_percentage)}
														%
													</span>
												</div>
											)}
										</Td>
										<Td>{formatDate(transfer.created_at)}</Td>
										<Td>
											<div className='flex space-x-1'>
												<PermissionGuard
													permissions={[ERP_PERMISSIONS.TRANSFERS.VIEW]}>
													<Button
														size='sm'
														variant='outline'
														icon='HeroEye'
														onClick={() => {
															// Navigate to detail view
															window.location.href = `/gestion/transferencias/${transfer.id}`;
														}}
													/>
												</PermissionGuard>

												{transfer.status === 'PENDING' && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.TRANSFERS.SHIP,
														]}>
														<Button
															size='sm'
															color='emerald'
															icon='HeroTruck'
															onClick={() => {
																setSelectedTransfer(transfer);
																setActionType('ship');
																setShowActionModal(true);
															}}
														/>
													</PermissionGuard>
												)}

												{['PENDING', 'APPROVED'].includes(
													transfer.status,
												) && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.TRANSFERS.CANCEL,
														]}>
														<Button
															size='sm'
															color='red'
															icon='HeroXMark'
															onClick={() => {
																setSelectedTransfer(transfer);
																setActionType('cancel');
																setShowActionModal(true);
															}}
														/>
													</PermissionGuard>
												)}
											</div>
										</Td>
									</Tr>
								))
							)}
						</TBody>
					</Table>

					{pagination.totalPages > 1 && (
						<TFoot>
							<Tr>
								<Td colSpan={8}>
									<div className='flex justify-center py-4'>
										<Pagination
											currentPage={pagination.currentPage}
											totalPages={pagination.totalPages}
											onPageChange={handlePageChange}
										/>
									</div>
								</Td>
							</Tr>
						</TFoot>
					)}
				</CardBody>
			</Card>

			{/* Modal de confirmación de acciones */}
			<Modal isOpen={showActionModal} setIsOpen={setShowActionModal}>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>
						{actionType === 'ship' ? 'Enviar Transferencia' : 'Cancelar Transferencia'}
					</h3>
				</ModalHeader>
				<ModalBody>
					<p>
						{actionType === 'ship'
							? '¿Está seguro que desea marcar esta transferencia como enviada? Esta acción reservará el inventario.'
							: '¿Está seguro que desea cancelar esta transferencia? Esta acción no se puede deshacer.'}
					</p>
					{selectedTransfer && (
						<div className='mt-4 rounded-lg bg-gray-50 p-3'>
							<p>
								<strong>Número:</strong> {selectedTransfer.transfer_number}
							</p>
							<p>
								<strong>Origen:</strong> {selectedTransfer.from_warehouse?.name}
							</p>
							<p>
								<strong>Destino:</strong> {selectedTransfer.to_warehouse?.name}
							</p>
							<p>
								<strong>Items:</strong> {selectedTransfer.items_count}
							</p>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowActionModal(false);
							setSelectedTransfer(null);
							setActionType(null);
						}}>
						Cancelar
					</Button>
					<Button
						color={actionType === 'ship' ? 'emerald' : 'red'}
						onClick={handleTransferAction}>
						{actionType === 'ship' ? 'Enviar' : 'Cancelar Transferencia'}
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Transferencias;
