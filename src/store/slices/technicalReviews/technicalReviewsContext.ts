import type { RootState } from '@/store/rootReducer';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';

const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');

export type TechnicalReviewsEndpointMode = 'subsidiaries' | 'branches';

export interface TechnicalReviewsRequestContextInput {
	branchId?: number | null;
	subsidiaryId?: number | null;
}

export interface TechnicalReviewsResolvedContext {
	endpointMode: TechnicalReviewsEndpointMode;
	entityId: number;
	branchId: number | null;
	subsidiaryId: number | null;
}

const toValidNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	return null;
};

const resolveSubsidiaryFromBranch = (state: RootState, branchId: number | null): number | null => {
	if (!branchId) return null;

	const user = state.auth.user;
	const sources: any[] = [
		user?.branch,
		(user as any)?.branches,
		(user as any)?.access?.branches,
		(user as any)?.visible?.branches,
	];

	for (const source of sources) {
		if (!source) continue;
		const branches = Array.isArray(source) ? source : [source];
		for (const branch of branches) {
			const candidateId =
				toValidNumber(branch?.id) ??
				toValidNumber(branch?.branch_id) ??
				toValidNumber(branch?.branchId) ??
				toValidNumber(branch?.sucursal_id);
			if (candidateId !== branchId) continue;

			const subsidiarySource =
				branch?.subsidiary ?? branch?.subsidiary_info ?? branch?.subsidiaryId ?? branch?.subsidiary_id;
			if (typeof subsidiarySource === 'object' && subsidiarySource !== null) {
				const nestedId =
					toValidNumber(subsidiarySource.id) ??
					toValidNumber(subsidiarySource.subsidiary_id);
				if (nestedId) return nestedId;
			}

			const directId = toValidNumber(subsidiarySource);
			if (directId) return directId;
		}
	}

	return null;
};

export const resolveTechnicalReviewsContext = (
	state: RootState,
	input: TechnicalReviewsRequestContextInput = {},
): TechnicalReviewsResolvedContext => {
	const branchId =
		toValidNumber(input.branchId) ??
		toValidNumber(state.technicalReviews.contextBranchId) ??
		toValidNumber(state.personalizacion?.personalizacionUsuario?.sucursal_principal) ??
		toValidNumber(state.auth.user?.branch?.id) ??
		toValidNumber((state.auth.user as any)?.branch_id);

	const effectiveSubsidiaryId = selectEffectiveSubsidiaryId(state);
	const subsidiaryId =
		toValidNumber(input.subsidiaryId) ??
		toValidNumber(state.technicalReviews.contextSubsidiaryId) ??
		toValidNumber(effectiveSubsidiaryId) ??
		resolveSubsidiaryFromBranch(state, branchId);

	// Determinamos el modo del endpoint basado en los inputs proporcionados.
	// Si se proporciona branchId, priorizamos el modo 'branches' para evitar 403 
	// en usuarios que pertenecen a una subsidiaria pero no tienen acceso global a ella.
	const endpointMode: TechnicalReviewsEndpointMode = (input.subsidiaryId && !input.branchId) 
		? 'subsidiaries' 
		: 'branches';

	const entityId = endpointMode === 'subsidiaries' ? subsidiaryId ?? branchId : branchId;
	if (!entityId) {
		throw new Error('No se pudo resolver el contexto de technical reviews');
	}

	return {
		endpointMode,
		entityId,
		branchId,
		subsidiaryId,
	};
};

export const buildTechnicalReviewsEndpoint = (
	context: TechnicalReviewsResolvedContext,
	path: string,
) => join(TECHNICAL_REVIEWS_PREFIX, `/${context.endpointMode}/${context.entityId}/technical-reviews${path}`);
