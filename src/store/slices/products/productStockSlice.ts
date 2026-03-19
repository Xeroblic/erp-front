import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	IAssignProductPayload,
	IUnassignProductPayload,
	ITransferStockPayload,
	IAdjustStockPayload,
	IBatchAdjustStockPayload,
	IBranchAllocation,
	IProductSerie,
	ICreateSeriePayload,
	IUpdateSerieStatusPayload,
	IStockMovement,
	IFetchStockMovementsParams,
	IStockStateResponse,
	IStockListResponse,
} from '@/interface/stock.interface';

// ---------------------------------------------------------------------------
// Configuración de Tipos de Estado
// ---------------------------------------------------------------------------
export interface ProductStockState {
	allocations: IBranchAllocation[];
	series: IProductSerie[];
	movements: IStockMovement[];

	// Flags (As per user request)
	isAssigning: boolean;
	isUnassigning: boolean;
	isTransferring: boolean;
	isAdjusting: boolean;
	isLoadingAllocations: boolean;
	isLoadingSeries: boolean;
	isCreatingSeries: boolean;
	isUpdatingSerie: boolean;
	isLoadingMovements: boolean;
	isVerifying: boolean;

	error: string | null;
}

const initialState: ProductStockState = {
	allocations: [],
	series: [],
	movements: [],

	isAssigning: false,
	isUnassigning: false,
	isTransferring: false,
	isAdjusting: false,
	isLoadingAllocations: false,
	isLoadingSeries: false,
	isCreatingSeries: false,
	isUpdatingSerie: false,
	isLoadingMovements: false,
	isVerifying: false,

	error: null,
};

// Error Helper genérico
const getApiError = (error: unknown, fallback: string): string => {
	if (error && typeof error === 'object') {
		const obj = error as any;
		if (obj.response?.data?.message) return obj.response.data.message;
		if (obj.message) return obj.message;
	}
	return fallback;
};

// ---------------------------------------------------------------------------
// 11 Thunks para Operaciones de Stock & Series
// Contexto estricto: /subsidiaries/{subsidiaryId}/products/...
// ---------------------------------------------------------------------------

export const assignProduct = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; productId: number; payload: IAssignProductPayload },
	{ rejectValue: string }
>('productStock/assignProduct', async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, IAssignProductPayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/assign`,
			method: 'post',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo asignar el producto'));
	}
});

export const unassignProduct = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; productId: number; payload: IUnassignProductPayload },
	{ rejectValue: string }
>('productStock/unassignProduct', async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, IUnassignProductPayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/unassign`,
			method: 'post',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo desasignar el producto'));
	}
});

export const transferStock = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; productId: number; payload: ITransferStockPayload },
	{ rejectValue: string }
>('productStock/transferStock', async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, ITransferStockPayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/transfer`,
			method: 'post',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo transferir el stock'));
	}
});

export const adjustProductStock = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; productId: number; payload: IAdjustStockPayload },
	{ rejectValue: string }
>('productStock/adjustProductStock', async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, IAdjustStockPayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/adjust`,
			method: 'post',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo ajustar el stock individual'));
	}
});

export const batchAdjustStock = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; payload: IBatchAdjustStockPayload },
	{ rejectValue: string }
>('productStock/batchAdjustStock', async ({ subsidiaryId, payload }, { rejectWithValue }) => {
	try {
		// Ajuste masivo se ejecuta directo a la subsidiaria ({id}/stock-adjustments)
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, IBatchAdjustStockPayload>({
			url: `/subsidiaries/${subsidiaryId}/stock-adjustments`,
			method: 'post',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo aplicar el ajuste masivo'));
	}
});

export const fetchProductAllocations = createAsyncThunk<
	IBranchAllocation[],
	{ subsidiaryId: number; productId: number },
	{ rejectValue: string }
>('productStock/fetchProductAllocations', async ({ subsidiaryId, productId }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockListResponse<IBranchAllocation>>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/allocations`,
			method: 'get',
		});
		return res.data?.data ?? [];
	} catch (error) {
		return rejectWithValue(getApiError(error, 'Error al cargar asignaciones de stock'));
	}
});

export const fetchProductSeries = createAsyncThunk<
	IProductSerie[],
	{ subsidiaryId: number; productId: number; branchId?: number },
	{ rejectValue: string }
>('productStock/fetchProductSeries', async ({ subsidiaryId, productId, branchId }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockListResponse<IProductSerie>>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/series`,
			method: 'get',
			params: branchId ? { branch_id: branchId } : {},
		});
		return res.data?.data ?? [];
	} catch (error) {
		return rejectWithValue(getApiError(error, 'Error al cargar las series'));
	}
});

export const createProductSeries = createAsyncThunk<
	IProductSerie[],
	{ subsidiaryId: number; productId: number; payload: ICreateSeriePayload },
	{ rejectValue: string }
>('productStock/createProductSeries', async ({ subsidiaryId, productId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockListResponse<IProductSerie>, ICreateSeriePayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/series`,
			method: 'post',
			data: payload,
		});
		return res.data?.data ?? [];
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudieron registrar las series'));
	}
});

export const updateSerieStatus = createAsyncThunk<
	unknown,
	{ subsidiaryId: number; productId: number; serieId: number; payload: IUpdateSerieStatusPayload },
	{ rejectValue: string }
>('productStock/updateSerieStatus', async ({ subsidiaryId, productId, serieId, payload }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<unknown>, IUpdateSerieStatusPayload>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/series/${serieId}/status`,
			method: 'patch',
			data: payload,
		});
		return res.data?.data;
	} catch (error) {
		return rejectWithValue(getApiError(error, 'Error al actualizar el estado de la serie'));
	}
});

