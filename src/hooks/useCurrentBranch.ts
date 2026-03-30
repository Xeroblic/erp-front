/**
 * Hook para obtener el branchId actual del usuario
 * Extrae el branchId desde la personalización del usuario
 */
import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { selectPersonalizacionUsuario } from '../store/slices/personalizacion/personalizacionSlice';
import { selectEffectiveSubsidiaryId } from '../store/selectors/subsidiarySelectors';
import type { IUserMe } from '@/interface/user.interface';

interface BranchLike {
	id?: number | string | null;
	branch_id?: number | string | null;
	sucursal_id?: number | string | null;
	subsidiary?: { id?: number | string | null; subsidiary_id?: number | string | null } | number | string | null;
	subsidiary_id?: number | string | null;
	subsidiaryId?: number | string | null;
	subsidiary_info?: { id?: number | string | null; subsidiary_id?: number | string | null } | null;
	name?: string | null;
	branch_name?: string | null;
	nombre?: string | null;
	alias?: string | null;
}

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

const normalizeNullableNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
};

const resolveSubsidiaryFromBranch = (
	branchId: number | null,
	user?: UserWithBranches,
): number | null => {
	if (!branchId || !user) return null;

	const inspectBranch = (branch: BranchLike | null | undefined): number | null => {
		if (!branch) return null;
		const candidateId =
			normalizeNullableNumber(branch.id) ??
			normalizeNullableNumber(branch.branch_id) ??
			normalizeNullableNumber(branch.sucursal_id);
		if (candidateId !== branchId) return null;

		const subsidiarySource = branch.subsidiary ?? branch.subsidiary_info ?? branch.subsidiaryId;
		if (typeof subsidiarySource === 'object' && subsidiarySource !== null) {
			return (
				normalizeNullableNumber(subsidiarySource.id) ??
				normalizeNullableNumber(subsidiarySource.subsidiary_id)
			);
		}

		return (
			normalizeNullableNumber(subsidiarySource) ??
			normalizeNullableNumber(branch.subsidiary_id)
		);
	};

	const collections: Array<BranchLike | BranchLike[] | null | undefined> = [
		user.branch as BranchLike | null | undefined,
		user.access?.branches,
		user.visible?.branches,
	];

	for (const source of collections) {
		if (!source) continue;
		if (Array.isArray(source)) {
			for (const branch of source) {
				const resolved = inspectBranch(branch);
				if (resolved !== null) return resolved;
			}
			continue;
		}

		const resolved = inspectBranch(source);
		if (resolved !== null) return resolved;
	}

	return null;
};

const normalizeBranch = (branch: unknown): VisibleBranch | null => {
	if (!branch || typeof branch !== 'object') return null;
	const candidate = branch as BranchLike;
	const rawId = candidate.id ?? candidate.branch_id ?? candidate.sucursal_id ?? null;
	const idNumber =
		typeof rawId === 'string'
			? Number.parseInt(rawId, 10)
			: typeof rawId === 'number'
				? rawId
				: null;
	if (idNumber === null || Number.isNaN(idNumber)) return null;
	const name =
		candidate.name ??
		candidate.branch_name ??
		candidate.nombre ??
		candidate.alias ??
		`Sucursal ${idNumber}`;
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

		return resolveSubsidiaryFromBranch(branchId, user);
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
