import { RootState } from '@/store/rootReducer';
import type { IUserMe } from '@/interface/user.interface';
import {
	resolveSubsidiaryFromBranch,
	toContextId,
	type ContextUser,
} from '@/utils/orgContext.util';

type UserWithAuthorizationBranches = IUserMe & {
	subsidiary_id?: number | null;
	branch_id?: number | null;
};

const toNumber = toContextId;

/**
 * Obtiene el subsidiaryId efectivo considerando las diferentes estructuras
 * que puede entregar auth / personalizacion.
 */
export const selectEffectiveSubsidiaryId = (state: RootState): number | null => {
	const { user } = state.auth;
	const authUser = user as UserWithAuthorizationBranches | null | undefined;
	const personalizationSlice = state.personalizacion?.personalizacionUsuario;

	const directCandidates = [
		user?.subsidiary?.id,
		personalizationSlice?.subsidiary_id,
		user?.personalizacion?.subsidiary_id,
		user?.branch?.subsidiary?.id,
		authUser?.subsidiary_id ?? null,
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
		authUser?.branch_id ??
		null;

	const derivedFromBranch = resolveSubsidiaryFromBranch(
		preferredBranchId,
		user as ContextUser | null | undefined,
	);
	if (derivedFromBranch !== null) return derivedFromBranch;

	return null;
};

export default selectEffectiveSubsidiaryId;
