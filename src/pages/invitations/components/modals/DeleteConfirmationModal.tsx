import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { Invitation } from '@/interface/invitacion.interface';
import React from 'react';

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	invitation: Invitation | null;
	isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	invitation,
	isDeleting = false,
}) => {
	if (!invitation) return null;

	const createdAtLabel = invitation.created_at
		? new Date(invitation.created_at).toLocaleDateString('es-ES')
		: 'Fecha no disponible';

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
						<Icon
							icon='HeroExclamationTriangle'
							className='h-6 w-6 text-red-600 dark:text-red-400'
						/>
					</div>
					<span className='text-red-900 dark:text-red-100'>Confirmar Eliminación</span>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-4'>
				<div className='text-center'>
					<p className='mb-2 text-zinc-900 dark:text-zinc-100'>
						¿Estás seguro que deseas eliminar esta invitación?
					</p>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						Esta acción no se puede deshacer.
					</p>
				</div>

				{/* Información de la invitación a eliminar */}
				<div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
					<div className='flex items-start space-x-3'>
						<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-800'>
							<Icon
								icon='HeroEnvelope'
								className='h-4 w-4 text-red-600 dark:text-red-400'
							/>
						</div>
						<div className='min-w-0 flex-1'>
							<p className='font-medium text-red-900 dark:text-red-100'>
								{invitation.email}
							</p>
							<p className='text-sm text-red-700 dark:text-red-300'>
								{`${invitation.first_name} ${invitation.last_name}`.trim() ||
									'Sin nombre'}
							</p>
							<p className='mt-1 text-xs text-red-600 dark:text-red-400'>
								Invitado el {createdAtLabel}
							</p>
						</div>
					</div>
				</div>

				<div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
					<div className='flex items-center space-x-2'>
						<Icon
							icon='HeroInformationCircle'
							className='h-5 w-5 text-amber-600 dark:text-amber-400'
						/>
						<p className='text-sm text-amber-800 dark:text-amber-200'>
							<strong>Nota:</strong> Si esta invitación ya fue aceptada, el usuario
							mantendrá su acceso al sistema.
						</p>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='zinc' onClick={onClose} isDisable={isDeleting}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='red'
						onClick={handleConfirm}
						isDisable={isDeleting}
						className='min-w-[120px]'>
						{isDeleting ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Eliminando...
							</>
						) : (
							<>
								<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
								Eliminar
							</>
						)}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteConfirmationModal;
