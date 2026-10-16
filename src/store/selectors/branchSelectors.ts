import type { RootState } from '@/store/rootReducer';
import { toContextId } from '@/utils/orgContext.util';

/**
 * Sucursal activa del usuario, fuera de un componente (thunks y selectores).
 * Misma cadena que `useCurrentBranch`: `personalizacion.sucursal_principal` →
 * `user.branch.id` → `user.branch_id` → `null`.
 *
 * No confundir con `selectEffectiveSubsidiaryId`: devuelve la filial, y una
 * ruta `/branches/{branch}` necesita la sucursal.
 */
const selectCurrentBranchId = (state: RootState): number | null => {
	const { user } = state.auth;
	return (
		toContextId(state.personalizacion?.personalizacionUsuario?.sucursal_principal) ??
		toContextId(user?.branch?.id) ??
		toContextId(user?.branch_id)
	);
};

export default selectCurrentBranchId;
