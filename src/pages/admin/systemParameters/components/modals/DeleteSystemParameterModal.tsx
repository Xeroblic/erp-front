import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { SystemParameter } from '@/interface';

interface DeleteSystemParameterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	parameter: SystemParameter | null;
	isLoading?: boolean;
}

const DeleteSystemParameterModal: React.FC<DeleteSystemParameterModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	parameter,
	isLoading = false,
}) => {
	if (!parameter) return null;

	const handleConfirm = () => {
		onConfirm();
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			general: 'blue',
			system: 'red',
			email: 'green',
			security: 'yellow',
			integration: 'purple',
			ui: 'pink',
			business: 'indigo',
		} as const;
		return colors[category as keyof typeof colors] || 'gray';
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30'>
						<Icon
							icon='HeroExclamationTriangle'
							className='h-6 w-6 text-red-600 dark:text-red-400'
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

			<ModalBody className='space-y-4'>
				<div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
					<div className='flex items-start space-x-3'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-5 w-5 text-red-600 dark:text-red-400'
						/>
						<div>
							<h4 className='text-sm font-medium text-red-800 dark:text-red-200'>
								¡Atención!
							</h4>
							<p className='mt-1 text-sm text-red-700 dark:text-red-300'>
								Estás a punto de eliminar el siguiente parámetro del sistema. Esta
								acción es permanente y puede afectar el funcionamiento del sistema.
							</p>
						</div>
					</div>
				</div>

				{/* Información del parámetro */}
				<div className='space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50'>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								Clave
							</label>
							<div className='font-mono text-sm text-zinc-900 dark:text-zinc-100'>
								{parameter.key}
							</div>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								Categoría
							</label>
							<Badge
							
								className='capitalize'>
								{parameter.category}
							</Badge>
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
							Descripción
						</label>
						<div className='text-sm text-zinc-700 dark:text-zinc-300'>
							{parameter.description}
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
							Valor Actual
						</label>
						<div className='max-h-20 overflow-y-auto rounded border bg-white px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							{parameter.value}
						</div>
					</div>
				</div>

				<div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
					<div className='flex items-start space-x-3'>
						<Icon
							icon='HeroInformationCircle'
							className='mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400'
						/>
						<div>
							<h4 className='text-sm font-medium text-amber-800 dark:text-amber-200'>
								Consideraciones importantes:
							</h4>
							<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-300'>
								<li>Este parámetro puede estar siendo usado por el sistema</li>
								<li>La eliminación podría afectar funcionalidades dependientes</li>
								<li>
									Si el parámetro es crítico, el sistema podría usar valores por
									defecto
								</li>
								<li>
									Se recomienda realizar una copia de seguridad antes de proceder
								</li>
							</ul>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<div className='flex w-full items-center justify-end space-x-3'>
					<Button variant='outline' onClick={onClose} isDisable={isLoading}>
						Cancelar
					</Button>
					<Button
						color='red'
						icon={isLoading ? 'HeroArrowPath' : 'HeroTrash'}
						onClick={handleConfirm}
						isLoading={isLoading}
						isDisable={isLoading}>
						{isLoading ? 'Eliminando...' : 'Eliminar Parámetro'}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteSystemParameterModal;
