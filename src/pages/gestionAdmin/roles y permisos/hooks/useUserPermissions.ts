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

    const permissionOptions = useMemo<TSelectOption[]>(() => {
        return availablePermissions.map((permission) => ({
            value: permission.name,
            label: formatPermissionName(permission.name),
        }));
    }, [availablePermissions]);

    const extractUserRoles = (user: UserWithDetails | undefined) => {
        if (!user) return [];
        return Array.from(
            new Set([
                ...(user.global_roles ?? []),
                ...(user.contextual_roles?.map((cr: any) => cr.role) ?? []),
            ]),
        );
    };

    const currentRoles = useMemo(() => extractUserRoles(selectedUser), [selectedUser]);
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
