import type { IUserMe } from '@/interface/user.interface';

export type GarantiasUserContext = IUserMe & {
	subsidiary_id?: number | null;
	empresa?: {
		subsidiary_id?: number | null;
	} | null;
};

export const getUserSubsidiaryId = (user?: GarantiasUserContext | null) =>
	user?.subsidiary?.id ??
	user?.subsidiary_id ??
	user?.branch?.subsidiary?.id ??
	user?.empresa?.subsidiary_id ??
	user?.personalizacion?.subsidiary_id ??
	null;
