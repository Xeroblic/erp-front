import { useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import { normalizePermissions } from '@/utils/permissionNormalize';
import useAuthorization from '@/hooks/useAuthorization';

function useAuthority(
	userAuthority: string[] = [],
	authority: string[] = [],
	requireAll = false,
	emptyCheck = true,
) {
	const { isSuperAdmin, authorize } = useAuthorization();

	const roleMatched = useMemo(() => {
		const normalizedUser = normalizePermissions(userAuthority);
		const normalizedRequired = normalizePermissions(authority);
		// Si es super admin, acceso completo
		if (isSuperAdmin || normalizedUser.includes('super-admin')) {
			return true;
		}

		const authorizationResult = authorize({
			permissions: normalizedRequired,
			requireAll,
		});
		if (authorizationResult) return true;

		if (requireAll) {
			// Modo AND - todos los permisos deben estar presentes
			return normalizedRequired.every((role) => normalizedUser.includes(role));
		}
		// Modo OR - al menos uno debe coincidir
		return normalizedRequired.some((role) => normalizedUser.includes(role));
	}, [authority, authorize, isSuperAdmin, requireAll, userAuthority]);

	if (isEmpty(authority) || isEmpty(userAuthority) || typeof authority === 'undefined') {
		return !emptyCheck;
	}

	return roleMatched;
}

export default useAuthority;
