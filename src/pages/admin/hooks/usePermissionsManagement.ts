import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    fetchUsers,
    fetchUserDetails,
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

    // Store state
    const { users, loading: usersLoading, filters } = useAppSelector((s) => s.usersAdmin);
    const { permissions, roles, loading: permissionsLoading } = useAppSelector((s) => s.permissions);

    // Local state
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserWithDetails | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [toggleUserLoading, setToggleUserLoading] = useState<Set<number>>(new Set());

    // Mappings
    const permissionNameToId = useMemo(
        () => new Map((permissions || []).map((p) => [p.name || p.code, p.id])),
        [permissions]
    );

    const roleNameToId = useMemo(
        () => new Map((roles || []).map((r) => [r.name, r.id])),
        [roles]
    );

    // Load initial data
    const loadInitialData = useCallback(() => {
        dispatch(fetchUsers({}));
        dispatch(fetchPermissions());
        dispatch(fetchRoles());
    }, [dispatch]);

    // Open permissions modal
    const openPermissionsModal = useCallback(
        async (user: UserWithDetails) => {
            setSelectedUserForPermissions(user);

            try {
                const res = await dispatch(fetchUserDetails(user.id));
                if (fetchUserDetails.fulfilled.match(res) && res.payload) {
                    setSelectedUserForPermissions(res.payload as UserWithDetails);
                }
            } catch {
                // Handle error silently
            }
        },
        [dispatch]
    );

    // Toggle user status
    const toggleUser = useCallback(
        async (user: UserWithDetails) => {
            // Validar que el usuario tenga un ID válido
            if (!user || !user.id || typeof user.id !== 'number') {
                toast.error('Usuario inválido: ID no encontrado');
                return;
            }

            // Añadir el usuario al set de loading
            setToggleUserLoading(prev => new Set(prev).add(user.id));

            try {
                const newStatus = !user.is_active;
                const statusText = newStatus ? 'activado' : 'desactivado';

                // Mostrar toast de carga inmediatamente
                const loadingToast = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} usuario...`);

                const result = await dispatch(
                    toggleUserStatus({
                        userId: user.id,
                        status: newStatus,
                    })
                ).unwrap();

                // Validar que el resultado tenga la estructura esperada
                if (!result || !result.userId || typeof result.is_active !== 'boolean') {
                    throw new Error('Respuesta del servidor inválida');
                }

                // Actualizar toast de éxito
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
                // Remover el usuario del set de loading
                setToggleUserLoading(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(user.id);
                    return newSet;
                });
            }
        },
        [dispatch]
    );

    // Save permissions and roles
    const savePermissions = useCallback(async () => {
        if (!selectedUserForPermissions) return;

        try {
            // Current direct permissions (name → id)
            const currentDirectPermIds =
                (selectedUserForPermissions.direct_permissions || [])
                    .map((name) => permissionNameToId.get(name))
                    .filter((x): x is number => typeof x === 'number');

            // Current roles by names (global/contextual)
            const currentRoleIdsFromNames =
                [
                    ...(selectedUserForPermissions.global_roles || []),
                    ...(selectedUserForPermissions.contextual_roles?.map((cr) => cr.role) || []),
                ]
                    .map((name) => roleNameToId.get(name))
                    .filter((x): x is number => typeof x === 'number');

            const currentRoleIds = Array.from(new Set(currentRoleIdsFromNames));

            // Calculate diffs
            const toAddPerms = selectedPermissionIds.filter((id) => !currentDirectPermIds.includes(id));
            const toRemovePerms = currentDirectPermIds.filter((id) => !selectedPermissionIds.includes(id));
            const toAddRoles = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
            const toRemoveRoles = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

            // Permission promises
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

            // Role promises
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
                dispatch(fetchUsers({})),
                dispatch(fetchRoles()),
                dispatch(fetchPermissions())
            ]);

            if (selectedUserForPermissions?.id) {
                const updatedUserRes = await dispatch(fetchUserDetails(selectedUserForPermissions.id));
                if (fetchUserDetails.fulfilled.match(updatedUserRes) && updatedUserRes.payload) {
                    setSelectedUserForPermissions(updatedUserRes.payload as UserWithDetails);
                }
            }

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

    // Close permissions modal and refresh data
    const closePermissionsModal = useCallback(() => {
        setSelectedUserForPermissions(null);
        setSelectedPermissionIds([]);
        setSelectedRoleIds([]);

        // Refrescar datos cuando se cierre el modal para asegurar consistencia
        dispatch(fetchUsers({}));
    }, [dispatch]);

    return {
        // State
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

        // Mappings
        permissionNameToId,
        roleNameToId,

        // Actions
        loadInitialData,
        openPermissionsModal,
        closePermissionsModal,
        toggleUser,
        savePermissions,

        // Setters
        setSelectedUserForPermissions,
        setSelectedPermissionIds,
        setSelectedRoleIds,
    };
};
