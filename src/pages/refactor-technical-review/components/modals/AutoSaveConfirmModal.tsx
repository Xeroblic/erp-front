/**
 * AutoSaveConfirmModal.tsx
 * Modal de confirmación que se muestra cuando el auto-guardado por inactividad
 * completa exitosamente. Tiene un solo botón "Cerrar".
 */
import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface AutoSaveConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	savedAt: Date | null;
}

const AutoSaveConfirmModal: React.FC<AutoSaveConfirmModalProps> = ({
	isOpen,
	onClose,
	savedAt,
}) => {
	const timeString = savedAt
		? savedAt.toLocaleTimeString('es-CL', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			})
		: '';

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} isCentered size='sm'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
						<Icon
							icon='HeroCheck'
							className='h-6 w-6 text-emerald-600 dark:text-emerald-400'
						/>
					</div>
					<span className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
						Guardado Automático
					</span>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-3 text-center'>
					<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20'>
						<Icon
							icon='HeroCloudArrowUp'
							className='h-8 w-8 animate-bounce text-emerald-500'
						/>
					</div>
					<p className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Los cambios se guardaron automáticamente.
					</p>
					{timeString && (
						<p className='text-xs text-zinc-400'>Guardado a las {timeString}</p>
					)}
					<p className='text-xs text-zinc-400'>
						Se detectó inactividad y se guardó el progreso para evitar pérdida de datos.
					</p>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='w-full'>
					<Button variant='solid' color='emerald' className='w-full' onClick={onClose}>
						Cerrar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default AutoSaveConfirmModal;
