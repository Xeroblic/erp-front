/**
 * Redux Slice para WooCommerce — Productos / Términos
 *   #1 `runImportTerms`        · #2 `pollImportTermsStatus`
 *   #4 `createQuickProductThunk` · #5 `publishProductThunk`
 *   #6 `unpublishProductThunk`   · #7 `fetchRemoteState`
 *
 * Todas las operaciones aceptan `integrationId` opcional para multi-tienda.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
	ImportTermsPayload,
	ImportTermsResponse,
	ImportTermsStatus,
	ImportTermsStatusQueryParams,
	QuickProductPayload,
	QuickProductResponse,
	WooProduct,
	WooSyncStockPayload,
	WooProductActionResponse,
	WooRemoteState,
	WooProductsQueryParams,
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
	/** Lote activo de importación de términos (#1). */
	importBatchId: string | null;
	/** Progreso/estado del lote (#2). */
	importStatus: ImportTermsStatus | null;
	/** Lanzando el job de importación (#1). */
	importing: boolean;
	/** Creando un producto rápido (#4). */
	creating: boolean;
	/** Consultando el estado del lote (#2). */
	loading: boolean;
	/** Consultando el estado remoto (#7). */
	remoteLoading: boolean;
	/** ID de producto con una acción por fila en curso (#5,#6,#8,#9,#10). */
	syncingId: number | null;
	error: string | null;
}

const initialState: WooProductsState = {
	products: [],
	remoteState: null,
	importBatchId: null,
	importStatus: null,
	importing: false,
	creating: false,
	loading: false,
	remoteLoading: false,
	syncingId: null,
	error: null,
};

// ==================== THUNKS ====================

/**
 * #1 · Programa la importación masiva de términos (categorías/marcas).
 */
export const runImportTerms = createAsyncThunk<
	ImportTermsResponse,
	{ subsidiaryId: number; payload: ImportTermsPayload; integrationId?: string },
	{ rejectValue: string }
>(
	'woocommerceProducts/runImportTerms',
	async ({ subsidiaryId, payload, integrationId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.importTerms(
				subsidiaryId,
				payload,
				integrationId,
			);
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al programar la importación de términos'),
			);
		}
	},
);

/**
 * #2 · Consulta el progreso del lote de importación de términos.
 */
export const pollImportTermsStatus = createAsyncThunk<
	ImportTermsStatus,
	{ subsidiaryId: number; params?: ImportTermsStatusQueryParams; integrationId?: string },
	{ rejectValue: string }
>(
	'woocommerceProducts/pollImportTermsStatus',
	async ({ subsidiaryId, params, integrationId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.getImportTermsStatus(
				subsidiaryId,
				params,
				integrationId,
			);
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al consultar el estado de la importación'),
			);
		}
	},
);

/**
 * #4 · Creación rápida de producto (ERP + publicación en Woo).
 */
export const createQuickProductThunk = createAsyncThunk<
	QuickProductResponse,
	{ subsidiaryId: number; payload: QuickProductPayload; integrationId?: string },
	{ rejectValue: string }
