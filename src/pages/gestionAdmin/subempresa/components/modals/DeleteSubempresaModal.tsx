import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface DeleteSubempresaModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export default function DeleteSubempresaModal({
	isOpen,
	onClose,
	onConfirm,
}: DeleteSubempresaModalProps) {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>Eliminar Subempresa</ModalHeader>
			<ModalBody>
				<div className='mb-4 flex items-center gap-3'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroExclamationTriangle' className='text-xl text-red-600' />
					</div>
					<div>
						<h3 className='font-medium text-zinc-900 dark:text-zinc-100'>
							¿Eliminar subempresa?
						</h3>
						<p className='text-sm text-zinc-500'>Esta acción no se puede deshacer.</p>
					</div>
				</div>
				<p className='text-zinc-700 dark:text-zinc-300'>
					¿Estás seguro de que deseas eliminar esta subempresa? Todos los datos asociados
					se perderán permanentemente.
				</p>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button variant='solid' color='red' onClick={onConfirm}>
						Eliminar Subempresa
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
}
