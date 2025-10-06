import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    fetchUsuariosConRolesPerms,
    updateUsuarioRolesPerms,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';
import {
    toggleUserStatus,
    type UserWithDetails,
} from '@/store/slices/usersAdmin/usersAdminSlice';
import {
    fetchPermissions,
    fetchRoles,
    assignPermissionToUser,
    revokePermissionFromUser,
    assignRoleToUser,
    revokeRoleFromUser,
} from '@/store/slices/permissions/permissionsSlice';
import { toast } from 'react-toastify';

export const usePermissionsManagement = () => {
    const dispatch = useAppDispatch();

    const rolesPermisosState = useAppSelector((s) => s.rolesPermisos);
    const permissionsState = useAppSelector((s) => s.permissions);

    const { data: rawUsers, status: usersLoading } = rolesPermisosState;
    const { permissions, roles, loading: permissionsLoading } = permissionsState;

    // Los datos ya vienen en el formato correcto del backend PHP
    const users = useMemo(() => {
        if (!rawUsers || !Array.isArray(rawUsers)) return [];

        console.log('🔍 Raw users from backend:', rawUsers[0]); // Log del primer usuario

        // Los datos del backend PHP ya vienen en el formato correcto, no necesitan transformación
        return rawUsers.map((user: any) => {
            console.log('🔍 Usuario completo del backend PHP:', JSON.stringify(user, null, 2));
            console.log('🔍 Todas las propiedades del usuario:', Object.keys(user));
            console.log('🔍 Global roles:', user.global_roles);
            console.log('🔍 Direct permissions:', user.direct_permissions);
            console.log('🔍 Contextual roles:', user.contextual_roles);

            // Retornar los datos tal como vienen del backend
            return user;
        });
    }, [rawUsers]);

    // Crear un objeto filters para compatibilidad
    const filters = useMemo(() => ({ search: '' }), []);

    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserWithDetails | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [toggleUserLoading, setToggleUserLoading] = useState<Set<number>>(new Set());

    const permissionNameToId = useMemo(
        () => new Map((permissions || []).map((p) => [p.name || p.code, p.id])),
        [permissions]
    );

    const roleNameToId = useMemo(
        () => new Map((roles || []).map((r) => [r.name, r.id])),
        [roles]
    );

    const loadInitialData = useCallback(() => {
        dispatch(fetchUsuariosConRolesPerms());
        dispatch(fetchPermissions());
        dispatch(fetchRoles());
    }, [dispatch]);

    const openPermissionsModal = useCallback(
        async (user: UserWithDetails) => {
            console.log('🔍 Usuario seleccionado para modal:', user);
            console.log('🔍 Roles del usuario:', user.global_roles);
            console.log('🔍 Permisos directos:', user.direct_permissions);
            console.log('🔍 Roles contextuales:', user.contextual_roles);
            setSelectedUserForPermissions(user);
            // Ya tenemos toda la información necesaria del usuario
            // No necesitamos hacer una petición adicional
        },
        []
    );

    const toggleUser = useCallback(
        async (user: UserWithDetails) => {
            if (!user || !user.id || typeof user.id !== 'number') {
                toast.error('Usuario inválido: ID no encontrado');
                return;
            }

            setToggleUserLoading(prev => new Set(prev).add(user.id));

            try {
                const newStatus = !user.is_active;
                const statusText = newStatus ? 'activado' : 'desactivado';

                const loadingToast = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} usuario...`);

                const result = await dispatch(
                    toggleUserStatus({
                        userId: user.id,
                        status: newStatus,
                    })
                ).unwrap();

                if (!result || !result.userId || typeof result.is_active !== 'boolean') {
                    throw new Error('Respuesta del servidor inválida');
                }

                toast.update(loadingToast, {
                    render: `Usuario ${statusText} correctamente`,
                    type: 'success',
                    isLoading: false,
                    autoClose: 3000,
                });

            } catch (error: any) {
                console.error('Error en toggleUser:', error);

                let errorMessage = 'Error desconocido';
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error?.message) {
                    errorMessage = error.message;
                } else if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }

                toast.error(`Error al cambiar estado del usuario: ${errorMessage}`);
            } finally {
                setToggleUserLoading(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(user.id);
                    return newSet;
                });
            }
        },
        [dispatch]
    );

    const savePermissions = useCallback(async () => {
        if (!selectedUserForPermissions) return;

        try {
            const currentDirectPermIds =
                (selectedUserForPermissions.direct_permissions || [])
                    .map((name) => permissionNameToId.get(name))
                    .filter((x): x is number => typeof x === 'number');

            const currentRoleIdsFromNames =
                [
                    ...(selectedUserForPermissions.global_roles || []),
                    ...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
                ]
                    .map((name) => roleNameToId.get(name))
                    .filter((x): x is number => typeof x === 'number');

            const currentRoleIds = Array.from(new Set(currentRoleIdsFromNames));

            const toAddPerms = selectedPermissionIds.filter((id) => !currentDirectPermIds.includes(id));
            const toRemovePerms = currentDirectPermIds.filter((id) => !selectedPermissionIds.includes(id));
            const toAddRoles = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
            const toRemoveRoles = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

            const permissionPromises = [
                ...toAddPerms.map((id) =>
                    dispatch(
                        assignPermissionToUser({
                            userId: selectedUserForPermissions.id,
                            permissionId: id,
                        })
                    )
                ),
                ...toRemovePerms.map((id) =>
                    dispatch(
                        revokePermissionFromUser({
                            userId: selectedUserForPermissions.id,
                            permissionId: id,
                        })
                    )
                ),
            ];

            const rolePromises = [
                ...toAddRoles.map((id) =>
                    dispatch(
                        assignRoleToUser({
                            userId: selectedUserForPermissions.id,
                            roleId: id,
                            companyId: selectedUserForPermissions.company?.id,
                        })
                    )
                ),
                ...toRemoveRoles.map((id) =>
                    dispatch(
                        revokeRoleFromUser({
                            userId: selectedUserForPermissions.id,
                            roleId: id,
                        })
                    )
                ),
            ];

            await Promise.all([...permissionPromises, ...rolePromises]);

            await Promise.all([
                dispatch(fetchUsuariosConRolesPerms()),
                dispatch(fetchRoles()),
                dispatch(fetchPermissions())
            ]);

            // Recargar la lista completa de usuarios para obtener datos actualizados
            dispatch(fetchUsuariosConRolesPerms());

            toast.success('Permisos actualizados correctamente');
        } catch (error: any) {
            toast.error(error);
        }
    }, [
        selectedUserForPermissions,
        selectedPermissionIds,
        selectedRoleIds,
        permissionNameToId,
        roleNameToId,
        dispatch,
    ]);

    const closePermissionsModal = useCallback(() => {
        setSelectedUserForPermissions(null);
        setSelectedPermissionIds([]);
        setSelectedRoleIds([]);

        dispatch(fetchUsuariosConRolesPerms());
    }, [dispatch]);

    return {
        users,
        permissions,
        roles,
        usersLoading,
        permissionsLoading,
        filters,
        selectedUserForPermissions,
        selectedPermissionIds,
        selectedRoleIds,
        toggleUserLoading,

        permissionNameToId,
        roleNameToId,

        loadInitialData,
        openPermissionsModal,
        closePermissionsModal,
        toggleUser,
        savePermissions,

        setSelectedUserForPermissions,
        setSelectedPermissionIds,
        setSelectedRoleIds,
    };
};
