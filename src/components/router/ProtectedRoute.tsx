// src/components/router/ProtectedRoute.tsx
import React, { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import useAuthority from '@/hooks/useAuthority';
import { hasTemporaryPermission } from '@/constants/temp-permissions.constant';

export interface ProtectedRouteProps extends PropsWithChildren {
	/** Permisos requeridos para acceder a la ruta */
	permissions?: string[];
	/** Permiso único requerido */
	permission?: string;
	/** Roles requeridos para acceder */
	roles?: string[];
	/** Si requiere todos los permisos/roles especificados */
	requireAll?: boolean;
	/** Ruta a la que redirigir si no tiene acceso (default: '/dashboard') */
	redirectTo?: string;
}

/**
 * Componente para proteger rutas basado en permisos.
 * Si el usuario no tiene acceso, lo redirige automáticamente.
 *
 * @example
 * <Route
 *   path="/comercial/ventas"
 *   element={
 *     <ProtectedRoute permission="view-sale">
 *       <SalesListPage />
 *     </ProtectedRoute>
 *   }
 * />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	permissions = [],
	permission,
	roles = [],
	requireAll = false,
	redirectTo = '/dashboard',
}) => {
	const location = useLocation();
	const user = useAppSelector((state) => state.auth.user);
	const userAuthority = useAppSelector((state) => state.auth.permisos);
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const authLoading = useAppSelector((state) => state.auth.loading);

	// Combinar permission singular con array permissions
	const allPermissions = permission ? [permission, ...permissions] : permissions;
	const requiredAuthorities = [...allPermissions, ...roles];

	// Verificar acceso
	const hasAccess = useAuthority(userAuthority, requiredAuthorities, requireAll);

	// Mientras carga la autenticación, no mostrar nada
	if (authLoading) {
		return null;
	}

	// Si no está autenticado, redirigir al login
	if (!isAuthenticated) {
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	// Si no hay requisitos, permitir acceso
	if (requiredAuthorities.length === 0) {
		return <>{children}</>;
	}

	// Super-admin tiene acceso a todo
	if (user?.authority?.includes('super-admin') || userAuthority?.includes('super-admin')) {
		return <>{children}</>;
	}

	// Verificar permisos temporales de desarrollo
	const hasTemporaryAccess = allPermissions.some((perm) => hasTemporaryPermission(perm));
	if (hasTemporaryAccess) {
		return <>{children}</>;
	}

	// Si tiene acceso, mostrar el contenido
	if (hasAccess) {
		return <>{children}</>;
	}

	// Sin acceso, redirigir
	return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default ProtectedRoute;
