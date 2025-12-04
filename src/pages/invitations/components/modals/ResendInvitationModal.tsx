import React from 'react';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { Invitation } from '@/interface/invitacion.interface';

interface ResendInvitationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	invitation: Invitation | null;
	isResending?: boolean;
}

const ResendInvitationModal: React.FC<ResendInvitationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	invitation,
	isResending = false,
}) => {
	if (!invitation) return null;

	const handleConfirm = () => {
		onConfirm();
	};

	const statusConfig: Record<string, { label: string; color: any; icon: string }> = {
		pending: {
			label: 'Pendiente',
			color: 'amber',
			icon: 'HeroClock',
		},
		sent: {
			label: 'Enviada',
			color: 'blue',
			icon: 'HeroPaperAirplane',
		},
		accepted: {
			label: 'Aceptada',
			color: 'emerald',
			icon: 'HeroCheckCircle',
		},
		expired: {
			label: 'Expirada',
			color: 'red',
			icon: 'HeroXCircle',
		},
		cancelled: {
			label: 'Cancelada',
			color: 'zinc',
			icon: 'HeroXMark',
		},
	};

	const statusDetails = statusConfig[invitation.status] || statusConfig.pending;
	const originalInviteDate =
		invitation.invited_at || invitation.created_at || invitation.accepted_at;
	const formattedOriginalInviteDate = (() => {
		if (!originalInviteDate) return null;
		const parsed = new Date(originalInviteDate);
		return Number.isNaN(parsed.getTime())
			? null
			: parsed.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
	})();

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
						<Icon
							icon='HeroPaperAirplane'
							className='h-6 w-6 text-blue-600 dark:text-blue-400'
						/>
					</div>
					<span className='text-blue-900 dark:text-blue-100'>Reenviar Invitación</span>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-4'>
				<div className='text-center'>
					<p className='mb-2 text-zinc-900 dark:text-zinc-100'>
						¿Deseas reenviar la invitación a este usuario?
					</p>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						Se enviará un nuevo correo electrónico con el enlace de invitación.
					</p>
				</div>

				{/* Información de la invitación a reenviar */}
				<div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
					<div className='flex items-start space-x-3'>
						<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800'>
							<Icon
								icon='HeroEnvelope'
								className='h-4 w-4 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div className='min-w-0 flex-1'>
							<div className='mb-2 flex items-center justify-between'>
								<p className='font-medium text-blue-900 dark:text-blue-100'>
									{invitation.email}
								</p>
								<Badge
									color={statusDetails.color}
									variant='solid'
									className='text-xs'>
									<Icon icon={statusDetails.icon} className='mr-1 h-3 w-3' />
									{statusDetails.label}
								</Badge>
							</div>
							<p className='mb-1 text-sm text-blue-700 dark:text-blue-300'>
								{(() => {
									const fullName = [invitation.first_name, invitation.last_name]
										.filter(Boolean)
										.join(' ')
										.trim();
									return fullName || invitation.email || 'Sin nombre';
								})()}
							</p>
							<p className='text-xs text-blue-600 dark:text-blue-400'>
								Invitado originalmente{' '}
								{formattedOriginalInviteDate ?? 'Sin fecha registrada'}
							</p>
						</div>
					</div>
				</div>

				{/* Información sobre el reenvío */}
				<div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
					<div className='flex items-start space-x-2'>
						<Icon
							icon='HeroInformationCircle'
							className='h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400'
						/>
						<div className='text-sm text-amber-800 dark:text-amber-200'>
							<p className='mb-1 font-medium'>¿Qué sucederá?</p>
							<ul className='space-y-1 text-xs'>
								<li>• Se generará un nuevo enlace de invitación</li>
								<li>• Se enviará un correo electrónico al usuario</li>
								<li>
									• El enlace anterior seguirá siendo válido hasta su expiración
								</li>
								<li>• Se actualizará la fecha de último envío</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Warning para invitaciones ya aceptadas */}
				{invitation.status === 'accepted' && (
					<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20'>
						<div className='flex items-center space-x-2'>
							<Icon
								icon='HeroCheckCircle'
								className='h-5 w-5 text-emerald-600 dark:text-emerald-400'
							/>
							<p className='text-sm text-emerald-800 dark:text-emerald-200'>
								<strong>Nota:</strong> Esta invitación ya fue aceptada. El reenvío
								creará una invitación duplicada.
							</p>
						</div>
					</div>
				)}

				{/* Warning para invitaciones expiradas */}
				{invitation.status === 'expired' && (
					<div className='rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20'>
						<div className='flex items-center space-x-2'>
							<Icon
								icon='HeroExclamationTriangle'
								className='h-5 w-5 text-orange-600 dark:text-orange-400'
							/>
							<p className='text-sm text-orange-800 dark:text-orange-200'>
								<strong>Recomendado:</strong> Esta invitación expiró. El reenvío
								generará un nuevo enlace válido.
							</p>
						</div>
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button
						variant='outline'
						color='zinc'
						onClick={onClose}
						isDisable={isResending}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='blue'
						onClick={handleConfirm}
						isDisable={isResending}
						className='min-w-[120px]'>
						{isResending ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Reenviando...
							</>
						) : (
							<>
								<Icon icon='HeroPaperAirplane' className='mr-2 h-4 w-4' />
								Reenviar
							</>
						)}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ResendInvitationModal;
