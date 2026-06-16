/**
 * Redux Slice para WooCommerce — Importación de términos (categorías/marcas)
 *   #1 `runImportTerms`        → programa el lote (job en cola)
 *   #2 `pollImportTermsStatus` → consulta el progreso del lote
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
	ImportTermsPayload,
	ImportTermsResponse,
	ImportTermsStatus,
	ImportTermsStatusQueryParams,
} from '@/types/integrations.types';
import * as woocommerceProductsService from '@/services/woocommerceProductsService';

// ==================== HELPERS (zero-any) ====================

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as UnknownRecord;
	}
	return undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
	const responseRecord = asRecord(asRecord(error)?.response);
	const dataRecord = asRecord(responseRecord?.data);
	const message = dataRecord?.message;
	if (typeof message === 'string' && message.trim()) {
		return message;
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
};

// ==================== STATE ====================

interface WooProductsState {
	/** Lote activo de importación de términos (#1). */
	importBatchId: string | null;
	/** Progreso/estado del lote (#2). */
	importStatus: ImportTermsStatus | null;
	/** Lanzando el job de importación (#1). */
	importing: boolean;
	/** Consultando el estado del lote (#2). */
	loading: boolean;
	error: string | null;
}

const initialState: WooProductsState = {
	importBatchId: null,
	importStatus: null,
	importing: false,
	loading: false,
	error: null,
};

// ==================== THUNKS ====================

/**
 * #1 · Programa la importación masiva de términos (categorías/marcas).
 */
export const runImportTerms = createAsyncThunk<
	ImportTermsResponse,
	{ subsidiaryId: number; payload: ImportTermsPayload },
	{ rejectValue: string }
>('woocommerceProducts/runImportTerms', async ({ subsidiaryId, payload }, { rejectWithValue }) => {
	try {
		return await woocommerceProductsService.importTerms(subsidiaryId, payload);
	} catch (error) {
		return rejectWithValue(getErrorMessage(error, 'Error al programar la importación de términos'));
	}
});

/**
 * #2 · Consulta el progreso del lote de importación de términos.
 */
export const pollImportTermsStatus = createAsyncThunk<
	ImportTermsStatus,
	{ subsidiaryId: number; params?: ImportTermsStatusQueryParams },
	{ rejectValue: string }
>(
	'woocommerceProducts/pollImportTermsStatus',
	async ({ subsidiaryId, params }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.getImportTermsStatus(subsidiaryId, params);
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al consultar el estado de la importación'),
			);
		}
	},
);

// ==================== SLICE ====================

const woocommerceProductsSlice = createSlice({
	name: 'woocommerceProducts',
	initialState,
	reducers: {
		setImportBatchId: (state, action: PayloadAction<string | null>) => {
			state.importBatchId = action.payload;
		},
		clearImportStatus: (state) => {
			state.importBatchId = null;
			state.importStatus = null;
			state.importing = false;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// #1 · Programar importación
		builder
			.addCase(runImportTerms.pending, (state) => {
				state.importing = true;
				state.error = null;
			})
			.addCase(runImportTerms.fulfilled, (state, action) => {
				state.importing = false;
				state.importBatchId = action.payload.batch_id ?? null;
			})
			.addCase(runImportTerms.rejected, (state, action) => {
				state.importing = false;
				state.error = action.payload ?? 'Error al programar la importación de términos';
			});

		// #2 · Estado del lote
		builder
			.addCase(pollImportTermsStatus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(pollImportTermsStatus.fulfilled, (state, action) => {
				state.loading = false;
				state.importStatus = action.payload;
			})
			.addCase(pollImportTermsStatus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al consultar el estado de la importación';
			});
	},
});

export const { setImportBatchId, clearImportStatus, clearError } = woocommerceProductsSlice.actions;

export default woocommerceProductsSlice.reducer;
