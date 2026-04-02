import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import type {
	AuthorizationCheckOptions,
	AuthorizationContext,
	AuthorizationScopeMode,
} from '@/types/authorization';

const EMPTY_STRING_ARRAY: string[] = [];

export interface UseAuthorizationResult {
	permissions: string[];
	roles: string[];
	isLoading: boolean;
	isSuperAdmin: boolean;
	hasPermission: (permission: string) => boolean;
	hasAnyPermission: (permissions: string[]) => boolean;
	hasAllPermissions: (permissions: string[]) => boolean;
	hasRole: (role: string) => boolean;
	hasAnyRole: (roles: string[]) => boolean;
	hasAllRoles: (roles: string[]) => boolean;
	canViewBranch: (branchId?: number | null) => boolean;
	canAccessBranch: (branchId?: number | null) => boolean;
	canViewSubsidiary: (subsidiaryId?: number | null) => boolean;
	canAccessSubsidiary: (subsidiaryId?: number | null) => boolean;
	canViewCompany: (companyId?: number | null) => boolean;
	canAccessCompany: (companyId?: number | null) => boolean;
	authorize: (options?: AuthorizationCheckOptions) => boolean;
}

const toIdSet = (values: Array<number | null | undefined>): Set<number> => {
	return new Set(values.filter((value): value is number => typeof value === 'number'));
};

const normalizeList = (value?: string | string[]): string[] => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const normalizeIdsFromContext = (context?: AuthorizationContext) => ({
	branchId: context?.branchId ?? null,
	subsidiaryId: context?.subsidiaryId ?? null,
	companyId: context?.companyId ?? null,
});

