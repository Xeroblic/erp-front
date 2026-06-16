/**
 * Redux Slice para WooCommerce — Productos
 *   #4 `createQuickProductThunk` → crea en ERP + publica
 *   #5 `publishProductThunk`     → publica/actualiza
 *   #6 `unpublishProductThunk`   → despublica
 *   #7 `fetchRemoteState`        → diagnóstico (estado remoto)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
	QuickProductPayload,
	QuickProductResponse,
	WooProduct,
	WooSyncStockPayload,
	WooProductActionResponse,
	WooRemoteState,
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
	/** Productos vinculados/publicados en WooCommerce (#3, #4). */
	products: WooProduct[];
	/** Estado remoto del último diagnóstico (#7). */
	remoteState: WooRemoteState | null;
	/** Creando un producto rápido (#4). */
	creating: boolean;
	/** Consultando el estado remoto (#7). */
	remoteLoading: boolean;
	/** ID de producto con una acción por fila en curso (#5,#6,#8,#9,#10). */
	syncingId: number | null;
	error: string | null;
}

const initialState: WooProductsState = {
	products: [],
	remoteState: null,
	creating: false,
	remoteLoading: false,
	syncingId: null,
	error: null,
};

// ==================== THUNKS ====================

/**
 * #4 · Creación rápida de producto (ERP + publicación en Woo).
 */
export const createQuickProductThunk = createAsyncThunk<
	QuickProductResponse,
	{ subsidiaryId: number; payload: QuickProductPayload },
	{ rejectValue: string }
>(
	'woocommerceProducts/createQuickProduct',
	async ({ subsidiaryId, payload }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.createQuickProduct(subsidiaryId, payload);
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, 'Error al crear el producto rápido'));
		}
	},
);

/**
 * #5 · Publicar / actualizar el producto en WooCommerce.
 */
export const publishProductThunk = createAsyncThunk<
	{ productId: number; response: WooProductActionResponse },
	{ subsidiaryId: number; productId: number; payload?: WooSyncStockPayload },
	{ rejectValue: string }
>(
	'woocommerceProducts/publishProduct',
	async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.publishProduct(
				subsidiaryId,
				productId,
				payload,
			);
			return { productId, response };
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, 'Error al publicar el producto'));
		}
	},
);

/**
 * #6 · Despublicar el producto en WooCommerce.
 */
export const unpublishProductThunk = createAsyncThunk<
	{ productId: number; response: WooProductActionResponse },
	{ subsidiaryId: number; productId: number; payload?: WooSyncStockPayload },
	{ rejectValue: string }
>(
	'woocommerceProducts/unpublishProduct',
	async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.unpublishProduct(
				subsidiaryId,
				productId,
				payload,
			);
			return { productId, response };
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, 'Error al despublicar el producto'));
		}
	},
);

/**
 * #7 · Consultar el estado remoto del producto (diagnóstico).
 */
export const fetchRemoteState = createAsyncThunk<
	WooRemoteState,
	{ subsidiaryId: number; productId: number },
	{ rejectValue: string }
>(
	'woocommerceProducts/fetchRemoteState',
	async ({ subsidiaryId, productId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.getProductRemoteState(subsidiaryId, productId);
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, 'Error al consultar el estado remoto'));
		}
	},
);

// ==================== SLICE ====================

const woocommerceProductsSlice = createSlice({
	name: 'woocommerceProducts',
	initialState,
	reducers: {
		setSyncingId: (state, action: PayloadAction<number | null>) => {
			state.syncingId = action.payload;
		},
		clearRemoteState: (state) => {
			state.remoteState = null;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// #4 · Creación rápida de producto
		builder
			.addCase(createQuickProductThunk.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createQuickProductThunk.fulfilled, (state, action) => {
				state.creating = false;
				if (action.payload.data) {
					state.products.unshift(action.payload.data);
				}
			})
			.addCase(createQuickProductThunk.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload ?? 'Error al crear el producto rápido';
			});

		// #5 · Publicar producto
		builder
			.addCase(publishProductThunk.pending, (state, action) => {
				state.syncingId = action.meta.arg.productId;
				state.error = null;
			})
			.addCase(publishProductThunk.fulfilled, (state, action) => {
				state.syncingId = null;
				const updated = action.payload.response.data;
				if (updated) {
					const idx = state.products.findIndex((p) => p.id === action.payload.productId);
					if (idx !== -1) state.products[idx] = updated;
				}
			})
			.addCase(publishProductThunk.rejected, (state, action) => {
				state.syncingId = null;
				state.error = action.payload ?? 'Error al publicar el producto';
			});

		// #6 · Despublicar producto
		builder
			.addCase(unpublishProductThunk.pending, (state, action) => {
				state.syncingId = action.meta.arg.productId;
				state.error = null;
			})
			.addCase(unpublishProductThunk.fulfilled, (state, action) => {
				state.syncingId = null;
				const updated = action.payload.response.data;
				if (updated) {
					const idx = state.products.findIndex((p) => p.id === action.payload.productId);
					if (idx !== -1) state.products[idx] = updated;
				}
			})
			.addCase(unpublishProductThunk.rejected, (state, action) => {
				state.syncingId = null;
				state.error = action.payload ?? 'Error al despublicar el producto';
			});

		// #7 · Estado remoto (diagnóstico)
		builder
			.addCase(fetchRemoteState.pending, (state) => {
				state.remoteLoading = true;
				state.error = null;
			})
			.addCase(fetchRemoteState.fulfilled, (state, action) => {
				state.remoteLoading = false;
				state.remoteState = action.payload;
			})
			.addCase(fetchRemoteState.rejected, (state, action) => {
				state.remoteLoading = false;
				state.error = action.payload ?? 'Error al consultar el estado remoto';
			});
	},
});

export const { setSyncingId, clearRemoteState, clearError } = woocommerceProductsSlice.actions;

export default woocommerceProductsSlice.reducer;
