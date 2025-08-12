import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

    // Debug: Estado de permisos y roles cargados
    useEffect(() => {
        console.log('🔍 Estado actual del store:', {
            permissions: permissions?.length || 0,
            roles: roles?.length || 0,
            permissionsData: permissions?.slice(0, 5)?.map(p => ({ id: p.id, code: p.code, name: p.name })),
            rolesData: roles?.slice(0, 3)?.map(r => ({ id: r.id, name: r.name }))
        });
    }, [permissions, roles]);

    // Pre-selección optimizada con useMemo
    const { preselectedRoleIds, preselectedPermissionIds } = useMemo(() => {
        if (!selectedUserForPermissions || !roles.length || !permissions.length) {
            return { preselectedRoleIds: [], preselectedPermissionIds: [] };
        }

        // Roles actuales optimizado
        const currentRoleIds: number[] = [];

        // Roles legacy
        if (selectedUserForPermissions.roles?.length) {
            console.log('✅ Encontrados roles legacy:', selectedUserForPermissions.roles);
            currentRoleIds.push(...selectedUserForPermissions.roles.map(r => r.id));
        }

        // Mapeo rápido de nombres a IDs de roles
        const roleNameToId = new Map(roles.map(r => [r.name, r.id]));

        // Roles globales y contextuales
        const allUserRoleNames = [
            ...(selectedUserForPermissions.global_roles || []),
            ...(selectedUserForPermissions.contextual_roles?.map(cr => cr.role) || [])
        ];

        allUserRoleNames.forEach(roleName => {
            const roleId = roleNameToId.get(roleName);
            if (roleId && !currentRoleIds.includes(roleId)) {
                currentRoleIds.push(roleId);
            }
        });

        // Permisos actuales optimizado
        const currentPermissionIds: number[] = [];

        // Mapeo rápido de códigos a IDs de permisos
        console.log('🔍 ANTES del mapeo - Permisos disponibles:', permissions?.length || 0);
        console.log('🔍 ANTES del mapeo - Primeros 3 permisos:', permissions?.slice(0, 3)?.map(p => ({ id: p.id, code: p.code, name: p.name })));

        // Verificar códigos duplicados
        const codes = permissions.map(p => p.code);
        const uniqueCodes = new Set(codes);
        if (codes.length !== uniqueCodes.size) {
            console.warn('⚠️ ¡Códigos de permisos duplicados detectados!', {
                totalPermisos: codes.length,
                codigosUnicos: uniqueCodes.size,
                duplicados: codes.filter((code, index) => codes.indexOf(code) !== index)
            });
        }

        // Crear mapeo usando ID como fallback si hay códigos duplicados
        const permissionCodeToId = new Map();
        const permissionIdToName = new Map();

        permissions.forEach(p => {
            // Si hay códigos duplicados, usar ID como clave, sino usar code
            const key = uniqueCodes.size < permissions.length ? p.id.toString() : p.code;
            permissionCodeToId.set(key, p.id);
            permissionIdToName.set(p.id, p.name);
        });

        console.log('📋 Mapeo de permisos disponible:', Array.from(permissionCodeToId.entries()).slice(0, 5), '... total:', permissionCodeToId.size);
        console.log('🔍 Usando mapeo por:', uniqueCodes.size < permissions.length ? 'ID' : 'CODE');

        // Incluir permisos directos
        if (selectedUserForPermissions.direct_permissions?.length) {
            console.log('🟣 Procesando permisos directos:', selectedUserForPermissions.direct_permissions);
            selectedUserForPermissions.direct_permissions.forEach(permissionCode => {
                // Intentar mapear por código primero, luego por ID si hay duplicados
                let permissionId = permissionCodeToId.get(permissionCode);
                if (!permissionId && uniqueCodes.size < permissions.length) {
                    // Si hay duplicados, buscar por ID directo en los permisos
                    const foundPermission = permissions.find(p => p.code === permissionCode || p.id.toString() === permissionCode);
                    permissionId = foundPermission?.id;
                }

                if (permissionId && !currentPermissionIds.includes(permissionId)) {
                    console.log(`✅ Permiso directo "${permissionCode}" -> ID ${permissionId}`);
                    currentPermissionIds.push(permissionId);
                } else {
                    console.log(`❌ No se pudo mapear permiso directo "${permissionCode}"`);
                }
            });
        } else {
            console.log('⚪ Sin permisos directos');
        }

        // IMPORTANTE: También incluir permisos de roles para pre-selección
        if (selectedUserForPermissions.role_permissions?.length) {
            console.log('🟠 Procesando permisos de roles:', selectedUserForPermissions.role_permissions);
            selectedUserForPermissions.role_permissions.forEach(permissionCode => {
                // Intentar mapear por código primero, luego por ID si hay duplicados
                let permissionId = permissionCodeToId.get(permissionCode);
                if (!permissionId && uniqueCodes.size < permissions.length) {
                    // Si hay duplicados, buscar por ID directo en los permisos
                    const foundPermission = permissions.find(p => p.code === permissionCode || p.id.toString() === permissionCode);
                    permissionId = foundPermission?.id;
                }

                if (permissionId && !currentPermissionIds.includes(permissionId)) {
                    console.log(`✅ Permiso de rol "${permissionCode}" -> ID ${permissionId}`);
                    currentPermissionIds.push(permissionId);
                } else {
                    console.log(`❌ No se pudo mapear permiso de rol "${permissionCode}"`);
                }
            });
        } else {
            console.log('⚪ Sin permisos de roles');
        }

        // Si no hay permisos directos ni de roles, usar all_permissions como fallback
        if (currentPermissionIds.length === 0 && selectedUserForPermissions.all_permissions?.length) {
            console.log('🔵 Usando all_permissions como fallback:', selectedUserForPermissions.all_permissions);
            selectedUserForPermissions.all_permissions.forEach(permissionCode => {
                // Intentar mapear por código primero, luego por ID si hay duplicados
                let permissionId = permissionCodeToId.get(permissionCode);
                if (!permissionId && uniqueCodes.size < permissions.length) {
                    // Si hay duplicados, buscar por ID directo en los permisos
                    const foundPermission = permissions.find(p => p.code === permissionCode || p.id.toString() === permissionCode);
                    permissionId = foundPermission?.id;
                }

                if (permissionId && !currentPermissionIds.includes(permissionId)) {
                    console.log(`✅ Permiso (all) "${permissionCode}" -> ID ${permissionId}`);
                    currentPermissionIds.push(permissionId);
                } else {
                    console.log(`❌ No se pudo mapear permiso (all) "${permissionCode}"`);
                }
            });
        }

        console.log('🎯 RESULTADO de pre-selección:', {
            usuario: selectedUserForPermissions.first_name,
            rolesCalculados: currentRoleIds,
            permisosCalculados: currentPermissionIds,
            directPermissions: selectedUserForPermissions.direct_permissions || [],
            rolePermissions: selectedUserForPermissions.role_permissions || [],
            allPermissions: selectedUserForPermissions.all_permissions || [],
            totalPermissionsAvailable: permissions.length,
            totalRolesAvailable: roles.length
        });

        return {
            preselectedRoleIds: currentRoleIds,
            preselectedPermissionIds: currentPermissionIds
        };
    }, [selectedUserForPermissions, roles, permissions]);

    // Sincronizar pre-selección cuando cambien los valores calculados
    useEffect(() => {
        console.log('🔄 Sincronizando pre-selección:', {
            roleIds: preselectedRoleIds,
            permissionIds: preselectedPermissionIds
        });
        setSelectedRoleIds(preselectedRoleIds);
        setSelectedPermissionIds(preselectedPermissionIds);
    }, [preselectedRoleIds, preselectedPermissionIds]);

    // NUEVO: useEffect adicional para cuando se actualize selectedUserForPermissions
    useEffect(() => {
        if (selectedUserForPermissions && permissions.length > 0) {
            console.log('🆕 Usuario actualizado, recalculando permisos:', {
                usuario: selectedUserForPermissions.first_name,
                tieneDirectPermissions: !!selectedUserForPermissions.direct_permissions?.length,
                tieneRolePermissions: !!selectedUserForPermissions.role_permissions?.length,
                permissionsDisponibles: permissions.length
            });

            // Forzar recálculo manual si es necesario
            const permissionCodeToId = new Map(permissions.map(p => [p.code, p.id]));
            const newPermissionIds: number[] = [];

            // Agregar permisos directos
            if (selectedUserForPermissions.direct_permissions?.length) {
                selectedUserForPermissions.direct_permissions.forEach(code => {
                    const id = permissionCodeToId.get(code);
                    if (id && !newPermissionIds.includes(id)) {
                        newPermissionIds.push(id);
                    }
                });
            }

            // Agregar permisos de roles (sin duplicados)
            if (selectedUserForPermissions.role_permissions?.length) {
                selectedUserForPermissions.role_permissions.forEach(code => {
                    const id = permissionCodeToId.get(code);
                    if (id && !newPermissionIds.includes(id)) {
                        newPermissionIds.push(id);
                    }
                });
            }

            console.log('🎯 Permisos calculados manualmente:', newPermissionIds);
            if (newPermissionIds.length > 0) {
                setSelectedPermissionIds(newPermissionIds);
            }
        }
    }, [selectedUserForPermissions, permissions]);

    // Configurar tabla
    const columns = [
        columnHelper.accessor('first_name', {
            header: 'Nombre',
            cell: info => `${info.getValue()} ${info.row.original.last_name}`
        }),
        columnHelper.accessor('email', { header: 'Email', cell: info => info.getValue() }),
        columnHelper.display({
            id: 'cargo',
            header: 'Cargo',
            cell: info => {
                const user = info.row.original;
                // Primero intentar cargo directo, luego de company.pivot, finalmente position
                return user.cargo ||
                    user.companies?.[0]?.pivot?.cargo ||
                    user.position ||
                    '—';
            }
        }),
        columnHelper.display({
            id: 'empresa',
            header: 'Empresa',
            cell: info => {
                const user = info.row.original;
                const parts = [];

                // Información jerárquica desde branch
                if (user.branch?.subsidiary?.company?.company_name) {
                    parts.push(user.branch.subsidiary.company.company_name);

                    if (user.branch.subsidiary.name) {
                        parts.push(`• ${user.branch.subsidiary.name}`);
                    }

                    if (user.branch.name) {
                        parts.push(`• ${user.branch.name}`);
                    }
                }
                // Fallback a companies array
                else if (user.companies?.[0]?.name) {
                    parts.push(user.companies[0].name);
                }
                // Fallback a propiedades legacy
                else if (user.company?.name) {
                    parts.push(user.company.name);

                    if (user.subsidiary?.name) {
                        parts.push(`• ${user.subsidiary.name}`);
                    }

                    if (user.branch?.name) {
                        parts.push(`• ${user.branch.name}`);
                    }
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
                const user = info.row.original;
                const allRoles = [];

                // Agregar roles globales
                if (user.global_roles?.length) {
                    allRoles.push(...user.global_roles.map(role => ({ name: role, type: 'global' })));
                }

                // Agregar roles contextuales
                if (user.contextual_roles?.length) {
                    allRoles.push(...user.contextual_roles.map(contextRole => ({
                        name: contextRole.role,
                        type: 'contextual',
                        context: contextRole.context
                    })));
                }

                // Fallback a roles legacy
                if (allRoles.length === 0 && user.roles?.length) {
                    allRoles.push(...user.roles.map(role => ({ name: role.name, type: 'legacy' })));
                }

                return allRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {allRoles.map((role, index) => (
                            <Badge
                                key={index}
                                color={role.type === 'global' ? 'blue' : role.type === 'contextual' ? 'green' : 'gray'}
                                className="text-xs"
                                title={role.context ? `Contexto: ${role.context}` : undefined}
                            >
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

    // Handlers optimizados con useCallback
    const handleOpenPermissionsModal = useCallback(async (user: UserWithDetails) => {
        setSelectedUserForPermissions(user);
        setIsPermissionsModalOpen(true);

        // Solo cargar detalles adicionales si es necesario
        // Para optimizar, usamos los datos que ya tenemos primero
        console.log('⚡ Abriendo modal rápido para:', user.first_name);

        // Cargar datos completos del usuario en segundo plano
        try {
            const userDetailsResult = await dispatch(fetchUserDetails(user.id));

            if (fetchUserDetails.fulfilled.match(userDetailsResult)) {
                const userWithDetails = userDetailsResult.payload;

                if (userWithDetails) {
                    console.log('✅ Datos completos cargados');
                    setSelectedUserForPermissions(userWithDetails);
                }
            }
        } catch (error) {
            console.log('⚠️ Error cargando detalles:', error);
        }

        // Cargar listas de permisos y roles del usuario si no están cargadas
        await Promise.all([
            dispatch(fetchUserPermissions(user.id)),
            dispatch(fetchUserRoles(user.id))
        ]);
    }, [dispatch]);

    const handleToggleUserStatus = useCallback(async (user: UserWithDetails) => {
        try {
            await dispatch(toggleUserStatus({
                userId: user.id,
                status: !user.is_active
            })).unwrap();
            toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
        } catch (error: any) {
            toast.error(error);
        }
    }, [dispatch]);

    const handleSavePermissions = useCallback(async () => {
        if (!selectedUserForPermissions) return;

        console.log('💾 GUARDANDO CAMBIOS:', {
            usuario: selectedUserForPermissions.name,
            permisosSeleccionados: selectedPermissionIds,
            rolesSeleccionados: selectedRoleIds
        });

        try {
            const currentPermissions = (userPermissions || [])
                .filter(up => up.user_id === selectedUserForPermissions.id)
                .map(up => up.permission_id);

            const currentRoles = (userRoles || [])
                .filter(ur => ur.user_id === selectedUserForPermissions.id)
                .map(ur => ur.role_id);

            // Calcular cambios
            const permissionsToAdd = selectedPermissionIds.filter(id => !currentPermissions.includes(id));
            const permissionsToRemove = currentPermissions.filter(id => !selectedPermissionIds.includes(id));
            const rolesToAdd = selectedRoleIds.filter(id => !currentRoles.includes(id));
            const rolesToRemove = currentRoles.filter(id => !selectedRoleIds.includes(id));

            // Ejecutar cambios en paralelo para mayor velocidad
            const permissionPromises = [
                ...permissionsToAdd.map(id =>
                    dispatch(assignPermissionToUser({
                        userId: selectedUserForPermissions.id,
                        permissionId: id
                    }))
                ),
                ...permissionsToRemove.map(id =>
                    dispatch(revokePermissionFromUser({
                        userId: selectedUserForPermissions.id,
                        permissionId: id
                    }))
                )
            ];

            const rolePromises = [
                ...rolesToAdd.map(id =>
                    dispatch(assignRoleToUser({
                        userId: selectedUserForPermissions.id,
                        roleId: id,
                        companyId: selectedUserForPermissions.company?.id
                    }))
                ),
                ...rolesToRemove.map(id =>
                    dispatch(revokeRoleFromUser({
                        userId: selectedUserForPermissions.id,
                        roleId: id
                    }))
                )
            ];

            // Ejecutar todos los cambios en paralelo
            await Promise.all([...permissionPromises, ...rolePromises]);

            toast.success('Permisos actualizados correctamente');
            setIsPermissionsModalOpen(false);

            // Recargar solo los usuarios (más rápido que recargar todo)
            dispatch(fetchUsers({}));
        } catch (error: any) {
            toast.error(error);
        }
    }, [selectedUserForPermissions, userPermissions, userRoles, selectedPermissionIds, selectedRoleIds, dispatch]);

    // Opciones para selects optimizadas con useMemo
    const permissionOptions = useMemo<TSelectOption[]>(() => {
        const options = (permissions || []).map(p => ({
            value: p.id.toString(),
            label: `${p.name} (${p.code})`
        }));
        console.log('🎯 Opciones de permisos generadas:', options.length, 'opciones');
        return options;
    }, [permissions]);

    const roleOptions = useMemo<TSelectOption[]>(() => {
        const options = (roles || []).map(r => ({
            value: r.id.toString(),
            label: `${r.name}`
        }));
        console.log('🎯 Opciones de roles generadas:', options.length, 'opciones');
        return options;
    }, [roles]);

    // Optimizar el filtro de búsqueda
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setFilters({ search: e.target.value }));
    }, [dispatch]);

    // Handlers optimizados para los selects
    const handleRoleChange = useCallback((selectedOptions: any) => {
        const ids = Array.isArray(selectedOptions)
            ? selectedOptions.map(option => parseInt(option.value))
            : selectedOptions ? [parseInt((selectedOptions as TSelectOption).value)] : [];
        setSelectedRoleIds(ids);
    }, []);

    const handlePermissionChange = useCallback((selectedOptions: any) => {
        const ids = Array.isArray(selectedOptions)
            ? selectedOptions.map(option => parseInt(option.value))
            : selectedOptions ? [parseInt((selectedOptions as TSelectOption).value)] : [];
        setSelectedPermissionIds(ids);
    }, []);

    // Valores calculados optimizados para los selects
    const selectedRoleOptions = useMemo(() =>
        roleOptions.filter(option => selectedRoleIds.includes(parseInt(option.value))),
        [roleOptions, selectedRoleIds]
    );

    const selectedPermissionOptions = useMemo(() =>
        permissionOptions.filter(option => selectedPermissionIds.includes(parseInt(option.value))),
        [permissionOptions, selectedPermissionIds]
    );

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
                        onChange={handleSearchChange}
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
                                        <span className="font-medium">Cargo:</span> {
                                            selectedUserForPermissions?.cargo ||
                                            selectedUserForPermissions?.companies?.[0]?.pivot?.cargo ||
                                            selectedUserForPermissions?.position ||
                                            '—'
                                        }
                                    </div>
                                    <div>
                                        <span className="font-medium">Empresa:</span> {
                                            selectedUserForPermissions?.branch?.subsidiary?.company?.company_name ||
                                            selectedUserForPermissions?.companies?.[0]?.name ||
                                            selectedUserForPermissions?.company?.name ||
                                            '—'
                                        }
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

                        {/* Roles y Permisos Actuales */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Roles y Permisos Actuales</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-4">
                                    {/* Roles Actuales */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Roles Asignados:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUserForPermissions?.global_roles?.length ? (
                                                selectedUserForPermissions.global_roles.map((role, index) => (
                                                    <Badge key={index} color="blue" className="text-xs">
                                                        {role} (Global)
                                                    </Badge>
                                                ))
                                            ) : null}
                                            {selectedUserForPermissions?.contextual_roles?.length ? (
                                                selectedUserForPermissions.contextual_roles.map((contextRole, index) => (
                                                    <Badge key={index} color="amber" className="text-xs">
                                                        {contextRole.role} (Contextual)
                                                    </Badge>
                                                ))
                                            ) : null}
                                            {(!selectedUserForPermissions?.global_roles?.length && !selectedUserForPermissions?.contextual_roles?.length) && (
                                                <span className="text-gray-400 text-sm">Sin roles asignados</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Permisos Actuales */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Permisos Directos:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUserForPermissions?.direct_permissions?.length ? (
                                                selectedUserForPermissions.direct_permissions.map((permissionCode, index) => (
                                                    <Badge key={index} color="violet" className="text-xs">
                                                        {permissionCode}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin permisos directos asignados</span>
                                            )}
                                        </div>

                                        {/* Permisos desde Roles */}
                                        <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">Permisos desde Roles:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUserForPermissions?.role_permissions?.length ? (
                                                selectedUserForPermissions.role_permissions.map((permissionCode, index) => (
                                                    <Badge key={index} color="emerald" className="text-xs">
                                                        {permissionCode}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin permisos desde roles</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Gestión de Roles */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Gestión de Roles</h3>
                                <p className="text-sm text-gray-600">Agrega o quita roles para este usuario</p>
                            </CardHeader>
                            <CardBody>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Roles
                                    </label>
                                    <SelectReact
                                        key={`roles-${selectedUserForPermissions?.id || 'none'}`}
                                        name="user-roles"
                                        options={roleOptions}
                                        value={selectedRoleOptions}
                                        onChange={handleRoleChange}
                                        placeholder="Seleccionar roles..."
                                        isMulti
                                        isSearchable
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Gestión de Permisos Adicionales */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-medium">Permisos Adicionales</h3>
                                <p className="text-sm text-gray-600">Asigna permisos específicos adicionales a los roles</p>
                            </CardHeader>
                            <CardBody>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seleccionar Permisos
                                    </label>
                                    <SelectReact
                                        key={`permissions-${selectedUserForPermissions?.id || 'none'}`}
                                        name="user-permissions"
                                        options={permissionOptions}
                                        value={selectedPermissionOptions}
                                        onChange={handlePermissionChange}
                                        placeholder="Seleccionar permisos..."
                                        isMulti
                                        isSearchable
                                    />
                                </div>
                            </CardBody>
                        </Card>
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
