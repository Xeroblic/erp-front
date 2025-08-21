import React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Icon from '@/components/icon/Icon';
import { Invitation } from '@/store/slices/invitations/invitationsSlice';
import { useInvitationsManagement } from '../../hooks/useInvitationsManagement';

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
    onPageChange,
    onPageSizeChange,
}) => {
    const { handleResendInvitation, handleCancelInvitation, isActionLoading } = useInvitationsManagement();

    const columns = [
        columnHelper.accessor('email', {
            header: 'Email',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {info.getValue()}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {info.row.original.first_name} {info.row.original.last_name}
                    </span>
                </div>
            ),
        }),
        columnHelper.accessor('role', {
            header: 'Rol',
            cell: (info) => {
                const role = info.getValue();
                const roleLabels: Record<string, string> = {
                    admin: 'Administrador',
                    hr: 'Recursos Humanos',
                    employee: 'Empleado'
                };
                const roleColors: Record<string, { color: any; variant: any }> = {
                    admin: { color: 'purple', variant: 'solid' },
                    hr: { color: 'blue', variant: 'solid' },
                    employee: { color: 'zinc', variant: 'outline' }
                };
                const config = roleColors[role] || { color: 'zinc', variant: 'outline' };
                return (
                    <Badge
                        color={config.color}
                        variant={config.variant}
                        className="text-xs"
                    >
                        {roleLabels[role] || role}
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
                        className="text-xs"
                    >
                        <Icon icon={config.icon} className="h-3 w-3 me-1" />
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
        columnHelper.accessor('sent_by_user', {
            header: 'Enviado por',
            cell: (info) => {
                const sentBy = info.getValue();
                if (!sentBy) return <span className="text-zinc-500">-</span>;

                return (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                            <Icon icon="HeroUser" className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {sentBy.first_name} {sentBy.last_name}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {sentBy.email}
                            </span>
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
                const canCancel = invitation.status === 'pending';
                const isLoading = isActionLoading(invitation.id);

                return (
                    <div className="flex items-center justify-end">
                        <Dropdown>
                            <DropdownToggle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    color="zinc"
                                    icon="HeroEllipsisVertical"
                                    className="w-8 h-8"
                                />
                            </DropdownToggle>
                            <DropdownMenu className="min-w-[200px]">
                                <DropdownItem>
                                    <div className="flex items-center w-full">
                                        <Icon icon="HeroEye" className="h-4 w-4 me-2" />
                                        Ver detalles
                                    </div>
                                </DropdownItem>

                                {canResend && (
                                    <DropdownItem
                                        onClick={() => handleResendInvitation(invitation.id)}
                                        className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <div className="flex items-center w-full">
                                            {isLoading ? (
                                                <Icon icon="HeroClock" className="h-4 w-4 me-2 animate-spin" />
                                            ) : (
                                                <Icon icon="HeroPaperAirplane" className="h-4 w-4 me-2 text-emerald-600" />
                                            )}
                                            Reenviar invitación
                                        </div>
                                    </DropdownItem>
                                )}

                                {canCancel && (
                                    <DropdownItem
                                        onClick={() => handleCancelInvitation(invitation.id)}
                                        className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <div className="flex items-center w-full">
                                            {isLoading ? (
                                                <Icon icon="HeroClock" className="h-4 w-4 me-2 animate-spin" />
                                            ) : (
                                                <Icon icon="HeroXMark" className="h-4 w-4 me-2 text-red-600" />
                                            )}
                                            Cancelar invitación
                                        </div>
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
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
            <Card>
                <CardBody className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm text-zinc-500">Cargando invitaciones...</p>
                </CardBody>
            </Card>
        );
    }

    if (!isLoading && invitations.length === 0) {
        return (
            <Card>
                <CardBody className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                        <Icon icon="HeroPaperAirplane" className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                        No hay invitaciones
                    </h3>
                    <p className="text-zinc-500">
                        No se encontraron invitaciones con los filtros aplicados.
                    </p>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardBody className="overflow-x-auto">
                <Table className="w-full">
                    <THead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <Th key={header.id} className="text-left">
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
                        {table.getRowModel().rows.map((row) => (
                            <Tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <Td key={cell.id}>
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

                {/* Pagination */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                Mostrando{' '}
                                <span className="font-medium">
                                    {((pagination.page - 1) * pagination.pageSize) + 1}
                                </span>{' '}
                                a{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium">
                                    {pagination.total}
                                </span>{' '}
                                resultados
                            </span>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={10}>10 por página</option>
                                <option value={25}>25 por página</option>
                                <option value={50}>50 por página</option>
                                <option value={100}>100 por página</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page - 1)}
                                isDisable={pagination.page <= 1}
                                icon="HeroChevronLeft"
                            >
                                Anterior
                            </Button>

                            <span className="text-sm text-zinc-600 dark:text-zinc-400 px-3">
                                Página {pagination.page} de {pagination.totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page + 1)}
                                isDisable={pagination.page >= pagination.totalPages}
                                rightIcon="HeroChevronRight"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default InvitationsTable;
