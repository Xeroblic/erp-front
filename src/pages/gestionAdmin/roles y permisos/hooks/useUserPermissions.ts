import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import type { TSelectOption } from '@/components/form/SelectReact';
import { formatPermissionName, formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export const useUserPermissions = (selectedUser: UserWithDetails | undefined) => {
    const { roles: availableRoles, permissions: availablePermissions } = useAppSelector(
        (s) => s.permissions,
    );

    const roleOptions = useMemo<TSelectOption[]>(() => {
        return availableRoles.map((role) => ({
            value: role.name,
            label: formatRoleName(role.name),
        }));
    }, [availableRoles]);

    const availableRoleNames = useMemo(() => new Set(availableRoles.map((role) => role.name)), [availableRoles]);

    const permissionOptions = useMemo<TSelectOption[]>(() => {
        return availablePermissions.map((permission) => ({
            value: permission.name,
            label: formatPermissionName(permission.name),
        }));
    }, [availablePermissions]);

    const extractUserRoles = (user: UserWithDetails | undefined) => {
        if (!user) return [];

        const directRoles = [
            ...(user.global_roles ?? []),
            ...(user.roles?.map((legacy) => legacy.name) ?? []),
        ].filter((role): role is string => typeof role === 'string' && availableRoleNames.has(role));

        return Array.from(new Set(directRoles));
    };

    const currentRoles = useMemo(
        () => extractUserRoles(selectedUser),
        // Depend on availableRoleNames to refresh when catalog updates
        [selectedUser, availableRoleNames],
    );
    const currentPermissions = useMemo(() => selectedUser?.direct_permissions ?? [], [selectedUser]);

    return {
        roleOptions,
        permissionOptions,
        currentRoles,
        currentPermissions,
        availableRoles,
        availablePermissions,
    };
};
