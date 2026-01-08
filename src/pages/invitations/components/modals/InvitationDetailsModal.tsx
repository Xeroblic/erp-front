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
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader className='border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-blue-100 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-lg'>
						<Icon icon='HeroEye' className='h-6 w-6 text-white' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
							Detalles de Invitación
						</h2>
						<p className='text-xs text-zinc-600 dark:text-zinc-400'>
							{invitation.email}
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-5 p-6'>
				{/* Información del Usuario */}
				<div className='overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
					<div className='border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
						<h3 className='flex items-center text-base font-bold text-zinc-900 dark:text-zinc-100'>
							<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30'>
								<Icon
									icon='HeroUser'
									className='h-4 w-4 text-orange-600 dark:text-orange-400'
								/>
							</div>
							Información del Usuario
						</h3>
					</div>
					<div className='grid grid-cols-1 gap-6 p-5 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								<Icon icon='HeroEnvelope' className='mr-1.5 h-3.5 w-3.5' />
								Email
							</label>
							<p className='flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{invitation.email}
							</p>
						</div>
						<div className='space-y-1'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								<Icon icon='HeroUserCircle' className='mr-1.5 h-3.5 w-3.5' />
								Invitado por
							</label>
							<p className='flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100'>
								{`${invitation.invited_by}` || '-'}
							</p>
						</div>
						{invitation.rut && (
							<div className='space-y-1'>
								<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
									<Icon
										icon='HeroIdentification'
										className='mr-1.5 h-3.5 w-3.5'
									/>
									RUT
								</label>
								<p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
									{invitation.rut}
								</p>
							</div>
						)}
						{invitation.position && (
							<div className='space-y-1'>
								<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
									<Icon icon='HeroBriefcase' className='mr-1.5 h-3.5 w-3.5' />
									Cargo
								</label>
								<p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
									{invitation.position}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Estado y Rol */}
				<div className='overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
					<div className='border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
						<h3 className='flex items-center text-base font-bold text-zinc-900 dark:text-zinc-100'>
							<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30'>
								<Icon
									icon='HeroShieldCheck'
									className='h-4 w-4 text-purple-600 dark:text-purple-400'
								/>
							</div>
							Estado y Permisos
						</h3>
					</div>
					<div className='grid grid-cols-1 gap-6 p-5 md:grid-cols-2'>
						<div className='space-y-2'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								Estado
							</label>
							<Badge
								color={statusDetails.color}
								variant='outline'
								className='inline-flex items-center border border-dashed px-3 py-1.5 text-sm font-semibold shadow-sm'>
								<Icon icon={statusDetails.icon} className='mr-2 h-4 w-4' />
								{statusDetails.label}
							</Badge>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								Rol
							</label>
							<Badge
								color='blue'
								variant='outline'
								className='inline-flex items-center border border-dashed px-3 py-1.5 text-sm font-semibold shadow-sm'>
								<Icon icon='HeroUserGroup' className='mr-2 h-4 w-4' />
								{roleLabel}
							</Badge>
						</div>
					</div>
				</div>

				{/* Fechas Importantes */}
				<div className='overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
					<div className='border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
						<h3 className='flex items-center text-base font-bold text-zinc-900 dark:text-zinc-100'>
							<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30'>
								<Icon
									icon='HeroCalendarDays'
									className='h-4 w-4 text-blue-600 dark:text-blue-400'
								/>
							</div>
							Fechas
						</h3>
					</div>
					<div className='grid grid-cols-1 gap-6 p-5 md:grid-cols-2'>
						<div className='space-y-1'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								<Icon icon='HeroClock' className='mr-1.5 h-3.5 w-3.5' />
								Fecha de Invitación
							</label>
							<div className='rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-700'>
								<p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
									{new Date(invitation?.invited_at ?? '').toLocaleDateString(
										'es-ES',
										{
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										},
									)}
								</p>
								<p className='text-xs text-zinc-600 dark:text-zinc-400'>
									{new Date(invitation?.invited_at ?? '').toLocaleTimeString(
										'es-ES',
										{
											hour: '2-digit',
											minute: '2-digit',
										},
									)}
								</p>
							</div>
						</div>
						<div className='space-y-1'>
							<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
								<Icon icon='HeroCalendar' className='mr-1.5 h-3.5 w-3.5' />
								Fecha de Expiración
							</label>
							<div className='rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-700'>
								<p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
									{invitation.expires_at
										? new Date(invitation.expires_at).toLocaleDateString(
												'es-ES',
												{
													year: 'numeric',
													month: 'long',
													day: 'numeric',
												},
											)
										: '-'}
								</p>
								{invitation.expires_at && (
									<p className='text-xs text-zinc-600 dark:text-zinc-400'>
										{new Date(invitation.expires_at).toLocaleTimeString(
											'es-ES',
											{
												hour: '2-digit',
												minute: '2-digit',
											},
										)}
									</p>
								)}
							</div>
						</div>
						{invitation.accepted_at && (
							<div className='space-y-1'>
								<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
									<Icon icon='HeroCheckCircle' className='mr-1.5 h-3.5 w-3.5' />
									Fecha de Aceptación
								</label>
								<div className='rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20'>
									<p className='text-sm font-semibold text-emerald-900 dark:text-emerald-100'>
										{new Date(invitation.accepted_at).toLocaleDateString(
											'es-ES',
											{
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											},
										)}
									</p>
									<p className='text-xs text-emerald-700 dark:text-emerald-400'>
										{new Date(invitation.accepted_at).toLocaleTimeString(
											'es-ES',
											{
												hour: '2-digit',
												minute: '2-digit',
											},
										)}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Enviado por */}
				{invitation.sent_by_user && (
					<div className='overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
						<div className='border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
							<h3 className='flex items-center text-base font-bold text-zinc-900 dark:text-zinc-100'>
								<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30'>
									<Icon
										icon='HeroUserCircle'
										className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
									/>
								</div>
								Enviado por
							</h3>
						</div>
						<div className='p-5'>
							<div className='flex items-center space-x-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md'>
									<Icon icon='HeroUser' className='h-6 w-6 text-white' />
								</div>
								<div className='flex-1'>
									<p className='font-semibold text-zinc-900 dark:text-zinc-100'>
										{invitation.sent_by_user.first_name}{' '}
										{invitation.sent_by_user.last_name}
									</p>
									<p className='text-sm text-zinc-600 dark:text-zinc-400'>
										{invitation.sent_by_user.email}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Información de la Empresa */}
				{(invitation.company || invitation.branch) && (
					<div className='overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-900'>
						<div className='border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800'>
							<h3 className='flex items-center text-base font-bold text-zinc-900 dark:text-zinc-100'>
								<div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30'>
									<Icon
										icon='HeroBuildingOffice'
										className='h-4 w-4 text-indigo-600 dark:text-indigo-400'
									/>
								</div>
								Información de la Empresa
							</h3>
						</div>
						<div className='grid grid-cols-1 gap-6 p-5 md:grid-cols-2'>
							{invitation.company && (
								<div className='space-y-1'>
									<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
										<Icon
											icon='HeroBuildingOffice2'
											className='mr-1.5 h-3.5 w-3.5'
										/>
										Empresa
									</label>
									<div className='rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-700'>
										<p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
											{invitation.company.company_name}
										</p>
									</div>
								</div>
							)}
							{invitation.branch && (
								<div className='space-y-1'>
									<label className='flex items-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
										<Icon icon='HeroMapPin' className='mr-1.5 h-3.5 w-3.5' />
										Sucursal
									</label>
									<div className='rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-700'>
										<p className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
											{invitation.branch.branch_name}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</ModalBody>

			<ModalFooter className='border-t border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'>
				<ModalFooterChild>
					<Button variant='solid' color='blue' onClick={onClose} className='shadow-sm'>
						<Icon icon='HeroXMark' className='mr-2 h-4 w-4 text-white font-bold' />
						Cerrar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default InvitationDetailsModal;
