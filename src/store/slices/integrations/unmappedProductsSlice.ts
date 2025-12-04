/**
 * Redux Slice para Productos No Mapeados (Unmapped Products)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
	UnmappedWooCommerceProduct,
	UnmappedProductsQueryParams,
	MappedProductsQueryParams,
	SyncedProductsQueryParams,
	MapProductPayload,
	SyncedProduct,
} from '@/types/integrations.types';
import * as integrationsService from '@/services/integrationsService';

// ==================== STATE ====================

interface UnmappedProductsState {
	unmappedProducts: UnmappedWooCommerceProduct[];
	mappedProducts: UnmappedWooCommerceProduct[];
	syncedProducts: SyncedProduct[];
	selectedProduct: UnmappedWooCommerceProduct | null;
	loading: boolean;
	error: string | null;
	lastFetch: number | null;
}

const initialState: UnmappedProductsState = {
	unmappedProducts: [],
	mappedProducts: [],
	syncedProducts: [],
	selectedProduct: null,
	loading: false,
	error: null,
	lastFetch: null,
};

// ==================== THUNKS ====================

/**
 * Fetch productos no mapeados (por integración o consolidado)
 */
export const fetchUnmappedProducts = createAsyncThunk(
	'unmappedProducts/fetchUnmapped',
	async (
		{
			subsidiaryId,
			integrationId,
			params,
		}: {
			subsidiaryId: number;
			integrationId?: string;
			params?: UnmappedProductsQueryParams;
		},
		{ rejectWithValue },
	) => {
		try {
			const response = integrationId
				? await integrationsService.getUnmappedProducts(subsidiaryId, integrationId, params)
				: await integrationsService.getConsolidatedUnmappedProducts(subsidiaryId, params);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al cargar productos no mapeados',
			);
		}
	},
);

/**
 * Fetch productos mapeados (por integración o consolidado)
 */
export const fetchMappedProducts = createAsyncThunk(
	'unmappedProducts/fetchMapped',
	async (
		{
			subsidiaryId,
			integrationId,
			params,
		}: {
			subsidiaryId: number;
			integrationId?: string;
			params?: MappedProductsQueryParams;
		},
		{ rejectWithValue },
	) => {
		try {
			const response = integrationId
				? await integrationsService.getMappedProducts(subsidiaryId, integrationId, params)
				: await integrationsService.getConsolidatedMappedProducts(subsidiaryId, params);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al cargar productos mapeados',
			);
		}
	},
);

/**
 * Fetch productos sincronizados ERP ↔ WooCommerce
 */
export const fetchSyncedProducts = createAsyncThunk(
	'unmappedProducts/fetchSynced',
	async (
		{
			subsidiaryId,
			integrationId,
			params,
		}: {
			subsidiaryId: number;
			integrationId: string;
			params?: SyncedProductsQueryParams;
		},
		{ rejectWithValue },
	) => {
		try {
			const response = await integrationsService.getSyncedProducts(
				subsidiaryId,
				integrationId,
				params,
			);
			return response.data;
		} catch (error: any) {
			return rejectWithValue(
				error.response?.data?.message || 'Error al cargar productos sincronizados',
			);
		}
	},
);

/**
 * Mapear un producto no mapeado
 */
export const mapProduct = createAsyncThunk(
	'unmappedProducts/map',
	async (
		{
			subsidiaryId,
			integrationId,
			unmappedProductId,
			payload,
		}: {
			subsidiaryId: number;
			integrationId: string;
			unmappedProductId: number;
			payload: MapProductPayload;
		},
		{ rejectWithValue },
	) => {
		try {
			await integrationsService.mapProduct(
				subsidiaryId,
				integrationId,
				unmappedProductId,
				payload,
			);
			return unmappedProductId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al mapear producto');
		}
	},
);

/**
 * Desmapear un producto
 */
export const unmapProduct = createAsyncThunk(
	'unmappedProducts/unmap',
	async (
		{
			subsidiaryId,
			integrationId,
			unmappedProductId,
		}: {
			subsidiaryId: number;
			integrationId: string;
			unmappedProductId: number;
		},
		{ rejectWithValue },
	) => {
		try {
			await integrationsService.unmapProduct(subsidiaryId, integrationId, unmappedProductId);
			return unmappedProductId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al desmapear producto');
		}
	},
);

/**
 * Ignorar un producto no mapeado
 */
export const ignoreProduct = createAsyncThunk(
	'unmappedProducts/ignore',
	async (
		{
			subsidiaryId,
			integrationId,
			unmappedProductId,
		}: {
			subsidiaryId: number;
			integrationId: string;
			unmappedProductId: number;
		},
		{ rejectWithValue },
	) => {
		try {
			await integrationsService.ignoreUnmappedProduct(
				subsidiaryId,
				integrationId,
				unmappedProductId,
			);
			return unmappedProductId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al ignorar producto');
		}
	},
);

// ==================== SLICE ====================

const unmappedProductsSlice = createSlice({
	name: 'unmappedProducts',
	initialState,
	reducers: {
		setSelectedUnmappedProduct: (
			state,
			action: PayloadAction<UnmappedWooCommerceProduct | null>,
		) => {
			state.selectedProduct = action.payload;
		},
		clearUnmappedProducts: (state) => {
			state.unmappedProducts = [];
			state.mappedProducts = [];
			state.syncedProducts = [];
			state.selectedProduct = null;
			state.lastFetch = null;
		},
	},
	extraReducers: (builder) => {
		// Fetch Unmapped
		builder
			.addCase(fetchUnmappedProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchUnmappedProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.unmappedProducts = action.payload;
				state.lastFetch = Date.now();
			})
			.addCase(fetchUnmappedProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Fetch Mapped
		builder
			.addCase(fetchMappedProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMappedProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.mappedProducts = action.payload;
			})
			.addCase(fetchMappedProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Fetch Synced
		builder
			.addCase(fetchSyncedProducts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchSyncedProducts.fulfilled, (state, action) => {
				state.loading = false;
				state.syncedProducts = action.payload;
			})
			.addCase(fetchSyncedProducts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Map Product
		builder
			.addCase(mapProduct.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(mapProduct.fulfilled, (state, action) => {
				state.loading = false;
				state.unmappedProducts = state.unmappedProducts.filter(
					(p) => p.id !== action.payload,
				);
			})
			.addCase(mapProduct.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Unmap Product
		builder
			.addCase(unmapProduct.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(unmapProduct.fulfilled, (state, action) => {
				state.loading = false;
				state.mappedProducts = state.mappedProducts.filter((p) => p.id !== action.payload);
			})
			.addCase(unmapProduct.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});

		// Ignore Product
		builder
			.addCase(ignoreProduct.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(ignoreProduct.fulfilled, (state, action) => {
				state.loading = false;
				state.unmappedProducts = state.unmappedProducts.filter(
					(p) => p.id !== action.payload,
				);
			})
			.addCase(ignoreProduct.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { setSelectedUnmappedProduct, clearUnmappedProducts } = unmappedProductsSlice.actions;

export default unmappedProductsSlice.reducer;
