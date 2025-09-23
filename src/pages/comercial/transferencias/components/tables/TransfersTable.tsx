import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Table, { TBody, THead, Th, Tr, Td } from '@/components/ui/Table';
import { ITransfer } from '@/interface/transfers.interface';

interface TransfersTableProps {
	transfers: ITransfer[];
	isLoading?: boolean;
	onView: (transfer: ITransfer) => void;
	onEdit?: (transfer: ITransfer) => void;
	onReceive?: (transfer: ITransfer) => void;
	onCancel?: (transfer: ITransfer) => void;
	currentUser?: any; // Reemplazar con el tipo correcto del usuario
}

const TransfersTable: React.FC<TransfersTableProps> = ({
	transfers,
	isLoading = false,
	onView,
	onEdit,
	onReceive,
	onCancel,
	// currentUser, // Para uso futuro
}) => {
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'amber';
			case 'shipped':
				return 'blue';
			case 'completed':
				return 'emerald';
			case 'cancelled':
				return 'red';
			default:
				return 'gray';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'Pendiente';
			case 'shipped':
				return 'Enviado';
			case 'completed':
				return 'Completado';
			case 'cancelled':
				return 'Cancelado';
			default:
				return status;
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const calculateProgress = (transfer: ITransfer) => {
		if (!transfer.items?.length) return 0;

		const totalItems = transfer.items.length;
		const receivedItems = transfer.items.filter((item) => item.received_quantity > 0).length;

		return Math.round((receivedItems / totalItems) * 100);
	};

	const canEdit = (transfer: ITransfer) => {
		return transfer.status === 'PENDING';
	};

	const canReceive = (transfer: ITransfer) => {
		return transfer.status === 'SHIPPED';
	};

	const canCancel = (transfer: ITransfer) => {
		return transfer.status === 'PENDING' || transfer.status === 'SHIPPED';
	};

	if (isLoading) {
		return (
			<div className='space-y-3'>
				{[...Array(5)].map((_, index) => (
					<div key={index} className='animate-pulse'>
						<div className='h-16 rounded-lg bg-gray-200 dark:bg-gray-700'></div>
					</div>
				))}
			</div>
		);
	}

	if (transfers.length === 0) {
		return (
			<div className='py-12 text-center'>
				<Icon icon='HeroInboxStack' className='mx-auto h-12 w-12 text-gray-400' />
				<h3 className='mt-2 text-sm font-semibold text-gray-900 dark:text-white'>
					No hay transferencias
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
					No se encontraron transferencias con los filtros aplicados.
				</p>
			</div>
		);
	}

	return (
		<div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
			<Table>
				<THead>
					<Tr>
						<Th>Transferencia</Th>
						<Th>Origen → Destino</Th>
						<Th>Productos</Th>
						<Th>Estado</Th>
						<Th>Progreso</Th>
						<Th>Fechas</Th>
						<Th className='text-center'>Acciones</Th>
					</Tr>
				</THead>
				<TBody>
					{transfers.map((transfer) => {
						const progress = calculateProgress(transfer);

						return (
							<Tr
								key={transfer.id}
								className='hover:bg-gray-50 dark:hover:bg-gray-800'>
								{/* Información de Transferencia */}
								<Td>
									<div className='flex flex-col space-y-1'>
										<div className='flex items-center space-x-2'>
											<Icon
												icon='HeroTruck'
												className='h-4 w-4 flex-shrink-0 text-gray-400'
											/>
											<span className='text-sm font-semibold text-gray-900 dark:text-white'>
												#{transfer.transfer_number}
											</span>
										</div>
										<span className='text-xs text-gray-500 dark:text-gray-400'>
											ID: {transfer.id}
										</span>
									</div>
								</Td>

								{/* Origen y Destino */}
								<Td>
									<div className='flex flex-col space-y-1'>
										<div className='flex items-center space-x-1'>
											<Icon
												icon='HeroMapPin'
												className='h-3 w-3 text-green-500'
											/>
											<span className='text-sm font-medium text-gray-900 dark:text-white'>
												{transfer.from_warehouse?.name || 'N/A'}
											</span>
										</div>
										<div className='flex items-center space-x-1'>
											<Icon
												icon='HeroArrowRight'
												className='h-3 w-3 text-gray-400'
											/>
										</div>
										<div className='flex items-center space-x-1'>
											<Icon
												icon='HeroMapPin'
												className='h-3 w-3 text-blue-500'
											/>
											<span className='text-sm font-medium text-gray-900 dark:text-white'>
												{transfer.to_warehouse?.name || 'N/A'}
											</span>
										</div>
									</div>
								</Td>

								{/* Información de Productos */}
								<Td>
									<div className='flex flex-col space-y-1'>
										<div className='flex items-center space-x-2'>
											<Icon
												icon='HeroCubeTransparent'
												className='h-4 w-4 text-gray-400'
											/>
											<span className='text-sm font-semibold text-gray-900 dark:text-white'>
												{transfer.items?.length || 0}
											</span>
											<span className='text-xs text-gray-500'>productos</span>
										</div>
										<div className='flex items-center space-x-2'>
											<Icon
												icon='HeroQueueList'
												className='h-4 w-4 text-gray-400'
											/>
											<span className='text-sm font-semibold text-gray-900 dark:text-white'>
												{transfer.total_quantity || 0}
											</span>
											<span className='text-xs text-gray-500'>unidades</span>
										</div>
									</div>
								</Td>

								{/* Estado */}
								<Td>
									<Badge
										color={getStatusColor(transfer.status)}
										variant='outline'>
										{getStatusLabel(transfer.status)}
									</Badge>
								</Td>

								{/* Progreso */}
								<Td>
									<div className='flex flex-col space-y-2'>
										<div className='flex items-center justify-between'>
											<span className='text-xs text-gray-500'>
												{progress}% completo
											</span>
										</div>
										<div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
											<div
												className={`h-2 rounded-full transition-all duration-300 ${
													progress === 100
														? 'bg-green-500'
														: progress > 0
															? 'bg-blue-500'
															: 'bg-gray-300'
												}`}
												style={{ width: `${progress}%` }}></div>
										</div>
										{transfer.received_quantity !== undefined && (
											<span className='text-xs text-gray-500'>
												{transfer.received_quantity}/
												{transfer.total_quantity || 0} recibidas
											</span>
										)}
									</div>
								</Td>

								{/* Fechas */}
								<Td>
									<div className='flex flex-col space-y-1'>
										<div className='flex items-center space-x-1'>
											<Icon
												icon='HeroCalendar'
												className='h-3 w-3 text-gray-400'
											/>
											<span className='text-xs text-gray-600 dark:text-gray-300'>
												{formatDate(transfer.created_at)}
											</span>
										</div>
										{transfer.shipped_at && (
											<div className='flex items-center space-x-1'>
												<Icon
													icon='HeroTruck'
													className='h-3 w-3 text-blue-500'
												/>
												<span className='text-xs text-blue-600 dark:text-blue-400'>
													{formatDate(transfer.shipped_at)}
												</span>
											</div>
										)}
										{transfer.received_at && (
											<div className='flex items-center space-x-1'>
												<Icon
													icon='HeroCheckCircle'
													className='h-3 w-3 text-green-500'
												/>
												<span className='text-xs text-green-600 dark:text-green-400'>
													{formatDate(transfer.received_at)}
												</span>
											</div>
										)}
									</div>
								</Td>

								{/* Acciones */}
								<Td>
									<div className='flex items-center justify-center space-x-1'>
										{/* Ver Detalle */}
										<Tooltip text='Ver detalle'>
											<Button
												variant='outline'
												size='xs'
												color='blue'
												onClick={() => onView(transfer)}>
												<Icon icon='HeroEye' className='h-3 w-3' />
											</Button>
										</Tooltip>

										{/* Editar */}
										{onEdit && canEdit(transfer) && (
											<Tooltip text='Editar transferencia'>
												<Button
													variant='outline'
													size='xs'
													color='amber'
													onClick={() => onEdit(transfer)}>
													<Icon icon='HeroPencil' className='h-3 w-3' />
												</Button>
											</Tooltip>
										)}

										{/* Recibir */}
										{onReceive && canReceive(transfer) && (
											<Tooltip text='Recibir transferencia'>
												<Button
													variant='outline'
													size='xs'
													color='emerald'
													onClick={() => onReceive(transfer)}>
													<Icon
														icon='HeroCheckCircle'
														className='h-3 w-3'
													/>
												</Button>
											</Tooltip>
										)}

										{/* Cancelar */}
										{onCancel && canCancel(transfer) && (
											<Tooltip text='Cancelar transferencia'>
												<Button
													variant='outline'
													size='xs'
													color='red'
													onClick={() => onCancel(transfer)}>
													<Icon icon='HeroXMark' className='h-3 w-3' />
												</Button>
											</Tooltip>
										)}
									</div>
								</Td>
							</Tr>
						);
					})}
				</TBody>
			</Table>
		</div>
	);
};

export default TransfersTable;
