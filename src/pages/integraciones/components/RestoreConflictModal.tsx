import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface RestoreConflictModalProps {
	isOpen: boolean;
	onClose: () => void;
	conflictMessage: string;
	integrationName: string;
}

const RestoreConflictModal: React.FC<RestoreConflictModalProps> = ({
	isOpen,
	onClose,
	conflictMessage,
	integrationName,
}) => {
	const isNameConflict = conflictMessage.toLowerCase().includes('nombre');
	const isRestConflict =
		conflictMessage.toLowerCase().includes('rest') ||
		conflictMessage.toLowerCase().includes('woocommerce');
	const isWebhookConflict = conflictMessage.toLowerCase().includes('webhook');

	let conflictType = 'conflicto';
	let conflictIcon = 'HeroExclamationTriangle';
	let conflictColor = 'amber';

	if (isNameConflict) {
		conflictType = 'nombre duplicado';
		conflictIcon = 'HeroDocumentDuplicate';
		conflictColor = 'blue';
	} else if (isRestConflict) {
		conflictType = 'integración REST activa';
		conflictIcon = 'HeroGlobeAlt';
		conflictColor = 'emerald';
	} else if (isWebhookConflict) {
		conflictType = 'webhook activo';
		conflictIcon = 'HeroSignal';
		conflictColor = 'violet';
	}

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<Badge color={conflictColor}>
					<Icon icon={conflictIcon} className='me-1' />
					No se pudo restaurar
				</Badge>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4'>
					<p className='text-sm text-neutral-700 dark:text-neutral-300'>
						La integración <strong>"{integrationName}"</strong> no se pudo restaurar
						porque hay un {conflictType}.
					</p>
					<div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-950/30'>
						<p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
							{conflictMessage}
						</p>
					</div>
					<div className='rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50'>
						<p className='mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
							Para resolver este conflicto:
						</p>
						<ul className='space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400'>
							{isNameConflict && (
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroPencil'
										className='mt-0.5 h-3.5 w-3.5 text-blue-500'
									/>
									<span>
										Edita la integración activa y cámbiale el nombre, o
										elimínala si ya no la necesitas.
									</span>
								</li>
							)}
							{isRestConflict && (
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroArrowPath'
										className='mt-0.5 h-3.5 w-3.5 text-emerald-500'
									/>
									<span>
										Desactiva o elimina la integración REST activa del mismo
										proveedor antes de restaurar esta.
									</span>
								</li>
							)}
							{isWebhookConflict && (
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroSignal'
										className='mt-0.5 h-3.5 w-3.5 text-violet-500'
									/>
									<span>
										Elimina o desactiva el webhook activo para el mismo evento
										antes de restaurar esta integración.
									</span>
								</li>
							)}
							{!isNameConflict && !isRestConflict && !isWebhookConflict && (
								<li className='flex items-start gap-2'>
									<Icon
										icon='HeroInformationCircle'
										className='mt-0.5 h-3.5 w-3.5 text-neutral-500'
									/>
									<span>
										Revisa las integraciones activas y resuelve cualquier
										conflicto antes de intentar restaurar nuevamente.
									</span>
								</li>
							)}
						</ul>
					</div>
					<p className='text-xs text-neutral-500 dark:text-neutral-400'>
						Una vez resuelto el conflicto, vuelve a la papelera e intenta restaurar
						nuevamente.
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={onClose} icon='HeroX'>
					Entendido
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default RestoreConflictModal;
