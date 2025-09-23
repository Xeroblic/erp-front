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
import { ITransfer } from '@/interface/transfers.interface';

interface CancelTransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (transfer: ITransfer) => void;
	transfer: ITransfer | null;
	loading?: boolean;
}

const CancelTransferModal: React.FC<CancelTransferModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	transfer,
	loading = false,
}) => {
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

	const canCancel = transfer.status === 'PENDING' || transfer.status === 'SHIPPED';

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
						<Icon
							icon='HeroExclamationTriangle'
							className='h-6 w-6 text-red-600 dark:text-red-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-red-900 dark:text-red-100'>
							Cancelar Transferencia
						</h3>
						<p className='text-sm text-red-600 dark:text-red-400'>
							Esta acción no se puede deshacer
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4'>
					{!canCancel ? (
						<Card className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10'>
							<CardBody>
								<div className='flex items-center space-x-3'>
									<Icon
										icon='HeroInformationCircle'
										className='h-6 w-6 text-amber-600'
									/>
									<div>
										<h4 className='font-medium text-amber-800 dark:text-amber-200'>
											Transferencia no se puede cancelar
										</h4>
										<p className='text-sm text-amber-700 dark:text-amber-300'>
											Solo se pueden cancelar transferencias en estado
											"Pendiente" o "Enviado"
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					) : (
						<Card className='border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'>
							<CardBody>
								<div className='flex items-center space-x-3'>
									<Icon
										icon='HeroExclamationTriangle'
										className='h-6 w-6 text-red-600'
									/>
									<div>
										<h4 className='font-medium text-red-800 dark:text-red-200'>
											¿Estás seguro?
										</h4>
										<p className='text-sm text-red-700 dark:text-red-300'>
											{transfer.status === 'PENDING'
												? 'La transferencia será cancelada permanentemente y todos los productos quedarán disponibles en la sucursal de origen.'
												: 'La transferencia será cancelada. Los productos enviados deberán ser devueltos manualmente a la sucursal de origen.'}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Detalles de la Transferencia</CardTitle>
						</CardHeader>
						<CardBody className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Número de Transferencia:
								</span>
								<span className='text-sm font-bold text-gray-900 dark:text-white'>
									#{transfer.transfer_number}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Estado Actual:
								</span>
								<Badge color={getStatusColor(transfer.status)} variant='outline'>
									{transfer.status}
								</Badge>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Origen:
								</span>
								<span className='text-sm text-gray-900 dark:text-white'>
									{transfer.from_warehouse?.name || 'N/A'}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Destino:
								</span>
								<span className='text-sm text-gray-900 dark:text-white'>
									{transfer.to_warehouse?.name || 'N/A'}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Fecha de Creación:
								</span>
								<span className='text-sm text-gray-900 dark:text-white'>
									{formatDate(transfer.created_at)}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Total de Productos:
								</span>
								<span className='text-sm font-bold text-gray-900 dark:text-white'>
									{transfer.items?.length || 0}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
									Total de Unidades:
								</span>
								<span className='text-sm font-bold text-gray-900 dark:text-white'>
									{transfer.total_quantity || 0}
								</span>
							</div>
						</CardBody>
					</Card>

					{transfer.status === 'SHIPPED' && (
						<Card className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10'>
							<CardBody>
								<div className='flex items-start space-x-3'>
									<Icon
										icon='HeroInformationCircle'
										className='mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600'
									/>
									<div>
										<h4 className='font-medium text-amber-800 dark:text-amber-200'>
											Transferencia Ya Enviada
										</h4>
										<p className='mt-1 text-sm text-amber-700 dark:text-amber-300'>
											Los productos ya han sido enviados desde{' '}
											<strong>{transfer.from_warehouse?.name}</strong>. Al
											cancelar esta transferencia, los productos enviados
											deberán ser devueltos manualmente y el inventario se
											ajustará automáticamente.
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='gray' onClick={onClose} isDisable={loading}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
					{canCancel && (
						<Button color='red' onClick={() => onConfirm(transfer)} isDisable={loading}>
							{loading ? (
								<>
									<Icon
										icon='HeroArrowPath'
										className='mr-2 h-4 w-4 animate-spin'
									/>
									Cancelando...
								</>
							) : (
								<>
									<Icon icon='HeroExclamationTriangle' className='mr-2 h-4 w-4' />
									Confirmar Cancelación
								</>
							)}
						</Button>
					)}
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CancelTransferModal;
