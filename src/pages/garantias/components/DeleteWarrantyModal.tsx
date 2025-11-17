import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { Warranty } from '@/interface/warranties.interface';
import { formatProductDisplay } from '../utils/warranty.utils';

interface DeleteWarrantyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	loading?: boolean;
	warranty?: Warranty | null;
}

const DeleteWarrantyModal: React.FC<DeleteWarrantyModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	loading = false,
	warranty,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='sm'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-zinc-900'>Eliminar garantía</h2>
						<p className='text-sm text-zinc-500'>Esta acción no se puede deshacer.</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<p className='text-sm text-zinc-600'>
					¿Estás seguro de que deseas eliminar la garantía de{' '}
					<strong>
						{warranty ? formatProductDisplay(warranty.product) : 'este producto'}
					</strong>
					{warranty?.serial_number && (
						<>
							{' '}
							con serie <strong>{warranty.serial_number}</strong>
						</>
					)}
					?
				</p>
			</ModalBody>
			<ModalFooter className='flex items-center justify-end space-x-2'>
				<Button variant='outline' onClick={onClose} type='button'>
					Cancelar
				</Button>
				<Button color='red' variant='solid' onClick={onConfirm} isLoading={loading}>
					Eliminar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteWarrantyModal;
