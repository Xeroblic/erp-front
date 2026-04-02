// src/components/authorization/PermissionGuard.tsx
import React, { PropsWithChildren } from 'react';
import useAuthorization from '@/hooks/useAuthorization';
import type { AuthorizationScopeMode } from '@/types/authorization';

export interface PermissionGuardProps extends PropsWithChildren {
	/** Permiso único o array de permisos requeridos */
	permission?: string | string[];
	/** Rol único o array de roles requeridos */
	role?: string | string[];
	/** Si true, requiere TODOS los permisos/roles. Si false (default), requiere al menos uno */
	requireAll?: boolean;
	/** ID de la sucursal (branch) a validar en el scope contextual */
	branchId?: number | null;
	/** ID de la subsidiaria a validar en el scope contextual */
	subsidiaryId?: number | null;
	/** ID de la empresa a validar en el scope contextual */
	companyId?: number | null;
	/** Modo de scope: 'none' (sin validación geográfica), 'visible', 'access', 'both' */
	scope?: AuthorizationScopeMode;
	/** Componente alternativo a mostrar si no tiene permisos */
	fallback?: React.ReactNode;
}

/**
 * Wrapper declarativo para control de permisos con soporte de scope contextual.
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
 * // Permiso con validación de acceso por sucursal
 * <PermissionGuard permission="create-product" branchId={currentBranchId} scope="access">
 *   <Button>Crear Producto</Button>
 * </PermissionGuard>
 *
 * @example
 * // Múltiples permisos (AND) con scope
 * <PermissionGuard permission={['edit-sale', 'view-reports']} requireAll branchId={5} scope="visible">
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
	branchId,
	subsidiaryId,
	companyId,
	scope = 'none',
	fallback = null,
}) => {
	const { authorize, isSuperAdmin, isLoading } = useAuthorization();

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

	const hasAccess = authorize({
		permission,
		role,
		requireAll,
		branchId,
		subsidiaryId,
		companyId,
		scope,
	});

	if (hasAccess) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
};

export default PermissionGuard;
