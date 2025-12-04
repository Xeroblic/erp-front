import { useMemo } from 'react';
import { SYSTEM_ROLES } from '@/constants/erp-permissions.constant';
import type { TSelectOption } from '@/components/form/SelectReact';
import { useBranchManagers } from '@/pages/gestionAdmin/sucursales/hooks/useBranchManagers';

const WAREHOUSE_ROLE = SYSTEM_ROLES.WAREHOUSE_MANAGER.toLowerCase();

const extractRoleNames = (manager: any): string[] => {
	const names: string[] = [];

	const pushValue = (value?: string | null) => {
		if (!value) return;
		names.push(String(value).toLowerCase());
	};

	if (Array.isArray(manager.roles)) {
		manager.roles.forEach((role: any) => {
			if (typeof role === 'string') {
				pushValue(role);
			} else if (role && typeof role === 'object') {
				pushValue(role.name);
				pushValue(role.role);
			}
		});
	}

	if (Array.isArray(manager.global_roles)) {
		manager.global_roles.forEach((role: any) => pushValue(role));
	}

	if (Array.isArray(manager.role_names)) {
		manager.role_names.forEach((role: any) => pushValue(role));
	}

	if (Array.isArray(manager.contextual_roles)) {
		manager.contextual_roles.forEach((context: any) => pushValue(context?.role));
	}

	if (Array.isArray(manager.authority)) {
		manager.authority.forEach((role: any) => pushValue(role));
	}

	return names;
};

export const useWarehouseManagers = (branchId?: number | null) => {
	const safeBranchId = branchId == null ? undefined : branchId;
	const { managers, loading, error, refetch } = useBranchManagers({
		branchId: safeBranchId,
		enabled: Boolean(safeBranchId),
	});

	const filteredManagers = useMemo(
		() =>
			managers.filter((manager) => {
				const roles = extractRoleNames(manager);
				return roles.includes(WAREHOUSE_ROLE);
			}),
		[managers],
	);

	const managerOptions: TSelectOption[] = useMemo(
		() =>
			filteredManagers.map((manager) => {
				const fullName =
					[manager.first_name, manager.last_name].filter(Boolean).join(' ').trim() ||
					manager.name ||
					`Usuario #${manager.id}`;
				return {
					value: manager.id != null ? manager.id.toString() : undefined,
					label: fullName,
				};
			}),
		[filteredManagers],
	);

	return {
		managers: filteredManagers,
		managerOptions,
		loading,
		error,
		refetch,
	};
};

export default useWarehouseManagers;
