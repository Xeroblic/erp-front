import React, { PropsWithChildren } from 'react';
import { useAppSelector } from '@/store';
import useAuthority from '@/hooks/useAuthority';
import { hasTemporaryPermission } from '@/constants/temp-permissions.constant';

interface PermissionGuardProps extends PropsWithChildren {
	/** Permisos requeridos (modo OR - al menos uno debe coincidir) */
	permissions?: string[];
	/** Roles requeridos (modo OR - al menos uno debe coincidir) */
	roles?: string[];
	/** Modo AND - todos los permisos/roles deben coincidir */
	requireAll?: boolean;
	/** ID de empresa específica (opcional) */
	companyId?: number;
	/** ID de subsidiaria específica (opcional) */
	subsidiaryId?: number;
	/** ID de sucursal específica (opcional) */
	branchId?: number;
	/** Componente a mostrar si no tiene permisos */
	fallback?: React.ReactNode;
	/** Mensaje personalizado de acceso denegado */
	deniedMessage?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
	children,
	permissions = [],
	roles = [],
	requireAll = false,
	companyId,
	subsidiaryId,
	branchId,
	fallback,
}) => {
	const user = useAppSelector((state) => state.auth.user);
	const userAuthority = useAppSelector((state) => state.auth.permisos);
	const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
	const authLoading = useAppSelector((state) => state.auth.loading);

	// Construir array de verificación combinando roles y permisos
	const requiredAuthorities = [...permissions, ...roles];

	// IMPORTANTE: Todos los hooks deben ejecutarse antes de cualquier return condicional
	const hasAccess = useAuthority(userAuthority, requiredAuthorities, requireAll);

	// Si no hay usuario autenticado, denegar acceso
	if (!user && !authLoading) {
		return fallback ? <>{fallback}</> : null;
	}

	// Si está cargando la autenticación, mostrar contenido (evitar bloqueos innecesarios)
	if (authLoading || !isAuthenticated) {
		return <>{children}</>;
	}

	// Si no hay requisitos, permitir acceso
	if (requiredAuthorities.length === 0) {
		return <>{children}</>;
	}

	// Primero verificar si es super-admin (tiene acceso total)
	if (user?.authority?.includes('super-admin') || userAuthority?.includes('super-admin')) {
		return <>{children}</>;
	}

	// Verificación temporal para permisos de desarrollo
	const hasTemporaryAccess = permissions.some((permission) => hasTemporaryPermission(permission));
	if (hasTemporaryAccess) {
		return <>{children}</>;
	}

	// Verificación adicional por contexto de empresa/subsidiaria/sucursal
	if (hasAccess && (companyId || subsidiaryId || branchId)) {
		// Verificar si el usuario tiene acceso al contexto específico
		const hasContextAccess = checkContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) {
			return fallback ? (
				<>{fallback}</>
			) : (
				// <div className='rounded-lg bg-red-50 p-4 text-center text-red-600'>
				// 	{deniedMessage}
				// </div>
				<></>
			);
		}
	}

	if (hasAccess) {
		return <>{children}</>;
	}

	return fallback ? (
		<>{fallback}</>
	) : (
		<></>
		// <div className='rounded-lg bg-red-50 p-4 text-center text-red-600'>{deniedMessage}</div>
	);
};

// Función auxiliar para verificar acceso contextual
function checkContextualAccess(
	user: any,
	companyId?: number,
	subsidiaryId?: number,
	branchId?: number,
): boolean {
	// Si es super admin, acceso completo
	if (user.authority?.includes('super-admin')) {
		return true;
	}

	// Verificar acceso por empresa
	if (companyId && user.company?.id !== companyId) {
		// Verificar si el usuario tiene acceso a múltiples empresas
		// (esto requeriría información adicional del backend)
		return false;
	}

	// Verificar acceso por subsidiaria
	if (subsidiaryId && user.subsidiary?.id !== subsidiaryId) {
		return false;
	}

	// Verificar acceso por sucursal
	if (branchId && user.branch?.id !== branchId) {
		return false;
	}

	return true;
}

export default PermissionGuard;
