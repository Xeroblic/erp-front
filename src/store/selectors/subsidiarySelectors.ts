import { RootState } from '@/store/rootReducer';

type BranchLike = {
	id?: number | null;
	branch_id?: number | null;
	branchId?: number | null;
	subsidiary?: { id?: number | null; subsidiary_id?: number | null } | number | null;
	subsidiary_id?: number | null;
	subsidiaryId?: number | null;
	subsidiary_info?: { id?: number | null; subsidiary_id?: number | null } | null;
};

const toNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const resolveSubsidiaryFromBranch = (
	branchId: number | null | undefined,
	user: RootState['auth']['user'],
): number | null => {
	const normalizedBranchId = toNumber(branchId);
	if (normalizedBranchId === null) return null;

	const inspectBranch = (branch: BranchLike | null | undefined): number | null => {
		if (!branch) return null;
		const candidateId =
			toNumber(branch.id) ?? toNumber(branch.branch_id) ?? toNumber(branch.branchId);
		if (candidateId !== normalizedBranchId) return null;

		const subsidiarySource =
			branch.subsidiary ?? branch.subsidiary_info ?? branch.subsidiaryId ?? null;
		if (typeof subsidiarySource === 'number') {
			return toNumber(subsidiarySource);
		}
		if (typeof subsidiarySource === 'object' && subsidiarySource !== null) {
			return (
				toNumber(subsidiarySource.id) ?? toNumber((subsidiarySource as any).subsidiary_id)
			);
		}
		return toNumber(branch.subsidiary_id);
	};

	const collections: Array<BranchLike | BranchLike[] | null | undefined> = [
		user?.branch as BranchLike | null | undefined,
		(user as any)?.branches,
		(user as any)?.access?.branches,
		(user as any)?.visible?.branches,
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

/**
 * Obtiene el subsidiaryId efectivo considerando las diferentes estructuras
 * que puede entregar auth / personalizacion.
 */
export const selectEffectiveSubsidiaryId = (state: RootState): number | null => {
	const { user } = state.auth;
	const personalizationSlice = state.personalizacion?.personalizacionUsuario;

	const directCandidates = [
		user?.subsidiary?.id,
		personalizationSlice?.subsidiary_id,
		user?.personalizacion?.subsidiary_id,
		user?.branch?.subsidiary?.id,
		typeof (user as any)?.subsidiary_id === 'number'
			? ((user as any).subsidiary_id as number)
			: null,
	];

	for (const candidate of directCandidates) {
		const normalized = toNumber(candidate);
		if (normalized !== null) {
			return normalized;
		}
	}

	const preferredBranchId =
		personalizationSlice?.sucursal_principal ??
		user?.personalizacion?.sucursal_principal ??
		user?.branch?.id ??
		(user as any)?.branch_id ??
		null;

	const derivedFromBranch = resolveSubsidiaryFromBranch(preferredBranchId, user);
	if (derivedFromBranch !== null) return derivedFromBranch;

	return null;
};
