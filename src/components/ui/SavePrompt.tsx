import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './Modal';
import Button from './Button';
import Icon from '../icon/Icon';

interface SavePromptProps {
	/** Si el modal está abierto */
	isOpen: boolean;
	/** Callback al confirmar guardar */
	onConfirm: () => void;
	/** Callback al cancelar */
	onCancel: () => void;
	/** Si está en proceso de guardado */
	isLoading?: boolean;
	/** Título personalizado */
	title?: string;
	/** Mensaje personalizado */
	message?: string;
	/** Texto del botón de confirmación */
	confirmText?: string;
	/** Texto del botón de cancelación */
	cancelText?: string;
}

/**
 * Componente de popup para confirmar guardado de cambios
 *
 * @example
 * ```tsx
 * <SavePrompt
 *   isOpen={showSavePrompt}
 *   onConfirm={handleSave}
 *   onCancel={handleCancel}
 *   isLoading={isSaving}
 * />
 * ```
 */
const SavePrompt: React.FC<SavePromptProps> = ({
	isOpen,
	onConfirm,
	onCancel,
	isLoading = false,
	title = '¿Guardar cambios?',
	message = 'Has realizado cambios en el formulario. ¿Deseas guardar estos cambios?',
	confirmText = 'Guardar cambios',
	cancelText = 'Continuar editando',
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={() => !isLoading && onCancel()} size='sm'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
						<Icon
							icon='HeroDocumentCheck'
							className='h-6 w-6 text-blue-600 dark:text-blue-400'
						/>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
							{title}
						</h3>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				<div className='space-y-4'>
					<p className='text-sm text-gray-600 dark:text-gray-400'>{message}</p>

					<div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
						<div className='flex gap-2'>
							<Icon
								icon='HeroInformationCircle'
								className='h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400'
							/>
							<p className='text-xs text-blue-700 dark:text-blue-300'>
								Si decides continuar editando, tus cambios se guardarán
								automáticamente después de 30 segundos de inactividad.
							</p>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button
						variant='outline'
						onClick={onCancel}
						isDisable={isLoading}
						icon='HeroXMark'>
						{cancelText}
					</Button>
					<Button
						color='blue'
						onClick={onConfirm}
						isLoading={isLoading}
						isDisable={isLoading}
						icon='HeroCheck'>
						{confirmText}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default SavePrompt;
