/**
 * Modal de Detalle de Transferencia
 * Muestra información completa de una transferencia con historial
 */
import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Table, { TBody, THead, Th, Tr, Td } from '@/components/ui/Table';
import { ITransfer } from '@/interface/transfers.interface';

interface TransferDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	transfer: ITransfer | null;
}

const TransferDetailModal: React.FC<TransferDetailModalProps> = ({ isOpen, onClose, transfer }) => {
	if (!transfer) {
		return null;
	}

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

	const getPriorityColor = (priority: string) => {
		switch (priority?.toLowerCase()) {
			case 'urgent':
				return 'red';
			case 'high':
				return 'orange';
			case 'normal':
				return 'blue';
			case 'low':
				return 'gray';
			default:
				return 'gray';
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Mock data para historial - reemplazar con datos reales
	const transferHistory = [
		{
			id: 1,
			status: 'CREATED',
			date: transfer.created_at || '',
			user: 'Juan Pérez',
			notes: 'Transferencia creada',
		},
		{
			id: 2,
			status: 'SHIPPED',
			date: transfer.shipped_at || '',
			user: 'María García',
			notes: 'Productos enviados desde almacén central',
		},
		...(transfer.status === 'COMPLETED'
			? [
					{
						id: 3,
						status: 'COMPLETED',
						date: transfer.received_at || '',
						user: 'Carlos López',
						notes: 'Transferencia recibida y confirmada',
					},
				]
			: []),
	];

	const totalValue =
		transfer.items?.reduce((sum, item) => {
			// Mock price - reemplazar con precio real del item
			const unitPrice = 15000;
			return sum + item.quantity * unitPrice;
		}, 0) || 0;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='6xl'>
			<ModalHeader>
				<div className='flex w-full items-center justify-between'>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
							<Icon
								icon='HeroDocumentText'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
								Transferencia #{transfer.transfer_number}
							</h3>
							<p className='text-sm text-gray-500 dark:text-gray-400'>
								Creada el{' '}
								{transfer.created_at ? formatDate(transfer.created_at) : 'N/A'}
							</p>
						</div>
					</div>
					<Badge
						color={getStatusColor(transfer.status)}
						variant='outline'
						className='text-sm'>
						{transfer.status}
					</Badge>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-6'>
				{/* Información General */}
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					<Card>
						<CardHeader>
							<CardTitle>Información de Envío</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Sucursal Origen
								</label>
								<div className='mt-1 flex items-center space-x-2'>
									<Icon icon='HeroMapPin' className='h-4 w-4 text-gray-400' />
									<span className='text-sm text-gray-900 dark:text-white'>
										{transfer.from_warehouse?.name || 'N/A'}
									</span>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Sucursal Destino
								</label>
								<div className='mt-1 flex items-center space-x-2'>
									<Icon icon='HeroMapPin' className='h-4 w-4 text-gray-400' />
									<span className='text-sm text-gray-900 dark:text-white'>
										{transfer.to_warehouse?.name || 'N/A'}
									</span>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Responsable
								</label>
								<div className='mt-1 flex items-center space-x-2'>
									<Icon icon='HeroUser' className='h-4 w-4 text-gray-400' />
									<span className='text-sm text-gray-900 dark:text-white'>
										{transfer.creator?.name || 'N/A'}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Fechas Importantes</CardTitle>
						</CardHeader>
						<CardBody className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha de Creación
								</label>
								<div className='mt-1 flex items-center space-x-2'>
									<Icon icon='HeroCalendar' className='h-4 w-4 text-gray-400' />
									<span className='text-sm text-gray-900 dark:text-white'>
										{transfer.created_at
											? formatDate(transfer.created_at)
											: 'N/A'}
									</span>
								</div>
							</div>
							{transfer.shipped_at && (
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Fecha de Envío
									</label>
									<div className='mt-1 flex items-center space-x-2'>
										<Icon icon='HeroTruck' className='h-4 w-4 text-blue-400' />
										<span className='text-sm text-gray-900 dark:text-white'>
											{formatDate(transfer.shipped_at)}
										</span>
									</div>
								</div>
							)}
							{transfer.received_at && (
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Fecha de Recepción
									</label>
									<div className='mt-1 flex items-center space-x-2'>
										<Icon
											icon='HeroCheckCircle'
											className='h-4 w-4 text-green-400'
										/>
										<span className='text-sm text-gray-900 dark:text-white'>
											{formatDate(transfer.received_at)}
										</span>
									</div>
								</div>
							)}
						</CardBody>
					</Card>
				</div>

				{/* Productos */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Productos Transferidos</CardTitle>
							<div className='flex items-center space-x-4'>
								<div className='text-right'>
									<p className='text-sm text-gray-500'>Total productos</p>
									<p className='text-lg font-semibold text-gray-900 dark:text-white'>
										{transfer.items?.length || 0}
									</p>
								</div>
								<div className='text-right'>
									<p className='text-sm text-gray-500'>Valor estimado</p>
									<p className='text-lg font-semibold text-gray-900 dark:text-white'>
										{formatCurrency(totalValue)}
									</p>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardBody>
						<Table>
							<THead>
								<Tr>
									<Th>Producto</Th>
									<Th>SKU</Th>
									<Th className='text-center'>Cantidad</Th>
									<Th className='text-center'>Recibido</Th>
									<Th className='text-center'>Estado</Th>
									<Th className='text-right'>Valor Unit.</Th>
									<Th className='text-right'>Total</Th>
								</Tr>
							</THead>
							<TBody>
								{transfer.items?.map((item, index) => {
									const unitPrice = 15000; // Mock price
									const totalItemValue = item.quantity * unitPrice;
									const receivedQuantity = item.received_quantity || 0;

									return (
										<Tr key={index}>
											<Td className='font-medium'>
												{item.product?.name || 'N/A'}
											</Td>
											<Td className='text-sm text-gray-500'>
												{item.product?.sku || 'N/A'}
											</Td>
											<Td className='text-center'>{item.quantity}</Td>
											<Td className='text-center'>
												<span
													className={`font-medium ${
														receivedQuantity === item.quantity
															? 'text-green-600'
															: receivedQuantity > 0
																? 'text-amber-600'
																: 'text-gray-500'
													}`}>
													{receivedQuantity}
												</span>
											</Td>
											<Td className='text-center'>
												{receivedQuantity === item.quantity ? (
													<Badge color='emerald'>Completo</Badge>
												) : receivedQuantity > 0 ? (
													<Badge color='amber'>Parcial</Badge>
												) : (
													<Badge color='gray'>Pendiente</Badge>
												)}
											</Td>
											<Td className='text-right'>
												{formatCurrency(unitPrice)}
											</Td>
											<Td className='text-right font-medium'>
												{formatCurrency(totalItemValue)}
											</Td>
										</Tr>
									);
								})}
							</TBody>
						</Table>
					</CardBody>
				</Card>

				{/* Historial de Estados */}
				<Card>
					<CardHeader>
						<CardTitle>Historial de Estados</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='flow-root'>
							<ul className='-mb-8'>
								{transferHistory.map((event, eventIdx) => (
									<li key={event.id}>
										<div className='relative pb-8'>
											{eventIdx !== transferHistory.length - 1 ? (
												<span
													className='absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200'
													aria-hidden='true'
												/>
											) : null}
											<div className='relative flex space-x-3'>
												<div>
													<span
														className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
															event.status === 'CREATED'
																? 'bg-blue-500'
																: event.status === 'SHIPPED'
																	? 'bg-amber-500'
																	: event.status === 'COMPLETED'
																		? 'bg-green-500'
																		: 'bg-gray-500'
														}`}>
														<Icon
															icon={
																event.status === 'CREATED'
																	? 'HeroDocumentPlus'
																	: event.status === 'SHIPPED'
																		? 'HeroTruck'
																		: event.status ===
																			  'COMPLETED'
																			? 'HeroCheckCircle'
																			: 'HeroClock'
															}
															className='h-5 w-5 text-white'
														/>
													</span>
												</div>
												<div className='flex min-w-0 flex-1 justify-between space-x-4 pt-1.5'>
													<div>
														<p className='text-sm text-gray-900 dark:text-white'>
															{event.notes}{' '}
															<span className='font-medium text-gray-900 dark:text-white'>
																{event.user}
															</span>
														</p>
													</div>
													<div className='whitespace-nowrap text-right text-sm text-gray-500'>
														{event.date
															? formatDate(event.date)
															: 'Pendiente'}
													</div>
												</div>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					</CardBody>
				</Card>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default TransferDetailModal;
