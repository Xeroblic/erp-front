import { createAction } from '@reduxjs/toolkit';

export interface ITechnicalReviewsContextPayload {
	branchId?: number | null;
	subsidiaryId?: number | null;
}

/**
 * Vive fuera del slice porque la despachan los thunks, y el slice importa los thunks
 * para sus `extraReducers`: definida en el slice, cerraba un ciclo de imports. Conserva el
 * `type` que tenía como reducer del slice.
 */
export const setTechnicalReviewsContext = createAction<ITechnicalReviewsContextPayload>(
	'technicalReviews/setTechnicalReviewsContext',
);
