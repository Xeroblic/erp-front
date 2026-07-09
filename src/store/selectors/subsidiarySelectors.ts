import { RootState } from '@/store/rootReducer';
import type { IUserMe } from '@/interface/user.interface';
import type { IBranch } from '@/interface/empresas.interface';
import {
	resolveSubsidiaryFromBranch,
	toContextId,
	type ContextUser,
} from '@/utils/orgContext.util';

type UserWithAuthorizationBranches = IUserMe & {
	subsidiary_id?: number | null;
	branch_id?: number | null;
};

type PersonalizationBranch = IBranch & {
	subsidiary_id?: number | null;
};

type PersonalizationBrand = {
	branches?: PersonalizationBranch[];
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

/**
 * Filtra y devuelve la lista de sucursales que pertenecen a la subsidiaria actual
 */
export const selectBranchesBySubsidiary = (
	state: RootState,
	subsidiaryId: number | null,
): IBranch[] => {
	if (!subsidiaryId) return [];

	const persState = state.personalizacion as
		| {
				userBrandsBranches?: PersonalizationBrand[];
		  }
		| null
		| undefined;
	const branches = persState?.userBrandsBranches?.flatMap((brand) => brand.branches ?? []) ?? [];

	// Si no hay ramas en personalización, devolver lista vacía o intentar sacar de auth (depende de la app)
	return branches.filter((branch) => branch.subsidiary_id === subsidiaryId) as IBranch[];
};