export default function useAuthorization(): UseAuthorizationResult {
	const authLoading = useAppSelector((s) => s.auth.loading);
	const user = useAppSelector((s) => s.auth.user);
	const normalizedUserPermissions = useAppSelector((s) => s.auth.user?.permisos);
	const userRoles = useAppSelector((s) => s.auth.user?.roles);
	const safePermissions = normalizedUserPermissions ?? EMPTY_STRING_ARRAY;
	const safeRoles = userRoles ?? EMPTY_STRING_ARRAY;

	const permissions = useMemo(
		() => Array.from(new Set(safePermissions)),
		[safePermissions],
	);
	const roles = useMemo(() => Array.from(new Set(safeRoles)), [safeRoles]);

	const permissionSet = useMemo(() => new Set(permissions), [permissions]);
	const roleSet = useMemo(() => new Set(roles), [roles]);

	const visibleBranchIds = useMemo(
		() => toIdSet((user?.visible?.branches ?? []).map((branch) => branch.id)),
		[user?.visible?.branches],
	);
	const accessBranchIds = useMemo(
		() => toIdSet((user?.access?.branches ?? []).map((branch) => branch.id)),
		[user?.access?.branches],
	);
	const visibleSubsidiaryIds = useMemo(
		() =>
			toIdSet((user?.visible?.subsidiaries ?? []).map((subsidiary) => subsidiary.id)),
		[user?.visible?.subsidiaries],
	);
	const accessSubsidiaryIds = useMemo(
		() =>
			toIdSet((user?.access?.subsidiaries ?? []).map((subsidiary) => subsidiary.id)),
		[user?.access?.subsidiaries],
	);
	const visibleCompanyIds = useMemo(
		() =>
			toIdSet(
				(user?.visible?.subsidiaries ?? [])
					.map((subsidiary) => subsidiary.company?.id)
					.filter((id): id is number => typeof id === 'number'),
			),
		[user?.visible?.subsidiaries],
	);
	const accessCompanyIds = useMemo(
		() =>
			toIdSet(
				(user?.access?.subsidiaries ?? [])
					.map((subsidiary) => subsidiary.company?.id)
					.filter((id): id is number => typeof id === 'number'),
			),
		[user?.access?.subsidiaries],
	);

	const isSuperAdmin = useMemo(() => {
		return permissionSet.has('super-admin') || roleSet.has('super-admin');
	}, [permissionSet, roleSet]);

	const hasPermission = (permission: string): boolean => {
		if (isSuperAdmin) return true;
		return permissionSet.has(permission);
	};

	const hasAnyPermission = (requiredPermissions: string[]): boolean => {
		if (isSuperAdmin) return true;
		if (!requiredPermissions.length) return true;
		return requiredPermissions.some((permission) => permissionSet.has(permission));
	};

	const hasAllPermissions = (requiredPermissions: string[]): boolean => {
		if (isSuperAdmin) return true;
		if (!requiredPermissions.length) return true;
		return requiredPermissions.every((permission) => permissionSet.has(permission));
	};

	const hasRole = (role: string): boolean => {
		if (isSuperAdmin) return true;
		return roleSet.has(role);
	};

	const hasAnyRole = (requiredRoles: string[]): boolean => {
		if (isSuperAdmin) return true;
		if (!requiredRoles.length) return true;
		return requiredRoles.some((role) => roleSet.has(role));
	};

	const hasAllRoles = (requiredRoles: string[]): boolean => {
		if (isSuperAdmin) return true;
		if (!requiredRoles.length) return true;
		return requiredRoles.every((role) => roleSet.has(role));
	};

	const canViewBranch = (branchId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!branchId) return true;
		if (visibleBranchIds.size === 0) return true;
		return visibleBranchIds.has(branchId);
	};

	const canAccessBranch = (branchId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!branchId) return true;
		if (accessBranchIds.size === 0) return true;
		return accessBranchIds.has(branchId);
	};

	const canViewSubsidiary = (subsidiaryId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!subsidiaryId) return true;
		if (visibleSubsidiaryIds.size === 0) return true;
		return visibleSubsidiaryIds.has(subsidiaryId);
	};

	const canAccessSubsidiary = (subsidiaryId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!subsidiaryId) return true;
		if (accessSubsidiaryIds.size === 0) return true;
		return accessSubsidiaryIds.has(subsidiaryId);
	};

	const canViewCompany = (companyId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!companyId) return true;
		if (visibleCompanyIds.size === 0) return true;
		return visibleCompanyIds.has(companyId);
	};

	const canAccessCompany = (companyId?: number | null): boolean => {
		if (isSuperAdmin) return true;
		if (!companyId) return true;
		if (accessCompanyIds.size === 0) return true;
		return accessCompanyIds.has(companyId);
	};

	const evaluateScope = (
		scope: AuthorizationScopeMode,
		context?: AuthorizationContext,
	): boolean => {
		if (isSuperAdmin) return true;

		const { branchId, subsidiaryId, companyId } = normalizeIdsFromContext(context);

		if (scope === 'none') return true;
		if (scope === 'visible') {
			return (
				canViewBranch(branchId) &&
				canViewSubsidiary(subsidiaryId) &&
				canViewCompany(companyId)
			);
		}
		if (scope === 'access') {
			return (
				canAccessBranch(branchId) &&
				canAccessSubsidiary(subsidiaryId) &&
				canAccessCompany(companyId)
			);
		}
		return (
			canViewBranch(branchId) &&
			canViewSubsidiary(subsidiaryId) &&
			canViewCompany(companyId) &&
			canAccessBranch(branchId) &&
			canAccessSubsidiary(subsidiaryId) &&
			canAccessCompany(companyId)
		);
	};

	const authorize = (options: AuthorizationCheckOptions = {}): boolean => {
		if (isSuperAdmin) return true;

		const permissionsToCheck = [
			...normalizeList(options.permission),
			...(options.permissions ?? []),
		];
		const rolesToCheck = [...normalizeList(options.role), ...(options.roles ?? [])];
		const requireAll = options.requireAll ?? false;
		const scope = options.scope ?? 'none';

		const permissionAllowed = requireAll
			? hasAllPermissions(permissionsToCheck)
			: hasAnyPermission(permissionsToCheck);
		const roleAllowed = requireAll ? hasAllRoles(rolesToCheck) : hasAnyRole(rolesToCheck);
		const scopeAllowed = evaluateScope(scope, options);

		return permissionAllowed && roleAllowed && scopeAllowed;
	};

	return {
		permissions,
		roles,
		isLoading: authLoading,
		isSuperAdmin,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		hasRole,
		hasAnyRole,
		hasAllRoles,
		canViewBranch,
		canAccessBranch,
		canViewSubsidiary,
		canAccessSubsidiary,
		canViewCompany,
		canAccessCompany,
		authorize,
	};
}
