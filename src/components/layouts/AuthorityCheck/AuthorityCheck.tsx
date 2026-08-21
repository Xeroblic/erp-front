import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthorization from '@/hooks/useAuthorization';
import { useAppSelector } from '@/store';

const EMPTY_AUTHORITY: string[] = [];

type AuthorityGuardProps = PropsWithChildren<{
	userAuthority?: string[];
	authority?: string[];
}>;

const AuthorityCheck = (props: AuthorityGuardProps) => {
	const { userAuthority, authority, children } = props;
	const user = useAppSelector((s) => s.auth.user);
	const { isSuperAdmin, authorize } = useAuthorization();
	const safeUserAuthority = userAuthority ?? EMPTY_AUTHORITY;
	const safeAuthority = authority ?? EMPTY_AUTHORITY;
	const roleMatched = authorize({ permissions: safeAuthority, requireAll: true });

	// Si `authority` es vacío o `undefined`, la vista es sin protección
	if (safeAuthority.length === 0) {
		return <>{children}</>;
	}

	// Si es super admin, acceso completo
	if (
		isSuperAdmin ||
		user?.authority?.includes('super-admin') ||
		safeUserAuthority.includes('super-admin')
	) {
		return <>{children}</>;
	}

	return <>{roleMatched ? children : <Navigate to='/sin-permisos' />}</>;
};

export default AuthorityCheck;
