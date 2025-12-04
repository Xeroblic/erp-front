import { useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import { normalizePermissions } from '@/utils/permissionNormalize';

function useAuthority(
	userAuthority: string[] = [],
	authority: string[] = [],
	requireAll = false,
	emptyCheck = true,
) {
	const roleMatched = useMemo(() => {
		const normalizedUser = normalizePermissions(userAuthority);
		const normalizedRequired = normalizePermissions(authority);
		// Si es super admin, acceso completo
		if (normalizedUser.includes('super-admin')) {
			return true;
		}

		if (requireAll) {
			// Modo AND - todos los permisos deben estar presentes
			return normalizedRequired.every((role) => normalizedUser.includes(role));
		}
		// Modo OR - al menos uno debe coincidir
		return normalizedRequired.some((role) => normalizedUser.includes(role));
	}, [authority, userAuthority, requireAll]);

	if (isEmpty(authority) || isEmpty(userAuthority) || typeof authority === 'undefined') {
		return !emptyCheck;
	}

	return roleMatched;
}

export default useAuthority;
