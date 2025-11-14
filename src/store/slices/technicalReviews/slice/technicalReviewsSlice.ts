/**
 * Technical Reviews Slice
 * Slice central que combina todos los flujos de revisiones técnicas.
 * Mantiene un único estado global sincronizado entre lotes, series, revisiones y trazabilidad.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TechnicalReviewsState, IBatch, IItem } from '../../../../interface/technicalReviews.interface.ts';

// Importar thunks por flujo
import * as batchesThunks from '../thunks/batchesThunks';
import * as itemsThunks from '../thunks/itemsThunks';
import * as reviewThunks from '../thunks/reviewThunks';
import * as traceabilityThunks from '../thunks/traceabilityThunks';
import * as validationThunks from '../thunks/validationThunks';

const initialState: TechnicalReviewsState = {
    // Lotes
    batches: [],
    batchesMeta: {
        total: 0,
        current_page: 1,
        per_page: 20,
        last_page: 1,
    },
    selectedBatch: null,
    batchesLoading: false,

    // Series/Ítems
    items: [],
    itemsMeta: {
        total: 0,
        current_page: 1,
        per_page: 30,
        last_page: 1,
    },
    selectedItem: null,
    itemsLoading: false,
    itemDetailLoading: false,

    // Operaciones CRUD
    creating: false,
    updating: false,
    deleting: false,

    // Operaciones de revisión
    startingReview: false,
    completingReview: false,
    approving: false,

    // Cambios de estado comercial
    changingStatus: false,

    // Validación y reglas
    validationRules: null,
    validationRulesLoading: false,

    // Errores
    error: null,
    batchesError: null,
    itemsError: null,
    validationError: null,
};

const technicalReviewsSlice = createSlice({
    name: 'technicalReviews',
    initialState,
    reducers: {
        clearSelected: (state) => {
            state.selectedBatch = null;
            state.selectedItem = null;
        },
        clearErrors: (state) => {
            state.error = null;
            state.batchesError = null;
            state.itemsError = null;
            state.validationError = null;
        },
        setSelectedBatch: (state, action: PayloadAction<IBatch | null>) => {
            state.selectedBatch = action.payload;
        },
        setSelectedItem: (state, action: PayloadAction<IItem | null>) => {
            state.selectedItem = action.payload;
        },
    },
    extraReducers: (builder) => {
        // ====================================================================
        // LOTES (BATCHES)
        // ====================================================================

        // Listado de lotes
        builder
            .addCase(batchesThunks.fetchBatches.pending, (state) => {
                state.batchesLoading = true;
                state.batchesError = null;
            })
            .addCase(batchesThunks.fetchBatches.fulfilled, (state, action) => {
                state.batchesLoading = false;
                state.batches = action.payload.items;
                if (action.payload.meta) {
                    state.batchesMeta = {
                        total: action.payload.meta.total ?? 0,
                        current_page: action.payload.meta.current_page ?? 1,
                        per_page: action.payload.meta.per_page ?? 20,
                        last_page: action.payload.meta.last_page ?? 1,
                    };
                }
            })
            .addCase(batchesThunks.fetchBatches.rejected, (state, action) => {
                state.batchesLoading = false;
                state.batchesError = action.payload ?? 'Error al cargar lotes';
            });

        // Ver lote por ID
        builder
            .addCase(batchesThunks.fetchBatchById.pending, (state) => {
                state.batchesLoading = true;
                state.batchesError = null;
            })
            .addCase(batchesThunks.fetchBatchById.fulfilled, (state, action) => {
                state.batchesLoading = false;
                state.selectedBatch = action.payload;
                const index = state.batches.findIndex((b) => b.id === action.payload.id);
                if (index !== -1) state.batches[index] = action.payload;
            })
            .addCase(batchesThunks.fetchBatchById.rejected, (state, action) => {
                state.batchesLoading = false;
                state.batchesError = action.payload ?? 'Error al cargar el lote';
            });

        // Series del lote
        builder
            .addCase(batchesThunks.fetchBatchItems.pending, (state) => {
                state.itemsLoading = true;
                state.itemsError = null;
            })
            .addCase(batchesThunks.fetchBatchItems.fulfilled, (state, action) => {
                state.itemsLoading = false;
                state.items = action.payload.items;
                if (action.payload.meta) {
                    state.itemsMeta = {
                        total: action.payload.meta.total ?? 0,
                        current_page: action.payload.meta.current_page ?? 1,
                        per_page: action.payload.meta.per_page ?? 30,
                        last_page: action.payload.meta.last_page ?? 1,
                    };
                }
            })
            .addCase(batchesThunks.fetchBatchItems.rejected, (state, action) => {
                state.itemsLoading = false;
                state.itemsError = action.payload ?? 'Error al cargar series del lote';
            });

        // Crear lote
        builder
            .addCase(batchesThunks.createBatch.pending, (state) => {
                state.creating = true;
                state.error = null;
            })
            .addCase(batchesThunks.createBatch.fulfilled, (state, action) => {
                state.creating = false;
                state.batches.unshift(action.payload);
                state.selectedBatch = action.payload;
                state.batchesMeta.total += 1;
            })
            .addCase(batchesThunks.createBatch.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload ?? 'Error al crear el lote';
            });

        // Actualizar lote
        builder
            .addCase(batchesThunks.updateBatch.pending, (state) => {
                state.updating = true;
                state.error = null;
            })
            .addCase(batchesThunks.updateBatch.fulfilled, (state, action) => {
                state.updating = false;
                const index = state.batches.findIndex((b) => b.id === action.payload.id);
                if (index !== -1) state.batches[index] = action.payload;
                if (state.selectedBatch?.id === action.payload.id) {
                    state.selectedBatch = action.payload;
                }
            })
            .addCase(batchesThunks.updateBatch.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload ?? 'Error al actualizar el lote';
            });

        // Eliminar lote
        builder
            .addCase(batchesThunks.deleteBatch.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(batchesThunks.deleteBatch.fulfilled, (state, action) => {
                state.deleting = false;
                state.batches = state.batches.filter((b) => b.id !== action.payload);
                if (state.selectedBatch?.id === action.payload) {
                    state.selectedBatch = null;
                }
                state.batchesMeta.total = Math.max(0, state.batchesMeta.total - 1);
            })
            .addCase(batchesThunks.deleteBatch.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload ?? 'Error al eliminar el lote';
            });

        // ====================================================================
        // SERIES/ITEMS (VISTA GLOBAL)
        // ====================================================================

        // Listado de series
        builder
            .addCase(itemsThunks.fetchItems.pending, (state) => {
                state.itemsLoading = true;
                state.itemsError = null;
            })
            .addCase(itemsThunks.fetchItems.fulfilled, (state, action) => {
                state.itemsLoading = false;
                state.items = action.payload.items;
                if (action.payload.meta) {
                    state.itemsMeta = {
                        total: action.payload.meta.total ?? 0,
                        current_page: action.payload.meta.current_page ?? 1,
                        per_page: action.payload.meta.per_page ?? 30,
                        last_page: action.payload.meta.last_page ?? 1,
                    };
                }
            })
            .addCase(itemsThunks.fetchItems.rejected, (state, action) => {
                state.itemsLoading = false;
                state.itemsError = action.payload ?? 'Error al cargar series';
            });

        // Detalle de serie
        builder
            .addCase(itemsThunks.fetchItemDetail.pending, (state) => {
                state.itemDetailLoading = true;
                state.itemsError = null;
            })
            .addCase(itemsThunks.fetchItemDetail.fulfilled, (state, action) => {
                state.itemDetailLoading = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(itemsThunks.fetchItemDetail.rejected, (state, action) => {
                state.itemDetailLoading = false;
                state.itemsError = action.payload ?? 'Error al cargar detalle de la serie';
            });

        // Crear serie
        builder
            .addCase(itemsThunks.createItem.pending, (state) => {
                state.creating = true;
                state.error = null;
            })
            .addCase(itemsThunks.createItem.fulfilled, (state, action) => {
                state.creating = false;
                state.items.unshift(action.payload);
                state.selectedItem = action.payload;
                state.itemsMeta.total += 1;
            })
            .addCase(itemsThunks.createItem.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload ?? 'Error al ingresar la serie';
            });

        // Actualizar serie
        builder
            .addCase(itemsThunks.updateItem.pending, (state) => {
                state.updating = true;
                state.error = null;
            })
            .addCase(itemsThunks.updateItem.fulfilled, (state, action) => {
                state.updating = false;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
                if (state.selectedItem?.id === action.payload.id) {
                    state.selectedItem = action.payload;
                }
            })
            .addCase(itemsThunks.updateItem.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload ?? 'Error al actualizar la serie';
            });

        // Eliminar serie
        builder
            .addCase(itemsThunks.deleteItem.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(itemsThunks.deleteItem.fulfilled, (state, action) => {
                state.deleting = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                if (state.selectedItem?.id === action.payload) {
                    state.selectedItem = null;
                }
                state.itemsMeta.total = Math.max(0, state.itemsMeta.total - 1);
            })
            .addCase(itemsThunks.deleteItem.rejected, (state, action) => {
                state.deleting = false;
                state.error = action.payload ?? 'Error al eliminar la serie';
            });

        // ====================================================================
        // FLUJO DE REVISIÓN TÉCNICA
        // ====================================================================

        // Iniciar revisión
        builder
            .addCase(reviewThunks.startReview.pending, (state) => {
                state.startingReview = true;
                state.error = null;
            })
            .addCase(reviewThunks.startReview.fulfilled, (state, action) => {
                state.startingReview = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(reviewThunks.startReview.rejected, (state, action) => {
                state.startingReview = false;
                state.error = action.payload ?? 'Error al iniciar la revisión';
            });

        // Actualizar detalles
        builder
            .addCase(reviewThunks.updateItemDetails.pending, (state) => {
                state.updating = true;
                state.error = null;
            })
            .addCase(reviewThunks.updateItemDetails.fulfilled, (state, action) => {
                state.updating = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(reviewThunks.updateItemDetails.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload ?? 'Error al actualizar detalles';
            });

        // Completar revisión
        builder
            .addCase(reviewThunks.completeReview.pending, (state) => {
                state.completingReview = true;
                state.error = null;
            })
            .addCase(reviewThunks.completeReview.fulfilled, (state, action) => {
                state.completingReview = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(reviewThunks.completeReview.rejected, (state, action) => {
                state.completingReview = false;
                state.error = action.payload ?? 'Error al finalizar la revisión';
            });

        // Aprobar serie
        builder
            .addCase(reviewThunks.approveItem.pending, (state) => {
                state.approving = true;
                state.error = null;
            })
            .addCase(reviewThunks.approveItem.fulfilled, (state, action) => {
                state.approving = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(reviewThunks.approveItem.rejected, (state, action) => {
                state.approving = false;
                state.error = action.payload ?? 'Error al aprobar la serie';
            });

        // Obtener grado sugerido
        builder
            .addCase(reviewThunks.getSuggestedGrade.pending, (state) => {
                state.validationError = null;
            })
            .addCase(reviewThunks.getSuggestedGrade.fulfilled, () => {
                // No modifica estado, se usa en componentes
            })
            .addCase(reviewThunks.getSuggestedGrade.rejected, (state, action) => {
                state.validationError = action.payload ?? 'Error al calcular grado sugerido';
            });

        // ====================================================================
        // TRAZABILIDAD Y ESTADOS COMERCIALES
        // ====================================================================

        // Cambiar estado comercial
        builder
            .addCase(traceabilityThunks.changeCommercialStatus.pending, (state) => {
                state.changingStatus = true;
                state.error = null;
            })
            .addCase(traceabilityThunks.changeCommercialStatus.fulfilled, (state, action) => {
                state.changingStatus = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(traceabilityThunks.changeCommercialStatus.rejected, (state, action) => {
                state.changingStatus = false;
                state.error = action.payload ?? 'Error al cambiar el estado comercial';
            });

        // Transferir
        builder
            .addCase(traceabilityThunks.transferItem.pending, (state) => {
                state.changingStatus = true;
                state.error = null;
            })
            .addCase(traceabilityThunks.transferItem.fulfilled, (state, action) => {
                state.changingStatus = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(traceabilityThunks.transferItem.rejected, (state, action) => {
                state.changingStatus = false;
                state.error = action.payload ?? 'Error al transferir el equipo';
            });

        // Reservar
        builder
            .addCase(traceabilityThunks.reserveItem.pending, (state) => {
                state.changingStatus = true;
                state.error = null;
            })
            .addCase(traceabilityThunks.reserveItem.fulfilled, (state, action) => {
                state.changingStatus = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(traceabilityThunks.reserveItem.rejected, (state, action) => {
                state.changingStatus = false;
                state.error = action.payload ?? 'Error al reservar el equipo';
            });

        // Liberar reserva
        builder
            .addCase(traceabilityThunks.releaseReservation.pending, (state) => {
                state.changingStatus = true;
                state.error = null;
            })
            .addCase(traceabilityThunks.releaseReservation.fulfilled, (state, action) => {
                state.changingStatus = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(traceabilityThunks.releaseReservation.rejected, (state, action) => {
                state.changingStatus = false;
                state.error = action.payload ?? 'Error al liberar la reserva';
            });

        // Marcar como vendido
        builder
            .addCase(traceabilityThunks.markAsSold.pending, (state) => {
                state.changingStatus = true;
                state.error = null;
            })
            .addCase(traceabilityThunks.markAsSold.fulfilled, (state, action) => {
                state.changingStatus = false;
                state.selectedItem = action.payload;
                const index = state.items.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(traceabilityThunks.markAsSold.rejected, (state, action) => {
                state.changingStatus = false;
                state.error = action.payload ?? 'Error al marcar como vendido';
            });

        // Historial de trazabilidad (no modifica estado)
        builder
            .addCase(traceabilityThunks.getTraceabilityHistory.pending, (state) => {
                state.itemsLoading = true;
            })
            .addCase(traceabilityThunks.getTraceabilityHistory.fulfilled, (state) => {
                state.itemsLoading = false;
            })
            .addCase(traceabilityThunks.getTraceabilityHistory.rejected, (state, action) => {
                state.itemsLoading = false;
                state.error = action.payload ?? 'Error al cargar historial';
            });

        // Disponibles para venta
        builder
            .addCase(traceabilityThunks.getAvailableForSale.pending, (state) => {
                state.itemsLoading = true;
                state.itemsError = null;
            })
            .addCase(traceabilityThunks.getAvailableForSale.fulfilled, (state, action) => {
                state.itemsLoading = false;
                state.items = action.payload.items;
                if (action.payload.meta) {
                    state.itemsMeta = {
                        total: action.payload.meta.total ?? 0,
                        current_page: action.payload.meta.current_page ?? 1,
                        per_page: action.payload.meta.per_page ?? 30,
                        last_page: action.payload.meta.last_page ?? 1,
                    };
                }
            })
            .addCase(traceabilityThunks.getAvailableForSale.rejected, (state, action) => {
                state.itemsLoading = false;
                state.itemsError = action.payload ?? 'Error al cargar equipos disponibles';
            });

        // ====================================================================
        // VALIDACIÓN Y REGLAS
        // ====================================================================

        // Reglas completas
        builder
            .addCase(validationThunks.fetchValidationRules.pending, (state) => {
                state.validationRulesLoading = true;
                state.validationError = null;
            })
            .addCase(validationThunks.fetchValidationRules.fulfilled, (state, action) => {
                state.validationRulesLoading = false;
                state.validationRules = action.payload;
            })
            .addCase(validationThunks.fetchValidationRules.rejected, (state, action) => {
                state.validationRulesLoading = false;
                state.validationError =
                    action.payload ?? 'Error al cargar las reglas de validación';
            });

        // Reglas por tipo
        builder
            .addCase(validationThunks.fetchValidationRulesByType.pending, (state) => {
                state.validationRulesLoading = true;
                state.validationError = null;
            })
            .addCase(validationThunks.fetchValidationRulesByType.fulfilled, (state) => {
                state.validationRulesLoading = false;
            })
            .addCase(validationThunks.fetchValidationRulesByType.rejected, (state, action) => {
                state.validationRulesLoading = false;
                state.validationError =
                    action.payload ?? 'Error al cargar las reglas de validación';
            });

        // Validar campo (no modifica estado)
        builder
            .addCase(validationThunks.validateField.pending, (state) => {
                state.validationError = null;
            })
            .addCase(validationThunks.validateField.fulfilled, () => {
                // No modifica estado
            })
            .addCase(validationThunks.validateField.rejected, (state, action) => {
                state.validationError = action.payload ?? 'Error al validar el campo';
            });

        // Sugerir grado (no modifica estado)
        builder
            .addCase(validationThunks.suggestGrade.pending, (state) => {
                state.validationError = null;
            })
            .addCase(validationThunks.suggestGrade.fulfilled, () => {
                // No modifica estado
            })
            .addCase(validationThunks.suggestGrade.rejected, (state, action) => {
                state.validationError = action.payload ?? 'Error al calcular la sugerencia';
            });

        // Errores comunes (no modifica estado)
        builder
            .addCase(validationThunks.getMyCommonErrors.pending, (state) => {
                state.validationError = null;
            })
            .addCase(validationThunks.getMyCommonErrors.fulfilled, () => {
                // No modifica estado
            })
            .addCase(validationThunks.getMyCommonErrors.rejected, (state, action) => {
                state.validationError = action.payload ?? 'Error al cargar errores comunes';
            });

        // Estadísticas de errores (no modifica estado)
        builder
            .addCase(validationThunks.getErrorStatistics.pending, (state) => {
                state.validationError = null;
            })
            .addCase(validationThunks.getErrorStatistics.fulfilled, () => {
                // No modifica estado
            })
            .addCase(validationThunks.getErrorStatistics.rejected, (state, action) => {
                state.validationError = action.payload ?? 'Error al cargar estadísticas';
            });
    },
});

export const { clearSelected, clearErrors, setSelectedBatch, setSelectedItem } =
    technicalReviewsSlice.actions;

// Exportar el tipo para usarlo en rootReducer
export type { TechnicalReviewsState } from '../../../../interface/technicalReviews.interface.ts';

export default technicalReviewsSlice.reducer;
