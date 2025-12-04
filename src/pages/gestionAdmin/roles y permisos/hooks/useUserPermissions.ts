import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import type { TSelectOption } from '@/components/form/SelectReact';
import {
	formatPermissionName,
	formatRoleName,
	normalizeRoleKey,
} from '@/pages/admin/Permission/utils/formatters';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export const useUserPermissions = (selectedUser: UserWithDetails | undefined) => {
	const { roles: availableRoles, permissions: availablePermissions } = useAppSelector(
		(s) => s.permissions,
	);

	const availableRoleMap = useMemo(() => {
		const map = new Map<string, string>();
		availableRoles.forEach((role) => {
			const candidates = [role.name, role.display_name, formatRoleName(role.name)];
			candidates
				.map((candidate) => normalizeRoleKey(candidate))
				.filter(Boolean)
				.forEach((key) => {
					if (!map.has(key)) {
						map.set(key, role.name);
					}
				});
		});
		return map;
	}, [availableRoles]);

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

		const rawRoles = [
			...(user.global_roles ?? []),
			...(user.contextual_roles?.map((role) => role.role) ?? []),
			...(user.roles?.map((legacy) => legacy.name) ?? []),
		].filter((role): role is string => typeof role === 'string' && role.trim().length > 0);

		const resolvedRoles = rawRoles
			.map((role) => {
				const normalized = normalizeRoleKey(role);
				if (!normalized) return null;
				return availableRoleMap.get(normalized) ?? null;
			})
			.filter((role): role is string => Boolean(role));

		return Array.from(new Set(resolvedRoles));
	};

	const currentRoles = useMemo(
		() => extractUserRoles(selectedUser),
		// Depend on availableRoleNames to refresh when catalog updates
		[selectedUser, availableRoleMap],
	);
	const currentPermissions = useMemo(
		() => selectedUser?.direct_permissions ?? [],
		[selectedUser],
	);

	return {
		roleOptions,
		permissionOptions,
		currentRoles,
		currentPermissions,
		availableRoles,
		availablePermissions,
	};
};
