import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    fetchUsers,
    fetchUserDetails,
    updateUser,
    toggleUserStatus,
    setFilters,
    clearSelectedUser,
    type UserWithDetails
} from '@/store/slices/usersAdmin/usersAdminSlice';
import {
    fetchPermissions,
    fetchRoles,
    fetchUserPermissions,
    fetchUserRoles,
    assignPermissionToUser,
    revokePermissionFromUser,
    assignRoleToUser,
    revokeRoleFromUser
} from '@/store/slices/permissions/permissionsSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    SortingState
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

const columnHelper = createColumnHelper<UserWithDetails>();

export default function PermissionsAdmin() {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((s) => s.auth.user);

    // Estados del store
    const {
        users,
        selectedUser,
        loading: usersLoading,
        filters
    } = useAppSelector((s) => s.usersAdmin);

    const {
        permissions,
        roles,
        userPermissions,
        userRoles,
        loading: permissionsLoading
    } = useAppSelector((s) => s.permissions);

    // Estados locales
    const [sorting, setSorting] = useState<SortingState>([]);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserWithDetails | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

    // Cargar datos iniciales
    useEffect(() => {
        dispatch(fetchUsers({}));
        dispatch(fetchPermissions());
        dispatch(fetchRoles());
    }, [dispatch]);

    // Debug: Log de usuarios cuando cambian
    useEffect(() => {
        if (users && users.length > 0) {
            console.log('🎯 DEBUG - Usuarios en componente:', users);
            console.log('🎯 DEBUG - Primer usuario:', users[0]);
            console.log('🎯 DEBUG - Company del primer usuario:', users[0]?.company);
            console.log('🎯 DEBUG - Subsidiary del primer usuario:', users[0]?.subsidiary);
            console.log('🎯 DEBUG - Branch del primer usuario:', users[0]?.branch);
            console.log('🎯 DEBUG - Roles del primer usuario:', users[0]?.roles);
        }
    }, [users]);

    // Configurar tabla
    const columns = [
        columnHelper.accessor('first_name', {
            header: 'Nombre',
            cell: info => `${info.getValue()} ${info.row.original.last_name}`
        }),
        columnHelper.accessor('email', { header: 'Email', cell: info => info.getValue() }),
        columnHelper.accessor('position', { header: 'Cargo', cell: info => info.getValue() ?? '—' }),
        columnHelper.accessor('company.name', {
            header: 'Empresa',
            cell: info => {
                const user = info.row.original;
                const parts = [];

                if (user.company?.name) {
                    parts.push(user.company.name);
                }

                if (user.subsidiary?.name) {
                    parts.push(`• ${user.subsidiary.name}`);
                }

                if (user.branch?.name) {
                    parts.push(`• ${user.branch.name}`);
                }

                return parts.length > 0 ? (
                    <div className="text-sm">
                        {parts.map((part, index) => (
                            <div key={index} className={index === 0 ? 'font-medium' : 'text-gray-600 ml-2'}>
                                {part}
                            </div>
                        ))}
                    </div>
                ) : '—';
            },
        }),
        columnHelper.accessor('is_active', {
            header: 'Estado',
            cell: info => (
                <Badge color={info.getValue() ? 'emerald' : 'red'}>
                    {info.getValue() ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        }),
        columnHelper.display({
            id: 'roles',
            header: 'Roles',
            cell: info => {
                const roles = info.row.original.roles;
                return roles && roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {roles.map(role => (
                            <Badge key={role.id} color="blue" className="text-xs">
                                {role.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">Sin roles</span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Acciones',
            cell: info => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPermissionsModal(info.row.original)}
                    >
                        <Icon icon="HeroShieldCheck" className="w-4 h-4" />
                        Permisos
                    </Button>
                    <Button
                        size="sm"
                        color={info.row.original.is_active ? 'red' : 'emerald'}
                        onClick={() => handleToggleUserStatus(info.row.original)}
                    >
                        {info.row.original.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                </div>
            ),
        }),
    ];

    const table = useReactTable({
        data: users,
        columns,
        state: { globalFilter: filters.search, sorting },
        onGlobalFilterChange: (value) => dispatch(setFilters({ search: value })),
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } }
    });

    // Handlers
    const handleOpenPermissionsModal = async (user: UserWithDetails) => {
        setSelectedUserForPermissions(user);
        setIsPermissionsModalOpen(true);

        // Cargar permisos y roles del usuario
        await dispatch(fetchUserDetails(user.id));
        await dispatch(fetchUserPermissions(user.id));
        await dispatch(fetchUserRoles(user.id));

        // Preseleccionar permisos y roles actuales
        const currentPermissions = (userPermissions || [])
            .filter(up => up.user_id === user.id)
            .map(up => up.permission_id);
        const currentRoles = (userRoles || [])
            .filter(ur => ur.user_id === user.id)
            .map(ur => ur.role_id);

        setSelectedPermissionIds(currentPermissions);
        setSelectedRoleIds(currentRoles);
    };

    const handleToggleUserStatus = async (user: UserWithDetails) => {
        try {
            await dispatch(toggleUserStatus({
                userId: user.id,
                status: !user.is_active
            })).unwrap();
            toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
        } catch (error: any) {
            toast.error(error);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedUserForPermissions) return;

        try {
            const currentPermissions = (userPermissions || [])
                .filter(up => up.user_id === selectedUserForPermissions.id)
                .map(up => up.permission_id);

            const currentRoles = (userRoles || [])
                .filter(ur => ur.user_id === selectedUserForPermissions.id)
                .map(ur => ur.role_id);

            // Permisos a agregar y quitar
            const permissionsToAdd = selectedPermissionIds.filter(id => !currentPermissions.includes(id));
            const permissionsToRemove = currentPermissions.filter(id => !selectedPermissionIds.includes(id));

            // Roles a agregar y quitar
            const rolesToAdd = selectedRoleIds.filter(id => !currentRoles.includes(id));
            const rolesToRemove = currentRoles.filter(id => !selectedRoleIds.includes(id));

            // Ejecutar cambios de permisos
            for (const permissionId of permissionsToAdd) {
                await dispatch(assignPermissionToUser({
                    userId: selectedUserForPermissions.id,
                    permissionId
                })).unwrap();
            }

            for (const permissionId of permissionsToRemove) {
                await dispatch(revokePermissionFromUser({
                    userId: selectedUserForPermissions.id,
                    permissionId
                })).unwrap();
            }

            // Ejecutar cambios de roles
            for (const roleId of rolesToAdd) {
                await dispatch(assignRoleToUser({
                    userId: selectedUserForPermissions.id,
                    roleId,
                    companyId: selectedUserForPermissions.company?.id
                })).unwrap();
            }

            for (const roleId of rolesToRemove) {
                await dispatch(revokeRoleFromUser({
                    userId: selectedUserForPermissions.id,
                    roleId
                })).unwrap();
            }

            toast.success('Permisos actualizados correctamente');
            setIsPermissionsModalOpen(false);
            dispatch(fetchUsers({})); // Recargar usuarios
        } catch (error: any) {
            toast.error(error);
        }
    };

    // Opciones para selects
    const permissionOptions: TSelectOption[] = (permissions || []).map(p => ({
        value: p.id.toString(),
        label: `${p.name} (${p.code})`
    }));

    const roleOptions: TSelectOption[] = (roles || []).map(r => ({
        value: r.id.toString(),
        label: `${r.name} - Nivel ${r.level}`
    }));

    return (
        <PageWrapper isProtectedRoute title="Administración de Permisos" name="Permisos">
            <Subheader>
                <SubheaderLeft>
                    <Badge className="text-xl">Gestión de Permisos de Usuarios</Badge>
                </SubheaderLeft>
                <SubheaderRight>
                    <Input
                        name='search'
                        placeholder="Buscar usuarios..."
                        value={filters.search}
                        onChange={e => dispatch(setFilters({ search: e.target.value }))}
                        className="border rounded w-64"
                    />
                </SubheaderRight>
            </Subheader>

            <Container className="pt-4">
                <Card>
                    <CardBody className="overflow-auto">
                        {usersLoading.users ? (
                            <div className="p-8 text-center">Cargando usuarios…</div>
                        ) : !users || users.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                <p>No hay usuarios registrados</p>
                                <p className="text-xs mt-2 text-gray-400">
                                    Debug: users.length={users?.length}, loading={usersLoading.users}
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table className="table-fixed w-full">
                                    <THead>
                                        {table.getHeaderGroups().map(hg => (
                                            <Tr key={hg.id}>
                                                {hg.headers.map(header => (
                                                    <Th key={header.id} className="text-left">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </Th>
                                                ))}
                                            </Tr>
                                        ))}
                                    </THead>
                                    <TBody>
                                        {table.getRowModel().rows.map(row => (
                                            <Tr key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <Td key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </Td>
                                                ))}
                                            </Tr>
                                        ))}
                                    </TBody>
                                </Table>
                                <div className="mt-4">
                                    <TableCardFooterTemplateV2 table={table} />
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal de gestión de permisos */}
            <Modal
                isOpen={isPermissionsModalOpen}
                setIsOpen={setIsPermissionsModalOpen}
                size="xl"
            >
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        <Icon icon="HeroShieldCheck" className="w-5 h-5" />
                        Gestionar Permisos - {selectedUserForPermissions?.first_name} {selectedUserForPermissions?.last_name}
                    </div>
                </ModalHeader>

                <ModalBody>
                    <div className="space-y-6">
                        {/* Información del usuario */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Información del Usuario</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Email:</span> {selectedUserForPermissions?.email}
                                    </div>
                                    <div>
                                        <span className="font-medium">Cargo:</span> {selectedUserForPermissions?.position || '—'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Empresa:</span> {selectedUserForPermissions?.company?.name || '—'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Estado:</span>{' '}
                                        <Badge color={selectedUserForPermissions?.is_active ? 'emerald' : 'red'}>
                                            {selectedUserForPermissions?.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Asignación de roles */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Roles del Usuario
                            </label>
                            <SelectReact
                                name="user-roles"
                                options={roleOptions}
                                value={roleOptions.filter(option =>
                                    selectedRoleIds.includes(parseInt(option.value))
                                )}
                                onChange={(selectedOptions) => {
                                    const ids = Array.isArray(selectedOptions)
                                        ? selectedOptions.map(option => parseInt(option.value))
                                        : selectedOptions ? [parseInt((selectedOptions as TSelectOption).value)] : [];
                                    setSelectedRoleIds(ids);
                                }}
                                placeholder="Seleccionar roles..."
                                isMulti
                                isSearchable
                            />
                        </div>

                        {/* Asignación de permisos individuales */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Permisos Adicionales
                            </label>
                            <SelectReact
                                name="user-permissions"
                                options={permissionOptions}
                                value={permissionOptions.filter(option =>
                                    selectedPermissionIds.includes(parseInt(option.value))
                                )}
                                onChange={(selectedOptions) => {
                                    const ids = Array.isArray(selectedOptions)
                                        ? selectedOptions.map(option => parseInt(option.value))
                                        : selectedOptions ? [parseInt((selectedOptions as TSelectOption).value)] : [];
                                    setSelectedPermissionIds(ids);
                                }}
                                placeholder="Seleccionar permisos..."
                                isMulti
                                isSearchable
                            />
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsPermissionsModalOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="blue"
                        onClick={handleSavePermissions}
                        isLoading={permissionsLoading.userPermissions || permissionsLoading.userRoles}
                    >
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </Modal>
        </PageWrapper>
    );
}
