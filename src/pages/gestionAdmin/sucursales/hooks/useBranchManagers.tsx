import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import { TSelectOption } from '@/components/form/SelectReact';

interface UseBranchManagersOptions {
	branchId?: number | string;
	subsidiaryId?: number | string;
	enabled?: boolean;
}

interface UseBranchManagersReturn {
	managers: any[];
	managerOptions: TSelectOption[];
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export const useBranchManagers = (
	options: UseBranchManagersOptions = {},
): UseBranchManagersReturn => {
	const { branchId, subsidiaryId, enabled = true } = options;
	const dispatch = useAppDispatch();

	const { users, loading, error } = useAppSelector((state) => state.usersAdmin);

	const managers = useMemo(() => {
		return users.filter((user) => {
			return user.is_active;
		});
	}, [users]);

	useEffect(() => {
		if (!enabled) return;

		const params: any = {
			status: 'active',
		};

		if (branchId) {
			params.branch_id = Number(branchId);
		} else if (subsidiaryId) {
			params.subsidiary_id = Number(subsidiaryId);
		}
		dispatch(fetchUsers(params));
	}, [dispatch, branchId, subsidiaryId, enabled]);

	const managerOptions: TSelectOption[] = useMemo(() => {
		return managers.map((manager) => ({
			value: manager.id.toString(),
			label: `${manager.first_name} ${manager.last_name}${
				manager.cargo ? ` - ${manager.cargo}` : ''
			}`,
		}));
	}, [managers]);

	const refetch = () => {
		if (!enabled) return;

		const params: any = {
			status: 'active',
		};

		if (branchId) {
			params.branch_id = Number(branchId);
		} else if (subsidiaryId) {
			params.subsidiary_id = Number(subsidiaryId);
		}

		dispatch(fetchUsers(params));
	};

	return {
		managers,
		managerOptions,
		loading: loading.users || false,
		error: error || null,
		refetch,
	};
};

export const useBranchManagerOptions = (branchId?: number | string): TSelectOption[] => {
	const { managerOptions } = useBranchManagers({ branchId, enabled: !!branchId });
	return managerOptions;
};

export const useBranchManager = (managerId?: number | string): any | null => {
	const { managers } = useBranchManagers({ enabled: !!managerId });
	return managers.find((m) => m.id.toString() === managerId?.toString()) || null;
};

export default useBranchManagers;
