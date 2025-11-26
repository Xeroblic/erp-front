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
import { IQuote } from '../../../../../interface';
import { getCustomerDisplayName } from '../../utils/customerDisplay';

interface DuplicateQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	quotation: IQuote | null;
	isLoading?: boolean;
}

const DuplicateQuotationModal: React.FC<DuplicateQuotationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	quotation,
	isLoading = false,
}) => {
	if (!quotation) return null;

	const customerDisplayName = getCustomerDisplayName(quotation.customer);

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='md'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroDocumentDuplicate' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>Duplicar Cotización</h3>
						<p className='text-sm text-gray-500'>
							¿Confirmar la duplicación de esta cotización?
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4'>
					{/* Card con información de la cotización original */}
					<Card>
						<CardHeader>
							<div className='flex items-center space-x-2'>
								<Icon icon='HeroDocument' className='h-5 w-5 text-gray-600' />
								<h4 className='text-sm font-medium text-gray-900'>
									Cotización original
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='grid grid-cols-1 gap-3 text-sm'>
								{/* <div className='flex items-center justify-between'>
									<span className='font-medium text-gray-700'>Número:</span>
									<span className='font-mono text-gray-900'>
										{quotation.quote_number}
									</span>
								</div> */}
								<div className='flex items-center justify-between'>
									<span className='font-medium text-gray-700'>Cliente:</span>
									<span className='text-right text-gray-900'>
										{customerDisplayName}
									</span>
								</div>
								<div className='flex items-center justify-between border-t pt-3'>
									<span className='font-medium text-gray-700'>Total:</span>
									<span className='text-lg font-semibold text-gray-900'>
										${quotation.total_amount?.toLocaleString() || '0'}
									</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Card de información sobre la duplicación */}
					<Card>
						<CardHeader>
							<div className='flex items-center space-x-2'>
								<Icon
									icon='HeroInformationCircle'
									className='h-5 w-5 text-blue-600'
								/>
								<h4 className='text-sm font-medium text-blue-900'>
									Elementos que se duplicarán
								</h4>
							</div>
						</CardHeader>
						<CardBody>
							<div className='space-y-3'>
								<div className='grid grid-cols-1 gap-2 text-sm text-blue-700'>
									<div className='flex items-center space-x-2'>
										<Icon
											icon='HeroCheckCircle'
											className='h-4 w-4 text-blue-500'
										/>
										<span>Todos los items y cantidades</span>
									</div>
									<div className='flex items-center space-x-2'>
										<Icon
											icon='HeroCheckCircle'
											className='h-4 w-4 text-blue-500'
										/>
										<span>Información del cliente</span>
									</div>
									<div className='flex items-center space-x-2'>
										<Icon
											icon='HeroCheckCircle'
											className='h-4 w-4 text-blue-500'
										/>
										<span>Condiciones de pago</span>
									</div>
									<div className='flex items-center space-x-2'>
										<Icon
											icon='HeroCheckCircle'
											className='h-4 w-4 text-blue-500'
										/>
										<span>Observaciones y términos</span>
									</div>
								</div>
								<div className='border-t pt-3'>
									<div className='flex items-start space-x-2'>
										<Icon
											icon='HeroSparkles'
											className='mt-0.5 h-4 w-4 text-green-500'
										/>
										<p className='text-sm font-medium text-green-700'>
											La nueva cotización se creará con estado "Borrador" y
											fecha actual
										</p>
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
					<Button color='blue' onClick={onConfirm} isDisable={isLoading}>
						{isLoading ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Duplicando...
							</>
						) : (
							<>
								<Icon icon='HeroDocumentDuplicate' className='mr-2 h-4 w-4' />
								Confirmar Duplicación
							</>
						)}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DuplicateQuotationModal;
