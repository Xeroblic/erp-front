import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface ISuccessPinModalProps {
	isOpen: boolean;
	successPin: string | null;
	successMessage: string | null;
	onClose: () => void;
}

const SuccessPinModal: React.FC<ISuccessPinModalProps> = ({
	isOpen,
	successPin,
	successMessage,
	onClose,
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='sm'>
			<ModalHeader>
				<div className='flex items-center gap-2 text-emerald-600'>
					<Icon icon='HeroCheckCircle' className='h-5 w-5' />
					Acción Completada
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4 text-center'>
					<p className='text-sm text-zinc-600'>{successMessage}</p>
					<div className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6'>
						<p className='ml-4 font-mono text-5xl font-black tracking-[0.2em] text-emerald-600'>
							{successPin}
						</p>
					</div>
					<p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
						Anota este PIN para operar el casillero
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='emerald' className='w-full' onClick={onClose}>
					Entendido
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default SuccessPinModal;
