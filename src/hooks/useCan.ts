import { useAppSelector } from '@/store';

export type CanCheck = {
	has: (perm: string) => boolean;
	any: (perms: string[]) => boolean;
	all: (perms: string[]) => boolean;
	hasRole: (role: string) => boolean;
	isAdmin: boolean;
	perms: string[];
	roles: string[];
};

export default function useCan(): CanCheck {
	const perms = useAppSelector((s) => s.auth.permisos ?? []);
	// En este proyecto los roles suelen venir tanto en user.roles como embebidos en permisos/authority
	const rolesFromUser = useAppSelector((s) => (s.auth.user as any)?.roles ?? []);
	const rolesInPerms = Array.isArray(perms)
		? perms.filter((p) => (typeof p === 'string' && /admin$/i.test(p)) || p === 'super-admin')
		: [];
	const roles = Array.from(new Set([...(rolesFromUser ?? []), ...rolesInPerms]));

	const has = (perm: string) => Array.isArray(perms) && perms.includes(perm);
	const any = (list: string[]) => Array.isArray(list) && list.some((p) => has(p));
	const all = (list: string[]) => Array.isArray(list) && list.every((p) => has(p));
	const hasRole = (role: string) => roles.includes(role);
	const isAdmin =
		has('view-user') ||
		hasRole('super-admin') ||
		hasRole('company-admin') ||
		hasRole('subsidiary-admin') ||
		hasRole('branch-admin');

	return { has, any, all, hasRole, isAdmin, perms: perms ?? [], roles };
}
