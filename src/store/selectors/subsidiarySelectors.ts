import { RootState } from '@/store/rootReducer';

/**
 * Obtiene el subsidiaryId efectivo considerando las diferentes estructuras
 * que puede entregar auth / personalizacion.
 */
export const selectEffectiveSubsidiaryId = (state: RootState): number | null => {
	const user = state.auth.user;
	const personalizationSlice = state.personalizacion?.personalizacionUsuario;

	return (
		user?.subsidiary?.id ??
		personalizationSlice?.subsidiary_id ??
		user?.personalizacion?.subsidiary_id ??
		user?.personalizacion?.sucursal_principal ??
		user?.branch?.subsidiary?.id ??
		(user?.branch?.subsidiary_id as number | undefined) ??
		(typeof (user as any)?.subsidiary_id === 'number' ? ((user as any).subsidiary_id as number) : null) ??
		null
	);
};
