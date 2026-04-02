import { useEffect, useState, useCallback } from 'react';
import ApiService from '@/services/ApiService';
import type { IUserMe } from '@/interface/user.interface';
import { useAppSelector } from '@/store';
import type { AuthorizationSubsidiaryRef } from '@/types/authorization';

type ApiEnvelope<T> = {
	data?: T | { data?: T };
};

type ApiError = {
	message?: string;
	response?: {
		status?: number;
		data?: {
			message?: string;
		};
	};
};

type UserWithBranches = IUserMe & {
	pk?: number;
	branches?: Array<IUserMe['branch']>;
	subsidiary_id?: number | null;
};

export interface UserSubsidiary {
	id: number;
	name: string;
	companyId?: number | null;
	companyName?: string | null;
}

interface UseUserSubsidiariesState {
	subsidiaries: UserSubsidiary[];
	loading: boolean;
	error: string | null;
}

interface UseUserSubsidiariesReturn extends UseUserSubsidiariesState {
	refetch: () => Promise<void>;
	clearError: () => void;
}

const unwrapApiData = <T,>(response: ApiEnvelope<T> | undefined): T | null => {
	if (!response?.data) return null;
	if (typeof response.data === 'object' && response.data !== null && 'data' in response.data) {
		return (response.data as { data?: T }).data ?? null;
	}
	return response.data as T;
};

const normalizeCompanyData = (subsidiary: AuthorizationSubsidiaryRef | IUserMe['subsidiary']) => {
	const company =
		typeof subsidiary === 'object' && subsidiary !== null && 'company' in subsidiary
			? subsidiary.company ?? null
			: null;

	return {
		companyId: company?.id ?? null,
		companyName: company?.name ?? null,
	};
};

const normalizeSubsidiaryList = (
	subsidiaries: Array<AuthorizationSubsidiaryRef | IUserMe['subsidiary'] | null | undefined>,
): UserSubsidiary[] => {
	const map = new Map<number, UserSubsidiary>();

	subsidiaries.forEach((subsidiary) => {
		if (!subsidiary?.id) return;
		if (map.has(subsidiary.id)) return;

		const { companyId, companyName } = normalizeCompanyData(subsidiary);
		map.set(subsidiary.id, {
			id: subsidiary.id,
			name: subsidiary.name,
			companyId,
			companyName,
		});
	});

	return Array.from(map.values());
};

const getSubsidiariesFromUser = (user: UserWithBranches | null | undefined): UserSubsidiary[] => {
	if (!user) return [];

	const candidates: Array<AuthorizationSubsidiaryRef | IUserMe['subsidiary'] | null | undefined> = [
		...(user.access?.subsidiaries ?? []),
		...(user.visible?.subsidiaries ?? []),
		user.subsidiary,
		user.branch?.subsidiary,
	];

	return normalizeSubsidiaryList(candidates);
};

export const useUserSubsidiaries = (
	userId?: number,
	options: { fetchOnMount?: boolean; enabled?: boolean } = {},
): UseUserSubsidiariesReturn => {
	const { fetchOnMount = true, enabled = !!userId } = options;

	const authUser = useAppSelector((s) => s.auth.user as UserWithBranches | undefined);
	const currentUserId = useAppSelector((s) => s.auth.user?.id ?? authUser?.pk ?? undefined);
	const permisos = useAppSelector((s) => s.auth.user?.permisos ?? []);

	const [state, setState] = useState<UseUserSubsidiariesState>({
		subsidiaries: [],
		loading: false,
		error: null,
	});

	const fetchUserSubsidiaries = useCallback(async (): Promise<void> => {
		if (!userId || !enabled) {
			setState({ subsidiaries: [], loading: false, error: null });
			return;
		}

		setState((p) => ({ ...p, loading: true, error: null }));

		try {
			const isSelf = currentUserId && Number(currentUserId) === Number(userId);
			const canViewUser = Array.isArray(permisos) && permisos.includes('view-user');

			if (isSelf || !canViewUser) {
				const normalizedFromAuth = getSubsidiariesFromUser(authUser);
				if (normalizedFromAuth.length > 0) {
					setState({ subsidiaries: normalizedFromAuth, loading: false, error: null });
					return;
				}

				// Fallback: llamar /perfil
				const meResp = await ApiService.fetchData<UserWithBranches>({
					url: '/perfil',
					method: 'get',
				});
				const meData = unwrapApiData<UserWithBranches>(meResp) ?? undefined;
				const normalized = getSubsidiariesFromUser(meData);

				setState({ subsidiaries: normalized, loading: false, error: null });
				return;
			}

			// Petición al endpoint de usuario con includes
			const resp = await ApiService.fetchData<UserWithBranches>({
				url: `/users/${userId}?include=access`,
				method: 'get',
			});
			const userData = unwrapApiData<UserWithBranches>(resp) ?? undefined;
			const normalizedSubs = getSubsidiariesFromUser(userData);

			setState({ subsidiaries: normalizedSubs, loading: false, error: null });
		} catch (error: unknown) {
			const typedError = error as ApiError;
			const status = typedError?.response?.status;
			const isForbidden = status === 403;
			const isSelfRequest = currentUserId && Number(currentUserId) === Number(userId);

			if (isForbidden && isSelfRequest) {
				try {
					const meResp = await ApiService.fetchData<UserWithBranches>({
						url: '/perfil',
						method: 'get',
					});
					const meData = unwrapApiData<UserWithBranches>(meResp) ?? undefined;
					const normalized = getSubsidiariesFromUser(meData);
					setState({ subsidiaries: normalized, loading: false, error: null });
					return;
				} catch (_e) {
					// continuar al error general
				}
			}

			const message =
				typedError?.response?.data?.message ||
				typedError?.message ||
				'Error al obtener subsidiarias del usuario';
			setState({ subsidiaries: [], loading: false, error: message });
			console.error('[useUserSubsidiaries] Error:', message, typedError);
		}
	}, [userId, enabled, currentUserId, permisos, authUser]);

	const clearError = useCallback(() => setState((p) => ({ ...p, error: null })), []);

	useEffect(() => {
		if (fetchOnMount && enabled && userId) fetchUserSubsidiaries();
	}, [userId, fetchOnMount, enabled, fetchUserSubsidiaries]);

	return {
		subsidiaries: state.subsidiaries,
		loading: state.loading,
		error: state.error,
		refetch: fetchUserSubsidiaries,
		clearError,
	};
};

export default useUserSubsidiaries;
