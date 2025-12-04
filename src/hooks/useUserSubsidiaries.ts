import { useEffect, useState, useCallback } from 'react';
import ApiService from '@/services/ApiService';
import { useAppSelector } from '@/store';

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

export const useUserSubsidiaries = (
	userId?: number,
	options: { fetchOnMount?: boolean; enabled?: boolean } = {},
): UseUserSubsidiariesReturn => {
	const { fetchOnMount = true, enabled = !!userId } = options;

	const currentUserId = useAppSelector(
		(s) => s.auth.user?.id ?? (s.auth.user as any)?.pk ?? undefined,
	);
	const permisos = useAppSelector((s) => s.auth.permisos ?? []);
	const authUser = useAppSelector((s) => s.auth.user as any);

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
				if (authUser) {
					const meData = authUser;
					const acc = meData?.access?.subsidiaries ?? [];
					const vis = meData?.visible?.subsidiaries ?? [];
					const map = new Map<number, any>();
					[...acc, ...vis].forEach((s: any) => {
						if (s?.id && !map.has(s.id)) map.set(s.id, s);
					});
					let raw: any[] = Array.from(map.values());

					if ((!Array.isArray(raw) || raw.length === 0) && meData?.branch?.subsidiary) {
						const sb = meData.branch.subsidiary;
						if (sb?.id) raw = [sb];
					}

					if (Array.isArray(raw) && raw.length) {
						const normalized: UserSubsidiary[] = raw.map((s: any) => {
							const company = s?.company ?? s?.company_info ?? null;
							const companyId =
								typeof company === 'object'
									? (company?.id ?? null)
									: typeof company === 'number'
										? company
										: null;
							const companyName =
								typeof company === 'object'
									? (company?.name ?? company?.company_name ?? null)
									: (s?.company_name ?? null);
							return {
								id: s.id,
								name: s.name ?? s.subsidiary_name ?? `Subsidiary ${s.id}`,
								companyId,
								companyName,
							};
						});
						setState({ subsidiaries: normalized, loading: false, error: null });
						return;
					}
				}

				// Fallback: llamar /perfil
				const meResp = await ApiService.fetchData({ url: '/perfil', method: 'get' });
				const meData = (meResp as any)?.data?.data ?? (meResp as any)?.data ?? {};
				const acc = meData?.access?.subsidiaries ?? [];
				const vis = meData?.visible?.subsidiaries ?? [];
				const map = new Map<number, any>();
				[...acc, ...vis].forEach((s: any) => {
					if (s?.id && !map.has(s.id)) map.set(s.id, s);
				});
				let rawSubs: any[] = Array.from(map.values());
				if (
					(!Array.isArray(rawSubs) || rawSubs.length === 0) &&
					meData?.branch?.subsidiary
				) {
					const sb = meData.branch.subsidiary;
					if (sb?.id) rawSubs = [sb];
				}

				const normalized = rawSubs.map((s: any) => {
					const company = s?.company ?? null;
					const companyId =
						typeof company === 'object'
							? (company?.id ?? null)
							: typeof company === 'number'
								? company
								: null;
					const companyName =
						typeof company === 'object'
							? (company?.name ?? company?.company_name ?? null)
							: (s?.company_name ?? null);
					return {
						id: s.id,
						name: s.name ?? s.subsidiary_name ?? `Subsidiary ${s.id}`,
						companyId,
						companyName,
					};
				});

				setState({ subsidiaries: normalized, loading: false, error: null });
				return;
			}

			// Petición al endpoint de usuario con includes
			const resp = await ApiService.fetchData({
				url: `/users/${userId}?include=access`,
				method: 'get',
			});
			const userData = (resp as any).data?.data ?? (resp as any).data ?? {};
			const accessSubs = userData?.access?.subsidiaries ?? [];
			const visibleSubs = userData?.visible?.subsidiaries ?? [];
			const primarySub = userData?.subsidiary ?? null;

			const merged = new Map<number, any>();
			[...accessSubs, ...visibleSubs].forEach((s: any) => {
				if (s?.id && !merged.has(s.id)) merged.set(s.id, s);
			});
			if (primarySub?.id && !merged.has(primarySub.id)) merged.set(primarySub.id, primarySub);
			const raw = Array.from(merged.values());

			const normalizedSubs: UserSubsidiary[] = raw.map((s: any) => {
				const company = s?.company ?? null;
				const companyId =
					typeof company === 'object'
						? (company?.id ?? null)
						: typeof company === 'number'
							? company
							: null;
				const companyName =
					typeof company === 'object'
						? (company?.name ?? company?.company_name ?? null)
						: (s?.company_name ?? null);
				return {
					id: s.id,
					name: s.name ?? s.subsidiary_name ?? `Subsidiary ${s.id}`,
					companyId,
					companyName,
				};
			});

			setState({ subsidiaries: normalizedSubs, loading: false, error: null });
		} catch (error: any) {
			const status = error?.response?.status;
			const isForbidden = status === 403;
			const isSelfRequest = currentUserId && Number(currentUserId) === Number(userId);

			if (isForbidden && isSelfRequest) {
				try {
					const meResp = await ApiService.fetchData({ url: '/perfil', method: 'get' });
					const meData = (meResp as any)?.data?.data ?? (meResp as any)?.data ?? {};
					const acc = meData?.access?.subsidiaries ?? [];
					const vis = meData?.visible?.subsidiaries ?? [];
					const map = new Map<number, any>();
					[...acc, ...vis].forEach((s: any) => {
						if (s?.id && !map.has(s.id)) map.set(s.id, s);
					});
					const rawSubs = Array.from(map.values());
					const normalized = rawSubs.map((s: any) => {
						const company = s?.company ?? null;
						const companyId =
							typeof company === 'object'
								? (company?.id ?? null)
								: typeof company === 'number'
									? company
									: null;
						const companyName =
							typeof company === 'object'
								? (company?.name ?? company?.company_name ?? null)
								: (s?.company_name ?? null);
						return {
							id: s.id,
							name: s.name ?? s.subsidiary_name ?? `Subsidiary ${s.id}`,
							companyId,
							companyName,
						};
					});
					setState({ subsidiaries: normalized, loading: false, error: null });
					return;
				} catch (_e) {
					// continuar al error general
				}
			}

			const message =
				error?.response?.data?.message ||
				error?.message ||
				'Error al obtener subsidiarias del usuario';
			setState({ subsidiaries: [], loading: false, error: message });
			console.error('[useUserSubsidiaries] Error:', message, error);
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
