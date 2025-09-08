import React, { PropsWithChildren } from 'react';
import { useAppSelector } from '@/store';
import useAuthority from '@/hooks/useAuthority';

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
	deniedMessage = 'No tienes permisos para acceder a esta sección',
}) => {
	const user = useAppSelector((state) => state.auth.user);
	const userAuthority = useAppSelector((state) => state.auth.permisos);

	// Si no hay usuario autenticado, denegar acceso
	if (!user) {
		return fallback ? <>{fallback}</> : null;
	}

	// Construir array de verificación combinando roles y permisos
	const requiredAuthorities = [...permissions, ...roles];

	// Si no hay requisitos, permitir acceso
	if (requiredAuthorities.length === 0) {
		return <>{children}</>;
	}

	// Primero verificar si es super-admin (tiene acceso total)
	if (user.authority?.includes('super-admin') || userAuthority?.includes('super-admin')) {
		return <>{children}</>;
	}

	// Verificar permisos usando el hook existente
	const hasAccess = useAuthority(userAuthority, requiredAuthorities, requireAll);

	// Verificación adicional por contexto de empresa/subsidiaria/sucursal
	if (hasAccess && (companyId || subsidiaryId || branchId)) {
		// Verificar si el usuario tiene acceso al contexto específico
		const hasContextAccess = checkContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) {
			return fallback ? (
				<>{fallback}</>
			) : (
				<div className='rounded-lg bg-red-50 p-4 text-center text-red-600'>
					{deniedMessage}
				</div>
			);
		}
	}

	if (hasAccess) {
		return <>{children}</>;
	}

	return fallback ? (
		<>{fallback}</>
	) : (
		<div className='rounded-lg bg-red-50 p-4 text-center text-red-600'>{deniedMessage}</div>
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
