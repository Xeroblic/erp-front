// src/hooks/useCan.ts
import { useMemo } from 'react';
import { useAppSelector } from '@/store';

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
	const perms = useAppSelector((s) => s.auth.permisos ?? []);
	const authLoading = useAppSelector((s) => s.auth.loading);
	const rolesFromUser = useAppSelector((s) => (s.auth.user as any)?.roles ?? []);

	// Super-admin check PRIMERO - máxima eficiencia
	const isSuperAdmin = useMemo(() => {
		return perms.includes('super-admin') || rolesFromUser.includes('super-admin');
	}, [perms, rolesFromUser]);

	// Construir lista de roles única
	const roles = useMemo(() => {
		return Array.from(new Set([...rolesFromUser]));
	}, [rolesFromUser]);

	// has - verifica un permiso único
	const has = useMemo(
		() => (perm: string): boolean => {
			if (isSuperAdmin) return true;
			return perms.includes(perm);
		},
		[perms, isSuperAdmin],
	);

	// any - verifica si tiene al menos uno (OR)
	const any = useMemo(
		() => (list: string[]): boolean => {
			if (isSuperAdmin) return true;
			if (!Array.isArray(list) || list.length === 0) return true;
			return list.some((p) => perms.includes(p));
		},
		[perms, isSuperAdmin],
	);

	// all - verifica si tiene todos (AND)
	const all = useMemo(
		() => (list: string[]): boolean => {
			if (isSuperAdmin) return true;
			if (!Array.isArray(list) || list.length === 0) return true;
			return list.every((p) => perms.includes(p));
		},
		[perms, isSuperAdmin],
	);

	// hasRole - verifica un rol
	const hasRole = useMemo(
		() => (role: string): boolean => {
			if (isSuperAdmin) return true;
			return roles.includes(role);
		},
		[roles, isSuperAdmin],
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
		hasRole,
		isAdmin,
		isSuperAdmin,
		isLoading: authLoading,
		perms,
		roles,
	};
}
