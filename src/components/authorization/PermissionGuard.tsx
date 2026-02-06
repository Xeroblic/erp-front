// src/components/authorization/PermissionGuard.tsx
import React, { PropsWithChildren } from 'react';
import useCan from '@/hooks/useCan';

export interface PermissionGuardProps extends PropsWithChildren {
	/** Permiso único o array de permisos requeridos */
	permission?: string | string[];
	/** Rol único o array de roles requeridos */
	role?: string | string[];
	/** Si true, requiere TODOS los permisos/roles. Si false (default), requiere al menos uno */
	requireAll?: boolean;
	/** Componente alternativo a mostrar si no tiene permisos */
	fallback?: React.ReactNode;
}

/**
 * Wrapper declarativo para control de permisos.
 * Si el usuario no tiene los permisos/roles requeridos, retorna null (o fallback).
 * Super-admin SIEMPRE tiene acceso.
 *
 * @example
 * // Permiso único
 * <PermissionGuard permission="edit-sale">
 *   <Button>Editar</Button>
 * </PermissionGuard>
 *
 * @example
 * // Múltiples permisos (OR por defecto)
 * <PermissionGuard permission={['edit-sale', 'manage-sales']}>
 *   <Button>Editar</Button>
 * </PermissionGuard>
 *
 * @example
 * // Múltiples permisos (AND)
 * <PermissionGuard permission={['edit-sale', 'view-reports']} requireAll>
 *   <Button>Editar con Reportes</Button>
 * </PermissionGuard>
 *
 * @example
 * // Por rol
 * <PermissionGuard role="admin">
 *   <Button>Solo Admin</Button>
 * </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
	children,
	permission,
	role,
	requireAll = false,
	fallback = null,
}) => {
	const { has, any, all, hasRole, isSuperAdmin, isLoading } = useCan();

	// Mientras carga, no mostrar nada para evitar parpadeo
	if (isLoading) {
		return null;
	}

	// Super-admin tiene acceso total
	if (isSuperAdmin) {
		return <>{children}</>;
	}

	// Si no hay requisitos, permitir acceso
	if (!permission && !role) {
		return <>{children}</>;
	}

	// Verificar permisos
	let hasPermission = true;
	if (permission) {
		const permList = Array.isArray(permission) ? permission : [permission];
		hasPermission = requireAll ? all(permList) : any(permList);
	}

	// Verificar roles
	let hasRequiredRole = true;
	if (role) {
		const roleList = Array.isArray(role) ? role : [role];
		if (requireAll) {
			hasRequiredRole = roleList.every((r) => hasRole(r));
		} else {
			hasRequiredRole = roleList.some((r) => hasRole(r));
		}
	}

	// Debe cumplir ambos (si están definidos)
	const hasAccess = hasPermission && hasRequiredRole;

	if (hasAccess) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
};

export default PermissionGuard;
