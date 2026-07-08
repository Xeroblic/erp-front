import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import type { AuthorizationBranchRef } from '@/types/authorization';

/**
 * Sucursal del usuario, enriquecida con su subsidiaria/empresa. Reemplaza al hook
 * `@deprecated useUserBranches` (que hacía llamadas API innecesarias): estos datos ya
 * vienen en el store desde `/perfil` (`user.access/visible.branches`).
 */
export interface UserBranchInfo {
	id: number;
	name: string;
	subsidiaryId: number | null;
	subsidiaryName: string | null;
	companyId: number | null;
	companyName: string | null;
	city: string | null;
}

const toBranchInfo = (branch: AuthorizationBranchRef): UserBranchInfo => ({
	id: branch.id,
	name: branch.name,
	subsidiaryId: branch.subsidiary?.id ?? null,
	subsidiaryName: branch.subsidiary?.name ?? null,
	companyId: branch.subsidiary?.company?.id ?? null,
	companyName: branch.subsidiary?.company?.name ?? null,
	city: null,
});

/**
 * Lista de sucursales accesibles/visibles del usuario autenticado, sin duplicados y sin
 * llamadas a la API. Memoizada.
 */
export const selectUserBranches = createSelector(
	[
		(state: RootState) => state.auth.user?.access?.branches,
		(state: RootState) => state.auth.user?.visible?.branches,
	],
	(accessBranches, visibleBranches): UserBranchInfo[] => {
		const map = new Map<number, UserBranchInfo>();
		const add = (branches?: AuthorizationBranchRef[] | null) => {
			(branches ?? []).forEach((branch) => {
				if (branch?.id && !map.has(branch.id)) {
					map.set(branch.id, toBranchInfo(branch));
				}
			});
		};
		add(accessBranches);
		add(visibleBranches);
		return Array.from(map.values());
	},
);