>(
	'woocommerceProducts/createQuickProduct',
	async ({ subsidiaryId, payload, integrationId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.createQuickProduct(
				subsidiaryId,
				payload,
				integrationId,
			);
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
	{
		subsidiaryId: number;
		productId: number;
		payload?: WooSyncStockPayload;
		integrationId?: string;
	},
	{ rejectValue: string }
>(
	'woocommerceProducts/publishProduct',
	async ({ subsidiaryId, productId, payload, integrationId }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.publishProduct(
				subsidiaryId,
				productId,
				payload,
				integrationId,
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
	{
		subsidiaryId: number;
		productId: number;
		payload?: WooSyncStockPayload;
		integrationId?: string;
	},
	{ rejectValue: string }
>(
	'woocommerceProducts/unpublishProduct',
	async ({ subsidiaryId, productId, payload, integrationId }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.unpublishProduct(
				subsidiaryId,
				productId,
				payload,
				integrationId,
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
	{ subsidiaryId: number; productId: number; integrationId?: string },
	{ rejectValue: string }
>(
	'woocommerceProducts/fetchRemoteState',
	async ({ subsidiaryId, productId, integrationId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.getProductRemoteState(
				subsidiaryId,
				productId,
				integrationId,
			);
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, 'Error al consultar el estado remoto'));
		}
	},
);

/**
 * #3 · Obtiene los productos vinculados/sincronizados de WooCommerce.
 */
export const fetchWooProducts = createAsyncThunk<
	WooProduct[],
	{ subsidiaryId: number; params?: WooProductsQueryParams; integrationId?: string },
	{ rejectValue: string }
>(
	'woocommerceProducts/fetchWooProducts',
	async ({ subsidiaryId, params, integrationId }, { rejectWithValue }) => {
		try {
			return await woocommerceProductsService.getWooProducts(
				subsidiaryId,
				params,
				integrationId,
			);
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al obtener los productos de WooCommerce'),
			);
		}
	},
);

/**
 * #8 · Sincroniza el precio de un producto específico en WooCommerce.
 */
export const syncProductPriceThunk = createAsyncThunk<
	{ productId: number; response: WooProductActionResponse },
	{
		subsidiaryId: number;
		productId: number;
		payload?: WooSyncStockPayload;
		integrationId?: string;
	},
	{ rejectValue: string }
>(
	'woocommerceProducts/syncProductPrice',
	async ({ subsidiaryId, productId, payload, integrationId }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.syncProductPrice(
				subsidiaryId,
				productId,
				payload,
				integrationId,
			);
			return { productId, response };
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al sincronizar el precio en WooCommerce'),
			);
		}
	},
);

/**
 * #9 · Sincroniza el stock de un producto específico en WooCommerce.
 */
export const syncProductStockThunk = createAsyncThunk<
	{ productId: number; response: WooProductActionResponse },
	{
		subsidiaryId: number;
		productId: number;
		payload?: WooSyncStockPayload;
		integrationId?: string;
	},
	{ rejectValue: string }
>(
	'woocommerceProducts/syncProductStock',
	async ({ subsidiaryId, productId, payload, integrationId }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.syncProductStock(
				subsidiaryId,
				productId,
				payload,
				integrationId,
			);
			return { productId, response };
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al sincronizar el stock en WooCommerce'),
			);
		}
	},
);

/**
 * #10 · Publica o sincroniza las variaciones de un producto padre.
 */
export const publishChildrenThunk = createAsyncThunk<
	{ productId: number; response: WooProductActionResponse },
	{
		subsidiaryId: number;
		productId: number;
		payload?: WooSyncStockPayload;
		integrationId?: string;
	},
	{ rejectValue: string }
>(
	'woocommerceProducts/publishChildren',
	async ({ subsidiaryId, productId, payload, integrationId }, { rejectWithValue }) => {
		try {
			const response = await woocommerceProductsService.publishProductChildren(
				subsidiaryId,
				productId,
				payload,
				integrationId,
			);
			return { productId, response };
		} catch (error) {
			return rejectWithValue(
				getErrorMessage(error, 'Error al publicar variaciones del producto en WooCommerce'),
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

		// #3 · Obtener productos WooCommerce
		builder
			.addCase(fetchWooProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchWooProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.products = action.payload;
			})
			.addCase(fetchWooProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al obtener los productos de WooCommerce';
			});

		// #8 · Sincronizar precio
		builder
			.addCase(syncProductPriceThunk.pending, (state, action) => {
				state.syncingId = action.meta.arg.productId;
				state.error = null;
			})
			.addCase(syncProductPriceThunk.fulfilled, (state, action) => {
				state.syncingId = null;
				const updated = action.payload.response.data;
				if (updated) {
					const idx = state.products.findIndex((p) => p.id === action.payload.productId);
					if (idx !== -1) state.products[idx] = updated;
				}
			})
			.addCase(syncProductPriceThunk.rejected, (state, action) => {
				state.syncingId = null;
				state.error = action.payload ?? 'Error al sincronizar el precio';
			});

		// #9 · Sincronizar stock
		builder
			.addCase(syncProductStockThunk.pending, (state, action) => {
				state.syncingId = action.meta.arg.productId;
				state.error = null;
			})
			.addCase(syncProductStockThunk.fulfilled, (state, action) => {
				state.syncingId = null;
				const updated = action.payload.response.data;
				if (updated) {
					const idx = state.products.findIndex((p) => p.id === action.payload.productId);
					if (idx !== -1) state.products[idx] = updated;
				}
			})
			.addCase(syncProductStockThunk.rejected, (state, action) => {
				state.syncingId = null;
				state.error = action.payload ?? 'Error al sincronizar el stock';
			});

		// #10 · Publicar variaciones (hijos)
		builder
			.addCase(publishChildrenThunk.pending, (state, action) => {
				state.syncingId = action.meta.arg.productId;
				state.error = null;
			})
			.addCase(publishChildrenThunk.fulfilled, (state, action) => {
				state.syncingId = null;
				const updated = action.payload.response.data;
				if (updated) {
					const idx = state.products.findIndex((p) => p.id === action.payload.productId);
					if (idx !== -1) state.products[idx] = updated;
				}
			})
			.addCase(publishChildrenThunk.rejected, (state, action) => {
				state.syncingId = null;
				state.error = action.payload ?? 'Error al publicar las variaciones';
			});
	},
});

export const { setImportBatchId, clearImportStatus, setSyncingId, clearRemoteState, clearError } =
	woocommerceProductsSlice.actions;

export default woocommerceProductsSlice.reducer;
