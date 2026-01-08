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
import { INVITATION_STATUS_MAP, normalizeInvitationStatus } from '@/constants/invitations.constant';

interface InvitationDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	invitation: Invitation | null;
}

const InvitationDetailsModal: React.FC<InvitationDetailsModalProps> = ({
	isOpen,
	onClose,
	invitation,
}) => {
	if (!invitation) return null;

	const roleLabels: Record<string, string> = {
		admin: 'Administrador',
		hr: 'Recursos Humanos',
		employee: 'Empleado',
		manager: 'Gerente',
		supervisor: 'Supervisor',
	};

	// Normalizar el estado y obtener la configuración
	const normalizedStatus = normalizeInvitationStatus(invitation.status);
	const statusDetails = INVITATION_STATUS_MAP[normalizedStatus] || INVITATION_STATUS_MAP.pending;
	const roleLabel =
		roleLabels[invitation.role || invitation.role_name] ||
		invitation.role ||
		invitation.role_name ||
		'-';

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
					<span>Detalles de Invitación</span>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-6'>
				{/* Información del Usuario */}
				<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
					<h3 className='mb-3 flex items-center text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						<Icon icon='HeroUser' className='mr-2 h-5 w-5' />
						Información del Usuario
					</h3>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Email
							</label>
							<p className='text-sm text-zinc-900 dark:text-zinc-100'>
								{invitation.email}
							</p>
						</div>
						<div>
							<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Invitado por:
							</label>
							<p className='text-sm text-zinc-900 dark:text-zinc-100'>
								{`${invitation.invited_by}` || '-'}
							</p>
						</div>
						{invitation.rut && (
							<div>
								<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
									RUT
								</label>
								<p className='text-sm text-zinc-900 dark:text-zinc-100'>
									{invitation.rut}
								</p>
							</div>
						)}
						{invitation.position && (
							<div>
								<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
									Cargo
								</label>
								<p className='text-sm text-zinc-900 dark:text-zinc-100'>
									{invitation.position}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Estado y Rol */}
				<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
					<h3 className='mb-3 flex items-center text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						<Icon icon='HeroShieldCheck' className='mr-2 h-5 w-5' />
						Estado y Permisos
					</h3>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Estado
							</label>
							<Badge
								color={statusDetails.color}
								variant={statusDetails.variant}
								className='text-sm'>
								<Icon icon={statusDetails.icon} className='mr-1 h-4 w-4' />
								{statusDetails.label}
							</Badge>
						</div>
						<div>
							<label className='mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Rol
							</label>
							<Badge color='blue' variant='solid' className='text-sm'>
								{roleLabel}
							</Badge>
						</div>
					</div>
				</div>

				{/* Fechas Importantes */}
				<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
					<h3 className='mb-3 flex items-center text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						<Icon icon='HeroCalendarDays' className='mr-2 h-5 w-5' />
						Fechas
					</h3>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Fecha de Invitación
							</label>
							<p className='text-sm text-zinc-900 dark:text-zinc-100'>
								{new Date(invitation?.invited_at ?? '').toLocaleDateString(
									'es-ES',
									{
										year: 'numeric',
										month: 'long',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									},
								)}
							</p>
						</div>
						<div>
							<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
								Fecha de Expiración
							</label>
							<p className='text-sm text-zinc-900 dark:text-zinc-100'>
								{invitation.expires_at
									? new Date(invitation.expires_at).toLocaleDateString('es-ES', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})
									: '-'}
							</p>
						</div>
						{invitation.accepted_at && (
							<div>
								<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
									Fecha de Aceptación
								</label>
								<p className='text-sm text-zinc-900 dark:text-zinc-100'>
									{new Date(invitation.accepted_at).toLocaleDateString('es-ES', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									})}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Enviado por */}
				{invitation.sent_by_user && (
					<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
						<h3 className='mb-3 flex items-center text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
							<Icon icon='HeroUserCircle' className='mr-2 h-5 w-5' />
							Enviado por
						</h3>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700'>
								<Icon
									icon='HeroUser'
									className='h-5 w-5 text-zinc-600 dark:text-zinc-300'
								/>
							</div>
							<div>
								<p className='font-medium text-zinc-900 dark:text-zinc-100'>
									{invitation.sent_by_user.first_name}{' '}
									{invitation.sent_by_user.last_name}
								</p>
								<p className='text-sm text-zinc-600 dark:text-zinc-400'>
									{invitation.sent_by_user.email}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Información de la Empresa */}
				{(invitation.company || invitation.branch) && (
					<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
						<h3 className='mb-3 flex items-center text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
							<Icon icon='HeroBuildingOffice' className='mr-2 h-5 w-5' />
							Información de la Empresa
						</h3>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							{invitation.company && (
								<div>
									<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
										Empresa
									</label>
									<p className='text-sm text-zinc-900 dark:text-zinc-100'>
										{invitation.company.company_name}
									</p>
								</div>
							)}
							{invitation.branch && (
								<div>
									<label className='block text-sm font-medium text-zinc-600 dark:text-zinc-400'>
										Sucursal
									</label>
									<p className='text-sm text-zinc-900 dark:text-zinc-100'>
										{invitation.branch.branch_name}
									</p>
								</div>
							)}
						</div>
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='zinc' onClick={onClose}>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
						Cerrar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default InvitationDetailsModal;
