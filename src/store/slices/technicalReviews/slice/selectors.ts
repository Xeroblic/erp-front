/**
 * Technical Reviews Selectors
 * Selectores organizados por dominio para acceder al estado de revisiones técnicas.
 */
import type { RootState } from '@/store/rootReducer';
import type {
    IBatch,
    IItem,
    IValidationRules,
    ListMeta,
} from '../../../../interface/technicalReviews.interface.ts';

// ====================================================================
// LOTES (BATCHES)
// ====================================================================

export const selectBatches = (state: RootState): IBatch[] =>
    state.technicalReviews.batches;

export const selectBatchesMeta = (state: RootState): ListMeta =>
    state.technicalReviews.batchesMeta;

export const selectSelectedBatch = (state: RootState): IBatch | null =>
    state.technicalReviews.selectedBatch;

export const selectBatchesLoading = (state: RootState): boolean =>
    state.technicalReviews.batchesLoading;

export const selectBatchesError = (state: RootState): string | null =>
    state.technicalReviews.batchesError;

// ====================================================================
// SERIES/ITEMS
// ====================================================================

export const selectItems = (state: RootState): IItem[] =>
    state.technicalReviews.items;

export const selectItemsMeta = (state: RootState): ListMeta =>
    state.technicalReviews.itemsMeta;

export const selectSelectedItem = (state: RootState): IItem | null =>
    state.technicalReviews.selectedItem;

export const selectItemsLoading = (state: RootState): boolean =>
    state.technicalReviews.itemsLoading;

export const selectItemDetailLoading = (state: RootState): boolean =>
    state.technicalReviews.itemDetailLoading;

export const selectItemsError = (state: RootState): string | null =>
    state.technicalReviews.itemsError;

// ====================================================================
// OPERACIONES CRUD
// ====================================================================

export const selectCreating = (state: RootState): boolean =>
    state.technicalReviews.creating;

export const selectUpdating = (state: RootState): boolean =>
    state.technicalReviews.updating;

export const selectDeleting = (state: RootState): boolean =>
    state.technicalReviews.deleting;

// ====================================================================
// OPERACIONES DE REVISIÓN
// ====================================================================

export const selectStartingReview = (state: RootState): boolean =>
    state.technicalReviews.startingReview;

export const selectCompletingReview = (state: RootState): boolean =>
    state.technicalReviews.completingReview;

export const selectApproving = (state: RootState): boolean =>
    state.technicalReviews.approving;

// ====================================================================
// CAMBIOS DE ESTADO COMERCIAL
// ====================================================================

export const selectChangingStatus = (state: RootState): boolean =>
    state.technicalReviews.changingStatus;

// ====================================================================
// VALIDACIÓN Y REGLAS
// ====================================================================

export const selectValidationRules = (state: RootState): IValidationRules | null =>
    state.technicalReviews.validationRules;

export const selectValidationRulesLoading = (state: RootState): boolean =>
    state.technicalReviews.validationRulesLoading;

export const selectValidationError = (state: RootState): string | null =>
    state.technicalReviews.validationError;

// ====================================================================
// ERRORES GENERALES
// ====================================================================

export const selectError = (state: RootState): string | null =>
    state.technicalReviews.error;

// ====================================================================
// SELECTORES COMPUESTOS (DERIVED STATE)
// ====================================================================

export const selectHasErrors = (state: RootState): boolean =>
    Boolean(
        state.technicalReviews.error ||
        state.technicalReviews.batchesError ||
        state.technicalReviews.itemsError ||
        state.technicalReviews.validationError,
    );

export const selectIsLoading = (state: RootState): boolean =>
    state.technicalReviews.batchesLoading ||
    state.technicalReviews.itemsLoading ||
    state.technicalReviews.itemDetailLoading ||
    state.technicalReviews.creating ||
    state.technicalReviews.updating ||
    state.technicalReviews.deleting ||
    state.technicalReviews.startingReview ||
    state.technicalReviews.completingReview ||
    state.technicalReviews.approving ||
    state.technicalReviews.changingStatus ||
    state.technicalReviews.validationRulesLoading;
