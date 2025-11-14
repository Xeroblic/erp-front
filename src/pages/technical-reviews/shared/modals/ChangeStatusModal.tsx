/**
 * ChangeStatusModal - Modal para cambiar el estado comercial de un item
 */
import React, { useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Icon from '@/components/icon/Icon';
import type { CommercialStatus } from '@/interface/technicalReviews.interface';

interface ChangeStatusModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (newStatus: CommercialStatus, reason: string) => void;
	currentStatus: CommercialStatus;
	isLoading?: boolean;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	currentStatus,
	isLoading = false,
}) => {
	const [selectedStatus, setSelectedStatus] = useState<TSelectOption | null>(null);
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const statusOptions: TSelectOption[] = [
		{ value: 'available', label: 'Disponible' },
		{ value: 'reserved', label: 'Reservado' },
		{ value: 'sold', label: 'Vendido' },
		{ value: 'disposed', label: 'Descartado' },
		{ value: 'in_repair', label: 'En Reparación' },
	];

	const handleConfirm = () => {
		setError(null);

		if (!selectedStatus) {
			setError('Selecciona un nuevo estado');
			return;
		}

		if (!reason.trim()) {
			setError('Debes ingresar un motivo del cambio');
			return;
		}

		onConfirm(selectedStatus.value as CommercialStatus, reason);
	};

	const handleClose = () => {
		setSelectedStatus(null);
		setReason('');
		setError(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose}>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroArrowPath' className='h-6 w-6 text-blue-600' />
					<h3 className='text-xl font-semibold'>Cambiar Estado Comercial</h3>
				</div>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				<div className='rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
					<p className='text-sm text-gray-700 dark:text-gray-300'>
						Estado actual: <strong className='capitalize'>{currentStatus}</strong>
					</p>
				</div>

				<div>
					<label className='mb-2 block text-sm font-medium'>
						Nuevo Estado <span className='text-red-500'>*</span>
					</label>
					<SelectReact
						name='status'
						options={statusOptions}
						value={selectedStatus}
						onChange={(option) => setSelectedStatus(option as TSelectOption | null)}
						placeholder='Seleccionar estado'
						isDisabled={isLoading}
					/>
				</div>

				<div>
					<label className='mb-2 block text-sm font-medium'>
						Motivo del Cambio <span className='text-red-500'>*</span>
					</label>
					<Textarea
						name='reason'
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
						placeholder='Explica el motivo del cambio de estado...'
						disabled={isLoading}
					/>
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
					icon={isLoading ? 'HeroArrowPath' : 'HeroCheckCircle'}>
					{isLoading ? 'Cambiando...' : 'Confirmar Cambio'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ChangeStatusModal;
