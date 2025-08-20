import React, { useMemo, useCallback } from 'react';
import { type UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import SelectReact from '@/components/form/SelectReact';
import { formatRoleName, formatPermissionName } from '../../utils/formatters';

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: UserWithDetails | null;
    permissions: any[];
    roles: any[];
    selectedPermissionIds: number[];
    selectedRoleIds: number[];
    onPermissionChange: (selected: any) => void;
    onRoleChange: (selected: any) => void;
    onSave: () => void;
    isLoading: boolean;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
    isOpen,
    onClose,
    selectedUser,
    permissions,
    roles,
    selectedPermissionIds,
    selectedRoleIds,
    onPermissionChange,
    onRoleChange,
    onSave,
    isLoading
}) => {
    // Select options with better formatting
    const roleOptions = useMemo<TSelectOption[]>(
        () =>
            (roles || []).map((r) => ({
                value: String(r.id),
                label: formatRoleName(r.name),
            })),
        [roles]
    );

    const permissionOptions = useMemo<TSelectOption[]>(
        () =>
            (permissions || []).map((p) => ({
                value: String(p.id),
                label: formatPermissionName(p.name || p.code),
            })),
        [permissions]
    );

    // Selected values for the selects
    const selectedRoleOptions = useMemo(
        () => roleOptions.filter((o) => selectedRoleIds.includes(parseInt(String(o.value), 10))),
        [roleOptions, selectedRoleIds]
    );

    const selectedPermissionOptions = useMemo(
        () => permissionOptions.filter((o) => selectedPermissionIds.includes(parseInt(String(o.value), 10))),
        [permissionOptions, selectedPermissionIds]
    );

    if (!selectedUser) return null;

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose} size="xl">

            <ModalHeader>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-zinc-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">
                            Gestionar Permisos y Roles
                        </h3>
                        <p className="text-sm text-zinc-500">
                            {selectedUser.first_name} {selectedUser.last_name} - {selectedUser.email}
                        </p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                    {/* Información del Usuario */}
                    <Card>
                        <CardHeader>
                            <h4 className="text-md font-semibold flex items-center gap-2">
                                <Icon icon="HeroUser" className="w-5 h-5" />
                                Información del Usuario
                            </h4>
                        </CardHeader>
                        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-600">Cargo:</label>
                                <p className="text-sm">{selectedUser.cargo || '—'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-600">Empresa Principal:</label>
                                <p className="text-sm">
                                    {selectedUser.companies?.[0]?.name || selectedUser.branch?.subsidiary?.company?.company_name || '—'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-600">Sucursal:</label>
                                <p className="text-sm">{selectedUser.branch?.branch_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-600">Estado:</label>
                                <Badge color={selectedUser.is_active ? 'emerald' : 'red'} className="inline-flex items-center gap-1 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${selectedUser.is_active ? 'bg-green-300' : 'bg-red-300'}`} />
                                    {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Resumen de Permisos Actuales */}
                    <Card>
                        <CardHeader>
                            <h4 className="text-md font-semibold flex items-center gap-2">
                                <Icon icon="HeroInformationCircle" className="w-5 h-5" />
                                Resumen de Permisos Actuales
                            </h4>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl shadow-md text-white">
                                    <Icon icon="HeroKey" className="w-8 h-8 mb-2" />
                                    <div className="text-3xl font-extrabold">
                                        {selectedUser.all_permissions?.length || 0}
                                    </div>
                                    <div className="text-base font-medium mt-1">Total de Permisos</div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-md text-zinc-900">
                                    <Icon icon="HeroShieldCheck" className="w-8 h-8 mb-2" />
                                    <div className="text-3xl font-extrabold">
                                        {selectedUser.direct_permissions?.length || 0}
                                    </div>
                                    <div className="text-base font-medium mt-1">Permisos Directos</div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl shadow-md text-white">
                                    <Icon icon="HeroUserGroup" className="w-8 h-8 mb-2" />
                                    <div className="text-3xl font-extrabold">
                                        {selectedUser.role_permissions?.length || 0}
                                    </div>
                                    <div className="text-base font-medium mt-1">Por Roles</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gestión de Roles */}
                        <Card>
                            <CardHeader>
                                <h4 className="text-md font-semibold flex items-center gap-2">
                                    <Icon icon="HeroUserGroup" className="w-5 h-5" />
                                    Roles Asignados
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <SelectReact
                                    key={`roles-${selectedUser?.id || 'none'}`}
                                    name="user-roles"
                                    options={roleOptions}
                                    value={selectedRoleOptions}
                                    onChange={onRoleChange}
                                    placeholder="Seleccionar roles..."
                                    isMulti
                                    isSearchable
                                    className="w-full"
                                />

                                {/* Mostrar roles contextuales actuales */}
                                {selectedUser.contextual_roles && selectedUser.contextual_roles.length > 0 && (
                                    <div className="mt-3">
                                        <label className="text-sm font-medium text-zinc-600 mb-2 block">Contextos de Roles:</label>
                                        <div className="space-y-2">
                                            {selectedUser.contextual_roles.map((contextRole, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded-md">
                                                    <div>
                                                        <span className="font-medium text-sm text-zinc-900">{formatRoleName(contextRole.role)}</span>
                                                        <span className="text-xs text-zinc-800 ml-2">
                                                            en {contextRole.scope_type}: {contextRole.scope_name}
                                                        </span>
                                                    </div>
                                                    <Badge className="text-xs">
                                                        {contextRole.scope_type}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Gestión de Permisos Directos */}
                        <Card>
                            <CardHeader>
                                <h4 className="text-md font-semibold flex items-center gap-2">
                                    <Icon icon="HeroShieldCheck" className="w-5 h-5" />
                                    Permisos Directos
                                </h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <SelectReact
                                    key={`permissions-${selectedUser?.id || 'none'}`}
                                    name="user-permissions"
                                    options={permissionOptions}
                                    value={selectedPermissionOptions}
                                    onChange={onPermissionChange}
                                    placeholder="Seleccionar permisos específicos..."
                                    isMulti
                                    isSearchable
                                    className="w-full"
                                />

                                <div className="text-xs text-zinc-500 p-3 bg-yellow-100 rounded-md border border-yellow-200">
                                    <Icon icon="HeroInformationCircle" className="w-4 h-4 inline mr-2" />
                                    <strong>Nota:</strong> Los permisos directos se suman a los permisos heredados por roles.
                                    Los permisos por roles se calculan automáticamente y no aparecen aquí.
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Permisos por Roles (Solo Lectura) */}
                    {selectedUser.role_permissions && selectedUser.role_permissions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h4 className="text-md font-semibold flex items-center gap-2">
                                    <Icon icon="HeroEye" className="w-5 h-5" />
                                    Permisos Heredados por Roles (Solo Lectura)
                                </h4>
                            </CardHeader>
                            <CardBody>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {Array.from(new Set(selectedUser.role_permissions)).map((permission, index) => (
                                        <Badge key={index} color="violet" className="text-xs">
                                            {formatPermissionName(permission)}
                                        </Badge>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </ModalBody>

            <ModalFooter className="flex justify-between">
                <div className="text-sm text-zinc-500">
                    Total de permisos después de cambios: {selectedUser.all_permissions?.length || 0}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onSave}
                        isDisable={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Icon icon="HeroCheckCircle" className="w-4 h-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    );
};
