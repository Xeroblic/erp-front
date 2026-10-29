/**
 * Hook para obtener el branchId actual del usuario
 * Extrae el branchId desde la personalización del usuario
 */
import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { selectPersonalizacionUsuario } from '../store/slices/personalizacion/personalizacionSlice';
import { selectEffectiveSubsidiaryId } from '../store/selectors/subsidiarySelectors';
import {
	resolveSubsidiaryFromBranch,
	type BranchLike,
	type ContextUser,
} from '@/utils/orgContext.util';
import type { IUserMe } from '@/interface/user.interface';

interface VisibleBranch {
	id: number;
	name: string;
}

interface UseCurrentBranchResult {
	branchId: number | null;
	subsidiaryId: number | null;
	hasValidBranch: boolean;
	visibleBranches: VisibleBranch[];
}

const normalizeBranch = (branch: unknown): VisibleBranch | null => {
	if (!branch || typeof branch !== 'object') return null;
	const candidate = branch as BranchLike;
	const rawId = candidate.id ?? null;
	const idNumber =
		typeof rawId === 'string'
			? Number.parseInt(rawId, 10)
			: typeof rawId === 'number'
				? rawId
				: null;
	if (idNumber === null || Number.isNaN(idNumber)) return null;
	const name = candidate.name ?? candidate.branch_name ?? `Sucursal ${idNumber}`;
	return { id: idNumber, name };
};

const normalizeBranchList = (branches: unknown): VisibleBranch[] => {
	if (!Array.isArray(branches)) return [];
	return branches
		.map((branch) => normalizeBranch(branch))
		.filter((branch): branch is VisibleBranch => branch !== null);
};

type UserWithBranches = IUserMe & {
	access?: { branches?: BranchLike[] };
	visible?: { branches?: BranchLike[] };
};

export const useCurrentBranch = (): UseCurrentBranchResult => {
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { user } = useAppSelector(
		(state) => state.auth as { user?: UserWithBranches | undefined },
	);

	const branchId = useMemo(() => {
		// 1. Prioridad: sucursal_principal de personalización
		if (personalizacionUsuario?.sucursal_principal) {
			return personalizacionUsuario.sucursal_principal;
		}

		// 2. Fallback: branch del usuario autenticado
		if (user?.branch?.id) {
			return user.branch.id;
		}

		// 3. Fallback: branch_id directo del usuario
		if (user?.branch_id) {
			return user.branch_id;
		}

		// 4. Sin branch disponible
		return null;
	}, [personalizacionUsuario?.sucursal_principal, user?.branch?.id, user?.branch_id]);

	const subsidiaryId = useMemo(() => {
		if (effectiveSubsidiaryId) {
			return effectiveSubsidiaryId;
		}

		return resolveSubsidiaryFromBranch(branchId, user as ContextUser | undefined);
	}, [branchId, effectiveSubsidiaryId, user]);

	const visibleBranches = useMemo<VisibleBranch[]>(() => {
		const fromAccess = normalizeBranchList(user?.access?.branches);
		const fromVisible = normalizeBranchList(user?.visible?.branches);
		const primaryBranch = normalizeBranch(user?.branch);

		const uniqueMap = new Map<number, VisibleBranch>();
		[...fromAccess, ...fromVisible].forEach((branch) => {
			if (!uniqueMap.has(branch.id)) {
				uniqueMap.set(branch.id, branch);
			}
		});
		if (primaryBranch && !uniqueMap.has(primaryBranch.id)) {
			uniqueMap.set(primaryBranch.id, primaryBranch);
		}

		return Array.from(uniqueMap.values());
	}, [user?.access?.branches, user?.branch, user?.visible?.branches]);

	return {
		branchId,
		subsidiaryId,
		hasValidBranch: branchId !== null,
		visibleBranches,
	};
};
