import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { IAdminUser } from '@/interface/users.interface';

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	user: IAdminUser | null;
	isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	user,
	isDeleting,
}) => {
	if (!user) return null;

	const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre';

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-2'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
						<Icon
							icon='HeroExclamationTriangle'
							className='h-5 w-5 text-red-600 dark:text-red-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
							Confirmar Eliminación
						</h3>
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>
							Esta acción no se puede deshacer
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4'>
					<div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
						<div className='flex'>
							<div className='flex-shrink-0'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-5 w-5 text-red-400'
								/>
							</div>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
									¿Estás seguro de que quieres eliminar este usuario?
								</h3>
								<div className='mt-2 text-sm text-red-700 dark:text-red-300'>
									<p>
										Se eliminará permanentemente el usuario{' '}
										<strong>{fullName}</strong> ({user.email}). Esta acción no
										se puede deshacer y se perderán todos los datos asociados.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className='rounded-lg border border-zinc-200 p-4 dark:border-zinc-700'>
						<h4 className='mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							Información del Usuario
						</h4>
						<div className='space-y-2 text-sm'>
							<div className='flex justify-between'>
								<span className='text-zinc-500 dark:text-zinc-400'>Nombre:</span>
								<span className='text-zinc-900 dark:text-zinc-100'>{fullName}</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-zinc-500 dark:text-zinc-400'>Email:</span>
								<span className='text-zinc-900 dark:text-zinc-100'>
									{user.email}
								</span>
							</div>
							{user.position && (
								<div className='flex justify-between'>
									<span className='text-zinc-500 dark:text-zinc-400'>Cargo:</span>
									<span className='text-zinc-900 dark:text-zinc-100'>
										{user.position}
									</span>
								</div>
							)}
							{user.company && (
								<div className='flex justify-between'>
									<span className='text-zinc-500 dark:text-zinc-400'>
										Empresa:
									</span>
									<span className='text-zinc-900 dark:text-zinc-100'>
										{user.company.name}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose} isDisable={isDeleting}>
						Cancelar
					</Button>
					<Button color='red' onClick={onConfirm} isDisable={isDeleting}>
						{isDeleting ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Eliminando...
							</>
						) : (
							<>
								<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
								Eliminar Usuario
							</>
						)}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteConfirmationModal;
