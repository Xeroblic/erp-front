import React from 'react';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IQuote, QuoteStatus } from '../../../../../interface';

interface DeleteQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	quotation: IQuote | null;
	isLoading?: boolean;
}

const DeleteQuotationModal: React.FC<DeleteQuotationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	quotation,
	isLoading = false,
}) => {
	if (!quotation) return null;

	const statusConfig: Record<QuoteStatus, { label: string; color: any; variant: any }> = {
		DRAFT: { label: 'Borrador', color: 'gray', variant: 'solid' },
		SENT: { label: 'Enviada', color: 'blue', variant: 'solid' },
		APPROVED: { label: 'Aprobada', color: 'emerald', variant: 'solid' },
		REJECTED: { label: 'Rechazada', color: 'red', variant: 'solid' },
		EXPIRED: { label: 'Vencida', color: 'gray', variant: 'solid' },
		CONVERTED: { label: 'Convertida', color: 'blue', variant: 'solid' },
		ACCEPTED: { label: 'Aceptada', color: 'green', variant: 'solid' },
		WAITING: { label: 'En Espera', color: 'amber', variant: 'solid' },
		CREDIT_30: { label: 'Crédito 30 días', color: 'purple', variant: 'solid' },
		PAID: { label: 'Pagada', color: 'emerald', variant: 'solid' },
	};

	const currentStatus = statusConfig[quotation.status];
	const isConvertedOrApproved =
		quotation.status === 'CONVERTED' || quotation.status === 'APPROVED';

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='md'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>Eliminar Cotización</h3>
						<p className='text-sm text-gray-500'>Esta acción no se puede deshacer</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4'>
					{/* Card con información de la cotización */}
					<Card>
						<CardHeader>
							<div className='flex items-center space-x-2'>
								<Icon icon='HeroDocumentText' className='h-5 w-5 text-gray-600' />
								<h4 className='text-sm font-medium text-gray-900'>
									Información de la cotización
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex items-center justify-between'>
									<span className='font-medium text-gray-700'>Número:</span>
									<span className='font-mono text-gray-900'>
										{quotation.quote_number}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='font-medium text-gray-700'>Estado:</span>
									<Badge
										color={currentStatus.color}
										variant={currentStatus.variant}
										className='text-xs'>
										{currentStatus.label}
									</Badge>
								</div>
								<div className='col-span-2 flex items-center justify-between'>
									<span className='font-medium text-gray-700'>Cliente:</span>
									<span className='text-right text-gray-900'>
										{quotation.customer?.company_name ||
											quotation.customer?.first_name +
												' ' +
												quotation.customer?.last_name ||
											'Cliente no disponible'}
									</span>
								</div>
								<div className='col-span-2 flex items-center justify-between border-t pt-3'>
									<span className='font-medium text-gray-700'>Total:</span>
									<span className='text-lg font-semibold text-gray-900'>
										${quotation.total_amount?.toLocaleString() || '0'}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card de advertencia para cotizaciones convertidas/aprobadas */}
					{isConvertedOrApproved && (
						<Card>
							<CardBody>
								<div className='flex items-start space-x-3'>
									<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
										<Icon
											icon='HeroExclamationTriangle'
											className='h-4 w-4 text-red-600'
										/>
									</div>
									<div className='min-w-0 flex-1'>
										<h5 className='text-sm font-semibold text-red-900'>
											Advertencia Importante
										</h5>
										<p className='mt-1 text-sm text-red-700'>
											Esta cotización tiene estado{' '}
											<strong>{currentStatus.label.toLowerCase()}</strong>. Al
											eliminarla podrías afectar registros relacionados en el
											sistema.
										</p>
										{quotation.status === 'CONVERTED' && (
											<div className='mt-2 flex items-start space-x-2'>
												<Icon
													icon='HeroExclamationCircle'
													className='mt-0.5 h-4 w-4 text-red-600'
												/>
												<p className='text-sm font-medium text-red-800'>
													Una cotización convertida puede tener ventas
													asociadas.
												</p>
											</div>
										)}
									</div>
								</div>
							</CardBody>
						</Card>
					)}

					{/* Card informativo para borradores */}
					{quotation.status === 'DRAFT' && (
						<Card>
							<CardBody>
								<div className='flex items-start space-x-3'>
									<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
										<Icon
											icon='HeroInformationCircle'
											className='h-4 w-4 text-blue-600'
										/>
									</div>
									<div className='min-w-0 flex-1'>
										<h5 className='text-sm font-semibold text-blue-900'>
											Eliminación Segura
										</h5>
										<p className='mt-1 text-sm text-blue-700'>
											Esta cotización está en estado borrador y puede
											eliminarse de forma segura sin afectar otros registros.
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					)}

					{/* Card de confirmación final */}
					<Card>
						<CardBody>
							<div className='flex items-start space-x-3'>
								<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
									<Icon
										icon='HeroQuestionMarkCircle'
										className='h-4 w-4 text-gray-600'
									/>
								</div>
								<div className='min-w-0 flex-1'>
									<h5 className='text-sm font-semibold text-gray-900'>
										Confirmar eliminación
									</h5>
									<p className='mt-1 text-sm text-gray-600'>
										Se eliminarán permanentemente todos los datos asociados:
										items, historial y documentos relacionados.
									</p>
									<div className='mt-2 flex items-center space-x-1 text-xs text-gray-500'>
										<Icon icon='HeroExclamationCircle' className='h-3 w-3' />
										<span>Esta acción no se puede deshacer</span>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='gray' onClick={onClose} isDisable={isLoading}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cancelar
					</Button>
					<Button color='red' onClick={onConfirm} isDisable={isLoading}>
						{isLoading ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Eliminando...
							</>
						) : (
							<>
								<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
								Confirmar Eliminación
							</>
						)}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteQuotationModal;
