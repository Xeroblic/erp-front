// src/hooks/useCan.ts
import { useMemo } from 'react';
import useAuthorization from '@/hooks/useAuthorization';

export interface CanCheck {
	/** Verifica si el usuario tiene un permiso específico */
	has: (perm: string) => boolean;
	/** Verifica si el usuario tiene al menos uno de los permisos (OR) */
	any: (perms: string[]) => boolean;
	/** Verifica si el usuario tiene todos los permisos (AND) */
	all: (perms: string[]) => boolean;
	/** Verifica si el usuario tiene un rol específico */
	hasRole: (role: string) => boolean;
	/** Indica si el usuario es algún tipo de admin */
	isAdmin: boolean;
	/** Indica si el usuario es super-admin (acceso total) */
	isSuperAdmin: boolean;
	/** Indica si está cargando el estado de autenticación */
	isLoading: boolean;
	/** Lista de permisos del usuario */
	perms: string[];
	/** Lista de roles del usuario */
	roles: string[];
}

/**
 * Hook central para verificar permisos y roles del usuario.
 * Super-admin SIEMPRE retorna true en cualquier chequeo.
 *
 * @example
 * const { has, any, all, hasRole, isSuperAdmin } = useCan();
 *
 * if (has('edit-sale')) { ... }
 * if (all(['edit-sale', 'view-reports'])) { ... }
 * if (hasRole('admin')) { ... }
 */
export default function useCan(): CanCheck {
	const {
		permissions,
		roles,
		isLoading,
		isSuperAdmin,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		hasRole: checkRole,
	} = useAuthorization();

	// has - verifica un permiso único
	const has = useMemo(
		() => (perm: string): boolean => {
			return hasPermission(perm);
		},
		[hasPermission],
	);

	// any - verifica si tiene al menos uno (OR)
	const any = useMemo(
		() => (list: string[]): boolean => {
			if (!Array.isArray(list) || list.length === 0) return true;
			return hasAnyPermission(list);
		},
		[hasAnyPermission],
	);

	// all - verifica si tiene todos (AND)
	const all = useMemo(
		() => (list: string[]): boolean => {
			if (!Array.isArray(list) || list.length === 0) return true;
			return hasAllPermissions(list);
		},
		[hasAllPermissions],
	);

	// hasRole - verifica un rol
	const hasRole = useMemo(
		() => (role: string): boolean => {
			return checkRole(role);
		},
		[checkRole],
	);

	// isAdmin - cualquier tipo de admin
	const isAdmin = useMemo(() => {
		if (isSuperAdmin) return true;
		return (
			roles.includes('admin') ||
			roles.includes('company-admin') ||
			roles.includes('subsidiary-admin') ||
			roles.includes('branch-admin')
		);
	}, [roles, isSuperAdmin]);

	return {
		has,
		any,
		all,
		hasRole: hasRole,
		isAdmin,
		isSuperAdmin,
		isLoading,
		perms: permissions,
		roles,
	};
}
