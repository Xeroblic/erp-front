/**
 * Technical Reviews - Barrel Exports
 * Estructura modular con thunks separados por flujo y slice unificado.
 */

// ========== SLICE Y ACTIONS ==========
export { default as technicalReviewsReducer } from './slice/technicalReviewsSlice';
export {
    clearSelected,
    clearErrors,
    setSelectedBatch,
    setSelectedItem,
} from './slice/technicalReviewsSlice';

// ========== TYPES ==========
export type {
    TechnicalReviewsState,
    ReviewStatus,
    CommercialStatus,
    EquipmentType,
    IBatch,
    IItem,
    IValidationRule,
    IValidationRules,
    ListMeta,
    FetchBatchesParams,
    FetchBatchItemsParams,
    FetchItemsParams,
    UpdateItemDetailsPayload,
    ApproveItemPayload,
    ChangeCommercialStatusPayload,
    ReserveItemPayload,
    MarkAsSoldPayload,
} from '../../../interface/technicalReviews.interface.ts';

// ========== THUNKS - LOTES ==========
export {
    fetchBatches,
    fetchBatchById,
    fetchBatchItems,
    createBatch,
    updateBatch,
    deleteBatch,
} from './thunks/batchesThunks';

// ========== THUNKS - SERIES/ITEMS ==========
export {
    fetchItems,
    fetchItemDetail,
    createItem,
    updateItem,
    deleteItem,
} from './thunks/itemsThunks';

// ========== THUNKS - REVISIÓN ==========
export {
    startReview,
    updateItemDetails,
    completeReview,
    approveItem,
    getSuggestedGrade,
} from './thunks/reviewThunks';

// ========== THUNKS - TRAZABILIDAD ==========
export {
    changeCommercialStatus,
    reserveItem,
    releaseReservation,
    markAsSold,
    transferItem,
    getTraceabilityHistory,
    getAvailableForSale,
} from './thunks/traceabilityThunks';

// ========== THUNKS - VALIDACIÓN ==========
export {
    fetchValidationRules,
    fetchValidationRulesByType,
    validateField,
    suggestGrade,
    getMyCommonErrors,
    getErrorStatistics,
} from './thunks/validationThunks';

// ========== SELECTORS ==========
export {
    // Lotes
    selectBatches,
    selectBatchesMeta,
    selectSelectedBatch,
    selectBatchesLoading,
    selectBatchesError,
    // Series/Items
    selectItems,
    selectItemsMeta,
    selectSelectedItem,
    selectItemsLoading,
    selectItemDetailLoading,
    selectItemsError,
    // Operaciones CRUD
    selectCreating,
    selectUpdating,
    selectDeleting,
    // Operaciones de revisión
    selectStartingReview,
    selectCompletingReview,
    selectApproving,
    // Cambios de estado
    selectChangingStatus,
    // Validación
    selectValidationRules,
    selectValidationRulesLoading,
    selectValidationError,
    // Errores
    selectError,
    // Selectores compuestos
    selectHasErrors,
    selectIsLoading,
} from './slice/selectors';
