import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store';
import {
	buildPermissionLabelMap,
	buildRoleLabelMap,
	formatPermissionName,
	formatRoleName,
	normalizePermissionKey,
	normalizeRoleKey,
} from '@/pages/admin/Permission/utils/formatters';

/**
 * Resuelve el texto visible de roles y permisos a partir de su slug.
 *
 * Muchas vistas solo reciben el nombre suelto (`user.all_permissions`,
 * `user.global_roles`, …) y no el objeto del catálogo, así que necesitan un
 * lookup contra `state.permissions` para llegar al `display_name` del backend.
 * Si el catálogo todavía no cargó, cae al formateo local para no mostrar el
 * slug crudo.
 */
export const usePermissionLabels = () => {
	const permissions = useAppSelector((s) => s.permissions.permissions);
	const roles = useAppSelector((s) => s.permissions.roles);

	const permissionLabelMap = useMemo(() => buildPermissionLabelMap(permissions), [permissions]);
	const roleLabelMap = useMemo(() => buildRoleLabelMap(roles), [roles]);

	const getPermissionLabel = useCallback(
		(permissionName: string) =>
			permissionLabelMap.get(normalizePermissionKey(permissionName)) ??
			formatPermissionName(permissionName),
		[permissionLabelMap],
	);

	const getRoleLabel = useCallback(
		(roleName: string) =>
			roleLabelMap.get(normalizeRoleKey(roleName)) ?? formatRoleName(roleName),
		[roleLabelMap],
	);

	return { getPermissionLabel, getRoleLabel };
};

export default usePermissionLabels;
