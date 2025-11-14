/**
 * ReserveModal - Modal para reservar un item para una cotización
 */
import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';

interface ReserveModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (quotationId: number) => void;
	serialNumber?: string;
	isLoading?: boolean;
}

const ReserveModal: React.FC<ReserveModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	serialNumber,
	isLoading = false,
}) => {
	const [quotationId, setQuotationId] = useState('');
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = () => {
		setError(null);

		if (!quotationId.trim()) {
			setError('Ingresa el ID de la cotización');
			return;
		}

		const id = parseInt(quotationId.trim());
		if (isNaN(id) || id <= 0) {
			setError('El ID debe ser un número válido');
			return;
		}

		onConfirm(id);
	};

	const handleClose = () => {
		setQuotationId('');
		setError(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose}>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroBookmark' className='h-6 w-6 text-blue-600' />
					<h3 className='text-xl font-semibold'>Reservar Item</h3>
				</div>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				{serialNumber && (
					<div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-950'>
						<p className='text-sm text-blue-800 dark:text-blue-300'>
							<Icon icon='HeroInformationCircle' className='mr-2 inline h-5 w-5' />
							Reservando item con serial: <strong>{serialNumber}</strong>
						</p>
					</div>
				)}

				<div>
					<label className='mb-2 block text-sm font-medium'>
						ID de Cotización <span className='text-red-500'>*</span>
					</label>
					<Input
						type='number'
						name='quotationId'
						value={quotationId}
						onChange={(e) => setQuotationId(e.target.value)}
						placeholder='Ej: 12345'
						disabled={isLoading}
						min='1'
					/>
					<p className='mt-1 text-xs text-gray-500'>
						El item quedará reservado para esta cotización
					</p>
				</div>

				{error && (
					<div className='rounded-lg bg-red-50 p-3 dark:bg-red-950'>
						<p className='text-sm text-red-800 dark:text-red-300'>
							<Icon icon='HeroExclamationCircle' className='mr-2 inline h-5 w-5' />
							{error}
						</p>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={handleClose} isDisable={isLoading}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='blue'
					onClick={handleConfirm}
					isDisable={isLoading}
					icon={isLoading ? 'HeroArrowPath' : 'HeroBookmark'}>
					{isLoading ? 'Reservando...' : 'Reservar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ReserveModal;
