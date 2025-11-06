import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const DeleteProductModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
	isOpen,
	onClose,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600'>
						<Icon icon='HeroTrash' className='h-5 w-5' />
					</span>
					<div>
						<p className='text-lg font-semibold'>Eliminar producto</p>
						<p className='text-sm text-neutral-500'>Confirmación</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='py-6 text-center text-sm text-neutral-500'>
					Funcionalidad temporal: modal de eliminación estable.
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button variant='outline' onClick={onClose}>
						Cerrar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteProductModal;
