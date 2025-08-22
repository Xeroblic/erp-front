import React, { useState } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody } from '../../../../../components/ui/Card';
import Table, { THead, TBody, Tr, Th, Td } from '../../../../../components/ui/Table';
import Badge from '../../../../../components/ui/Badge';
import Button from '../../../../../components/ui/Button';
import Icon from '../../../../../components/icon/Icon';
import { Invitation } from '../../../../../interface/invitacion.interface';
import { useInvitationsManagement } from '../../hooks/useInvitationsManagement';
import {
    InvitationDetailsModal,
    DeleteConfirmationModal,
    ResendInvitationModal
} from '../modals';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

interface InvitationsTableProps {
    invitations: Invitation[];
    isLoading: boolean;
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

const columnHelper = createColumnHelper<Invitation>();

const InvitationsTable: React.FC<InvitationsTableProps> = ({
    invitations,
    isLoading,
    pagination,
}) => {
    const { handleResendInvitation, handleCancelInvitation, isActionLoading } = useInvitationsManagement();

    // Estados para los modales
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [modals, setModals] = useState({
        details: false,
        delete: false,
        resend: false,
    });

    // Funciones para manejar modales
    const openModal = (type: 'details' | 'delete' | 'resend', invitation: Invitation) => {
        setSelectedInvitation(invitation);
        setModals(prev => ({ ...prev, [type]: true }));
    };

    const closeModal = (type: 'details' | 'delete' | 'resend') => {
        setModals(prev => ({ ...prev, [type]: false }));
        setSelectedInvitation(null);
    };

    const closeAllModals = () => {
        setModals({ details: false, delete: false, resend: false });
        setSelectedInvitation(null);
    };

    // Handlers para las acciones
    const handleDeleteConfirm = async () => {
        if (selectedInvitation) {
            await handleCancelInvitation(selectedInvitation.id);
            closeModal('delete');
        }
    };

    const handleResendConfirm = async () => {
        if (selectedInvitation) {
            await handleResendInvitation(selectedInvitation.id);
            closeModal('resend');
        }
    };

    // Debug: mostrar estructura de datos para verificar qué campos vienen del backend
    React.useEffect(() => {
        if (invitations && invitations.length > 0) {
            console.log('📋 Invitations data structure:', {
                total: invitations.length,
                firstItem: invitations[0],
                availableFields: Object.keys(invitations[0]),
                roleField: invitations[0].role || invitations[0].role_name,
                sentByField: invitations[0].sent_by_user,
                statusField: invitations[0].status
            });
        }
    }, [invitations]);

    const columns = [
        columnHelper.accessor('email', {
            header: 'Email',
            cell: (info) => {
                const invitation = info.row.original;
                const email = info.getValue();
                const firstName = invitation.first_name || '';
                const lastName = invitation.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();

                return (
                    <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {email}
                        </span>
                        {fullName && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                                {fullName}
                            </span>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'role',
            header: 'Rol',
            cell: (info) => {
                const invitation = info.row.original;
                // Usar solo las propiedades que existen en el interface
                const role = invitation.role || invitation.role_name || '';

                const roleLabels: Record<string, string> = {
                    'admin': 'Administrador',
                    'hr': 'Recursos Humanos',
                    'employee': 'Empleado',
                    'manager': 'Gerente',
                    'supervisor': 'Supervisor'
                };

                const roleColors: Record<string, { color: any; variant: any }> = {
                    'admin': { color: 'purple', variant: 'solid' },
                    'hr': { color: 'blue', variant: 'solid' },
                    'employee': { color: 'zinc', variant: 'outline' },
                    'manager': { color: 'emerald', variant: 'solid' },
                    'supervisor': { color: 'amber', variant: 'solid' }
                };

                const config = roleColors[role] || { color: 'zinc', variant: 'outline' };
                const label = roleLabels[role] || role || '-';

                if (!role) {
                    return <span className="text-zinc-500 dark:text-zinc-400">-</span>;
                }

                return (
                    <Badge
                        color={config.color}
                        variant={config.variant}
                        className="text-xs"
                    >
                        {label}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor('status', {
            header: 'Estado',
            cell: (info) => {
                const status = info.getValue();
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

                const config = statusConfig[status] || {
                    label: status,
                    color: 'zinc',
                    variant: 'outline',
                    icon: 'HeroQuestionMarkCircle'
                };

                return (
                    <Badge
                        color={config.color}
                        variant={config.variant}
                        className="text-xs font-medium inline-flex items-center"
                    >
                        <Icon icon={config.icon} className="h-4 w-4 me-1.5" />
                        {config.label}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor('created_at', {
            header: 'Fecha de Invitación',
            cell: (info) => {
                const date = new Date(info.getValue());
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {date.toLocaleDateString('es-ES')}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {date.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('expires_at', {
            header: 'Fecha de Expiración',
            cell: (info) => {
                const expiresAt = info.getValue();
                if (!expiresAt) return <span className="text-zinc-500">-</span>;

                const date = new Date(expiresAt);
                const now = new Date();
                const isExpired = date < now;

                return (
                    <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {date.toLocaleDateString('es-ES')}
                        </span>
                        <span className={`text-xs ${isExpired ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            {date.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'sent_by_user',
            header: 'Enviado por',
            cell: (info) => {
                const invitation = info.row.original;
                // Usar solo sent_by_user que está definido en el interface
                const sentBy = invitation.sent_by_user;

                if (!sentBy) {
                    return <span className="text-zinc-500 dark:text-zinc-400">-</span>;
                }

                const firstName = sentBy.first_name || '';
                const lastName = sentBy.last_name || '';
                const email = sentBy.email || '';
                const fullName = `${firstName} ${lastName}`.trim() || email || 'Usuario';

                return (
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                            <Icon icon="HeroUser" size='text-2xl' className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {fullName}
                            </span>
                            {email && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {email}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: (info) => {
                const invitation = info.row.original;
                const canResend = invitation.status === 'pending' || invitation.status === 'expired';
                const canDelete = invitation.status === 'pending' || invitation.status === 'cancelled';
                const isLoading = isActionLoading(invitation.id);

                return (
                    <div className="flex items-center justify-end space-x-2">
                        {/* Ver Detalles */}
                        <Button
                            variant="outline"
                            size="sm"
                            color="blue"
                            onClick={() => openModal('details', invitation)}
                            className="p-0 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Ver detalles"
                        >
                            <Icon icon="HeroEye" />
                        </Button>

                        {/* Reenviar */}
                        {canResend && (
                            <Button
                                variant="outline"
                                size="sm"
                                color="emerald"
                                onClick={() => openModal('resend', invitation)}
                                isDisable={isLoading}
                                className="p-0 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Reenviar invitación"
                            >
                                {isLoading ? (
                                    <Icon icon="HeroArrowPath" className="animate-spin" />
                                ) : (
                                    <Icon icon="HeroPaperAirplane"  />
                                )}
                            </Button>
                        )}

                        {/* Eliminar/Cancelar */}
                        {canDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                color="red"
                                onClick={() => openModal('delete', invitation)}
                                isDisable={isLoading}
                                className="p-0 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title={invitation.status === 'pending' ? 'Cancelar invitación' : 'Eliminar invitación'}
                            >
                                {isLoading ? (
                                    <Icon icon="HeroArrowPath" className="animate-spin" />
                                ) : (
                                    <Icon icon="HeroTrash"  />
                                )}
                            </Button>
                        )}
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: invitations,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: pagination.totalPages,
    });

    if (isLoading && invitations.length === 0) {
        return (
            <Card className="shadow-sm border border-zinc-200 dark:border-zinc-700">
                <CardBody className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Icon icon="HeroArrowPath" className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Cargando invitaciones...
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Por favor espera mientras cargamos la información.
                    </p>
                </CardBody>
            </Card>
        );
    }

    if (!isLoading && invitations.length === 0) {
        return (
            <Card className="shadow-sm border border-zinc-200 dark:border-zinc-700">
                <CardBody className="p-12 text-center">
                    <div className="inline-flex items-center justify-centermb-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                        <Icon icon="HeroPaperAirplane" className="h-10 w-10 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        No hay invitaciones
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        No se encontraron invitaciones con los filtros aplicados.
                    </p>
                    <Button
                        variant="outline"
                        color="blue"
                        icon="HeroPlus"
                        onClick={() => {
                            // TODO: Implementar acción para crear nueva invitación
                            console.log('Crear nueva invitación');
                        }}
                    >
                        Crear nueva invitación
                    </Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-sm border border-zinc-200 dark:border-zinc-700">
                <CardBody className="overflow-x-auto p-0">
                    <Table className="w-full">
                        <THead className="bg-zinc-50 dark:bg-zinc-800/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <Th key={header.id} className="text-left font-semibold text-zinc-700 dark:text-zinc-300 p-4 border-b border-zinc-200 dark:border-zinc-700">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </Th>
                                    ))}
                                </Tr>
                            ))}
                        </THead>
                        <TBody>
                            {table.getRowModel().rows.map((row, index) => (
                                <Tr
                                    key={row.id}
                                    className={`
                                        hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150
                                        ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/20'}
                                        border-b border-zinc-100 dark:border-zinc-800
                                    `}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <Td key={cell.id} className="p-4">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </TBody>
                    </Table>

                    <div className="mt-4">
										<TableCardFooterTemplateV2 table={table} />
									</div>
                </CardBody>
            </Card>

            {/* Modales */}
            <InvitationDetailsModal
                isOpen={modals.details}
                onClose={() => closeModal('details')}
                invitation={selectedInvitation}
            />

            <DeleteConfirmationModal
                isOpen={modals.delete}
                onClose={() => closeModal('delete')}
                onConfirm={handleDeleteConfirm}
                invitation={selectedInvitation}
                isDeleting={selectedInvitation ? isActionLoading(selectedInvitation.id) : false}
            />

            <ResendInvitationModal
                isOpen={modals.resend}
                onClose={() => closeModal('resend')}
                onConfirm={handleResendConfirm}
                invitation={selectedInvitation}
                isResending={selectedInvitation ? isActionLoading(selectedInvitation.id) : false}
            />
        </>
    );
};

export default InvitationsTable;
