import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '../../../../../components/ui/Modal';
import Badge from '../../../../../components/ui/Badge';
import Button from '../../../../../components/ui/Button';
import Icon from '../../../../../components/icon/Icon';
import { Invitation } from '../../../../../interface/invitacion.interface';

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

    const statusConfig: Record<string, { label: string; color: any; variant: any; icon: string }> = {
        pending: {
            label: 'Pendiente',
            color: 'amber',
            variant: 'solid',
            icon: 'HeroClock'
        },
        sent: {
            label: 'Enviada',
            color: 'blue',
            variant: 'solid',
            icon: 'HeroPaperAirplane'
        },
        accepted: {
            label: 'Aceptada',
            color: 'emerald',
            variant: 'solid',
            icon: 'HeroCheckCircle'
        },
        expired: {
            label: 'Expirada',
            color: 'red',
            variant: 'solid',
            icon: 'HeroXCircle'
        },
        cancelled: {
            label: 'Cancelada',
            color: 'zinc',
            variant: 'outline',
            icon: 'HeroXMark'
        }
    };

    const roleLabels: Record<string, string> = {
        'admin': 'Administrador',
        'hr': 'Recursos Humanos',
        'employee': 'Empleado',
        'manager': 'Gerente',
        'supervisor': 'Supervisor'
    };

    const statusDetails = statusConfig[invitation.status] || statusConfig.pending;
    const roleLabel = roleLabels[invitation.role || invitation.role_name] || invitation.role || invitation.role_name || '-';

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose} size="lg">
            <ModalHeader>
                <div className="flex items-center space-x-3">
                    <Icon icon="HeroEye" className="h-6 w-6 text-blue-600" />
                    <span>Detalles de Invitación</span>
                </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
                {/* Información del Usuario */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                        <Icon icon="HeroUser" className="h-5 w-5 mr-2" />
                        Información del Usuario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">{invitation.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Nombre Completo</label>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                {`${invitation.first_name} ${invitation.last_name}`.trim() || '-'}
                            </p>
                        </div>
                        {invitation.rut && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">RUT</label>
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">{invitation.rut}</p>
                            </div>
                        )}
                        {invitation.position && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargo</label>
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">{invitation.position}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estado y Rol */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                        <Icon icon="HeroShieldCheck" className="h-5 w-5 mr-2" />
                        Estado y Permisos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Estado</label>
                            <Badge
                                color={statusDetails.color}
                                variant={statusDetails.variant}
                                className="text-sm"
                            >
                                <Icon icon={statusDetails.icon} className="h-4 w-4 mr-1" />
                                {statusDetails.label}
                            </Badge>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Rol</label>
                            <Badge color="blue" variant="solid" className="text-sm">
                                {roleLabel}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Fechas Importantes */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                        <Icon icon="HeroCalendarDays" className="h-5 w-5 mr-2" />
                        Fechas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Fecha de Invitación</label>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                {new Date(invitation.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Fecha de Expiración</label>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                {invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : '-'}
                            </p>
                        </div>
                        {invitation.accepted_at && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Fecha de Aceptación</label>
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                    {new Date(invitation.accepted_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enviado por */}
                {invitation.sent_by_user && (
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                            <Icon icon="HeroUserCircle" className="h-5 w-5 mr-2" />
                            Enviado por
                        </h3>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                                <Icon icon="HeroUser" className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {invitation.sent_by_user.first_name} {invitation.sent_by_user.last_name}
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {invitation.sent_by_user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información de la Empresa */}
                {(invitation.company || invitation.branch) && (
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                            <Icon icon="HeroBuildingOffice" className="h-5 w-5 mr-2" />
                            Información de la Empresa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {invitation.company && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Empresa</label>
                                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                        {invitation.company.company_name}
                                    </p>
                                </div>
                            )}
                            {invitation.branch && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">Sucursal</label>
                                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
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
                    <Button
                        variant="outline"
                        color="zinc"
                        onClick={onClose}
                    >
                        <Icon icon="HeroXMark" className="h-4 w-4 mr-2" />
                        Cerrar
                    </Button>
                </ModalFooterChild>
            </ModalFooter>
        </Modal>
    );
};

export default InvitationDetailsModal;