export const fetchStockMovements = createAsyncThunk<
	IStockMovement[],
	{ subsidiaryId: number; productId: number; params?: IFetchStockMovementsParams },
	{ rejectValue: string }
>('productStock/fetchStockMovements', async ({ subsidiaryId, productId, params }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockListResponse<IStockMovement>>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/movements`,
			method: 'get',
			params,
		});
		return res.data?.data ?? [];
	} catch (error) {
		return rejectWithValue(getApiError(error, 'Error al cargar el historial de movimientos'));
	}
});

export const verifyStockConsistency = createAsyncThunk<
	boolean,
	{ subsidiaryId: number; productId: number },
	{ rejectValue: string }
>('productStock/verifyStockConsistency', async ({ subsidiaryId, productId }, { rejectWithValue }) => {
	try {
		const res = await ApiService.fetchData<IStockStateResponse<boolean>>({
			url: `/subsidiaries/${subsidiaryId}/products/${productId}/verify-stock`,
			method: 'post',
		});
		return Boolean(res.data?.data);
	} catch (error) {
		return rejectWithValue(getApiError(error, 'No se pudo verificar la consistencia del stock'));
	}
});

// ---------------------------------------------------------------------------
// Slice & Reducers
// ---------------------------------------------------------------------------
const productStockSlice = createSlice({
	name: 'productStock',
	initialState,
	reducers: {
		clearStockError: (state) => {
			state.error = null;
		},
		resetStockState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			// Assign
			.addCase(assignProduct.pending, (state) => { state.isAssigning = true; state.error = null; })
			.addCase(assignProduct.fulfilled, (state) => { state.isAssigning = false; })
			.addCase(assignProduct.rejected, (state, action) => { state.isAssigning = false; state.error = action.payload ?? null; })
			
			// Unassign
			.addCase(unassignProduct.pending, (state) => { state.isUnassigning = true; state.error = null; })
			.addCase(unassignProduct.fulfilled, (state) => { state.isUnassigning = false; })
			.addCase(unassignProduct.rejected, (state, action) => { state.isUnassigning = false; state.error = action.payload ?? null; })
			
			// Transfer
			.addCase(transferStock.pending, (state) => { state.isTransferring = true; state.error = null; })
			.addCase(transferStock.fulfilled, (state) => { state.isTransferring = false; })
			.addCase(transferStock.rejected, (state, action) => { state.isTransferring = false; state.error = action.payload ?? null; })
			
			// Adjust 
			.addCase(adjustProductStock.pending, (state) => { state.isAdjusting = true; state.error = null; })
			.addCase(adjustProductStock.fulfilled, (state) => { state.isAdjusting = false; })
			.addCase(adjustProductStock.rejected, (state, action) => { state.isAdjusting = false; state.error = action.payload ?? null; })

			// Batch Adjust 
			.addCase(batchAdjustStock.pending, (state) => { state.isAdjusting = true; state.error = null; })
			.addCase(batchAdjustStock.fulfilled, (state) => { state.isAdjusting = false; })
			.addCase(batchAdjustStock.rejected, (state, action) => { state.isAdjusting = false; state.error = action.payload ?? null; })
			
			// Allocations
			.addCase(fetchProductAllocations.pending, (state) => { state.isLoadingAllocations = true; state.error = null; })
			.addCase(fetchProductAllocations.fulfilled, (state, action) => {
				state.isLoadingAllocations = false;
				state.allocations = action.payload;
			})
			.addCase(fetchProductAllocations.rejected, (state, action) => { state.isLoadingAllocations = false; state.error = action.payload ?? null; })
			
			// Series
			.addCase(fetchProductSeries.pending, (state) => { state.isLoadingSeries = true; state.error = null; })
			.addCase(fetchProductSeries.fulfilled, (state, action) => {
				state.isLoadingSeries = false;
				state.series = action.payload;
			})
			.addCase(fetchProductSeries.rejected, (state, action) => { state.isLoadingSeries = false; state.error = action.payload ?? null; })
			
			// Create Series
			.addCase(createProductSeries.pending, (state) => { state.isCreatingSeries = true; state.error = null; })
			.addCase(createProductSeries.fulfilled, (state) => { state.isCreatingSeries = false; })
			.addCase(createProductSeries.rejected, (state, action) => { state.isCreatingSeries = false; state.error = action.payload ?? null; })
			
			// Update Serie
			.addCase(updateSerieStatus.pending, (state) => { state.isUpdatingSerie = true; state.error = null; })
			.addCase(updateSerieStatus.fulfilled, (state) => { state.isUpdatingSerie = false; })
			.addCase(updateSerieStatus.rejected, (state, action) => { state.isUpdatingSerie = false; state.error = action.payload ?? null; })
			
			// Movements
			.addCase(fetchStockMovements.pending, (state) => { state.isLoadingMovements = true; state.error = null; })
			.addCase(fetchStockMovements.fulfilled, (state, action) => {
				state.isLoadingMovements = false;
				state.movements = action.payload;
			})
			.addCase(fetchStockMovements.rejected, (state, action) => { state.isLoadingMovements = false; state.error = action.payload ?? null; })
			
			// Verify
			.addCase(verifyStockConsistency.pending, (state) => { state.isVerifying = true; state.error = null; })
			.addCase(verifyStockConsistency.fulfilled, (state) => { state.isVerifying = false; })
			.addCase(verifyStockConsistency.rejected, (state, action) => { state.isVerifying = false; state.error = action.payload ?? null; });
	},
});

export const { clearStockError, resetStockState } = productStockSlice.actions;
export default productStockSlice.reducer;
