import { useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'

function useAuthority(
    userAuthority: string[] = [],
    authority: string[] = [],
    requireAll = false,
    emptyCheck = true
) {
    const roleMatched = useMemo(() => {
        // Si es super admin, acceso completo
        if (userAuthority.includes('super-admin')) {
            return true;
        }

        if (requireAll) {
            // Modo AND - todos los permisos deben estar presentes
            return authority.every((role) => userAuthority.includes(role));
        } else {
            // Modo OR - al menos uno debe coincidir
            return authority.some((role) => userAuthority.includes(role));
        }
    }, [authority, userAuthority, requireAll])

    if (
        isEmpty(authority) ||
        isEmpty(userAuthority) ||
        typeof authority === 'undefined'
    ) {
        return !emptyCheck
    }

    return roleMatched
}

export default useAuthority
