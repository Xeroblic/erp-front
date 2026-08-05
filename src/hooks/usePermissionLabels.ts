import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPermissions, fetchRoles } from '@/store/slices/permissions/permissionsSlice';
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
 *
 * El hook carga el catálogo por su cuenta: si dependiera de que cada página
 * recuerde despachar `fetchRoles`/`fetchPermissions`, bastaría una que no lo
 * haga para volver a mostrar el slug traducido a mano (fue justo el caso de
 * `/gestion/roles-permisos`, que solo pedía los usuarios). Los thunks van con
 * `dedupe` en `ApiService`, así que varios consumidores montados a la vez no
 * multiplican la petición.
 */
export const usePermissionLabels = () => {
	const dispatch = useAppDispatch();
	const permissions = useAppSelector((s) => s.permissions.permissions);
	const roles = useAppSelector((s) => s.permissions.roles);
	const loading = useAppSelector((s) => s.permissions.loading);

	// Marca de intento por montaje: `loading.roles`/`loading.permissions` vuelven
	// a `false` tanto si el fetch tuvo éxito (con lista vacía) como si falló, así
	// que basarse en ellos para decidir si reintentar reabre el ciclo en ambos
	// casos. El ref corta el reintento sin depender de `state.error` (que es
	// compartido por otros thunks del slice y no refleja si este catálogo ya se
	// pidió).
	const triedRoles = useRef(false);
	const triedPermissions = useRef(false);

	useEffect(() => {
		if (!roles.length && !loading.roles && !triedRoles.current) {
			triedRoles.current = true;
			void dispatch(fetchRoles());
		}
		if (!permissions.length && !loading.permissions && !triedPermissions.current) {
			triedPermissions.current = true;
			void dispatch(fetchPermissions());
		}
	}, [dispatch, roles.length, permissions.length, loading.roles, loading.permissions]);

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
