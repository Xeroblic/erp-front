import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface MissingSerialModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	missingSerial: string | null;
}

const MissingSerialModal: React.FC<MissingSerialModalProps> = ({
	isOpen,
	onCancel,
	onConfirm,
	missingSerial,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onCancel} size='sm' isCentered>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroInformationCircle' className='h-5 w-5 text-amber-500' />
					<span>Serie no encontrada</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<p className='text-sm text-gray-600 dark:text-gray-300'>
					La serie{' '}
					<span className='font-mono font-semibold text-gray-900 dark:text-gray-100'>
						{missingSerial}
					</span>{' '}
					no existe en este lote. ¿Deseas crearla mediante ingreso rápido?
				</p>
			</ModalBody>
			<ModalFooter className='flex justify-end gap-3'>
				<Button variant='outline' onClick={onCancel}>
					Cancelar
				</Button>
				<Button color='green' onClick={onConfirm}>
					Iniciar ingreso rápido
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default MissingSerialModal;
