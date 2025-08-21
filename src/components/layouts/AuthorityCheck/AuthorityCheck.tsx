import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthority from '@/hooks/useAuthority'
import { useAppSelector } from '@/store'

type AuthorityGuardProps = PropsWithChildren<{
    userAuthority?: string[]
    authority?: string[]
}>

const AuthorityCheck = (props: AuthorityGuardProps) => {
    const { userAuthority = [], authority = [], children } = props
    const user = useAppSelector((s) => s.auth.user);
    const roleMatched = useAuthority(userAuthority, authority, true)

    // Si `authority` es vacío o `undefined`, la vista es sin protección
    if (!authority || authority.length === 0) {
        return <>{children}</>
    }

    // Si es super admin, acceso completo
    if (user?.authority?.includes('super-admin') || userAuthority?.includes('super-admin')) {
        return <>{children}</>
    }

    return <>{roleMatched ? children : <Navigate to="/sin-permisos" />}</>
}

export default AuthorityCheck
