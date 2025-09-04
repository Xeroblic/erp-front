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

    const { users, loading: usersLoading, filters } = useAppSelector((s) => s.usersAdmin);
    const { permissions, roles, loading: permissionsLoading } = useAppSelector((s) => s.permissions);

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
        dispatch(fetchUsers({}));
        dispatch(fetchPermissions());
        dispatch(fetchRoles());
    }, [dispatch]);

    const openPermissionsModal = useCallback(
        async (user: UserWithDetails) => {
            setSelectedUserForPermissions(user);

            try {
                const res = await dispatch(fetchUserDetails(user.id));
                if (fetchUserDetails.fulfilled.match(res) && res.payload) {
                    setSelectedUserForPermissions(res.payload as UserWithDetails);
                }
            } catch {
                toast.error('Error al cargar detalles del usuario');
            }
        },
        [dispatch]
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

    const closePermissionsModal = useCallback(() => {
        setSelectedUserForPermissions(null);
        setSelectedPermissionIds([]);
        setSelectedRoleIds([]);

        dispatch(fetchUsers({}));
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
