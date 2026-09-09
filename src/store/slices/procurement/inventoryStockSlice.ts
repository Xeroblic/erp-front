import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import type {
	IInventoryStockListParams,
	IInventoryOriginsParams,
	IInventoryStockResponse,
	IInventoryOriginsResponse,
} from '@/interface/procurement.interface';
import {
	listInventoryStock,
	listInventoryOrigins,
} from '@/services/procurement/inventoryStock.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';

interface StockRequest {
	branchId: number;
	ownerContext: string;
	params: IInventoryStockListParams;
}
interface OriginsRequest extends Omit<StockRequest, 'params'> {
	productId: number;
	params: IInventoryOriginsParams;
}

/** Includes the mounted owner's identity, so reopening never displays an old response. */
export const inventoryStockQueryKey = (request: StockRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.params]);
export const inventoryOriginsQueryKey = (request: OriginsRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.productId, request.params]);

export const fetchInventoryStock = createAsyncThunk<
	IInventoryStockResponse,
	StockRequest,
	{ rejectValue: string }
>(
	'inventoryStock/list',
	async ({ branchId, params }, { signal, rejectWithValue }) => {
		try {
			return await listInventoryStock(branchId, params, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar el stock.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);
export const fetchInventoryOrigins = createAsyncThunk<
	IInventoryOriginsResponse,
	OriginsRequest,
	{ rejectValue: string }
>(
	'inventoryStock/origins',
	async ({ branchId, productId, params }, { signal, rejectWithValue }) => {
		try {
			return await listInventoryOrigins(branchId, productId, params, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar las procedencias.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);

interface QueryState<T> {
	ownerContext: string | null;
	requestId: string | null;
	response: T | null;
	loading: boolean;
	error: string | null;
}
const emptyQuery = <T>(): QueryState<T> => ({
	ownerContext: null,
	requestId: null,
	response: null,
	loading: false,
	error: null,
});
export interface InventoryStockState {
	list: QueryState<IInventoryStockResponse>;
	origins: QueryState<IInventoryOriginsResponse>;
}
const initialState: InventoryStockState = { list: emptyQuery(), origins: emptyQuery() };
const inventoryStockSlice = createSlice({
	name: 'inventoryStock',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchInventoryStock.pending, (state, action) => {
				state.list = {
					...emptyQuery(),
					ownerContext: inventoryStockQueryKey(action.meta.arg),
					requestId: action.meta.requestId,
					loading: true,
				};
			})
			.addCase(fetchInventoryStock.fulfilled, (state, action) => {
				if (state.list.requestId !== action.meta.requestId) return;
				state.list.response = action.payload;
				state.list.loading = false;
			})
			.addCase(fetchInventoryStock.rejected, (state, action) => {
				if (state.list.requestId !== action.meta.requestId) return;
				state.list.loading = false;
				state.list.response = null;
				state.list.error = action.meta.aborted
					? null
					: (action.payload ?? 'No pudimos cargar el stock.');
			})
			.addCase(fetchInventoryOrigins.pending, (state, action) => {
				state.origins = {
					...emptyQuery(),
					ownerContext: inventoryOriginsQueryKey(action.meta.arg),
					requestId: action.meta.requestId,
					loading: true,
				};
			})
			.addCase(fetchInventoryOrigins.fulfilled, (state, action) => {
				if (state.origins.requestId !== action.meta.requestId) return;
				state.origins.response = action.payload;
				state.origins.loading = false;
			})
			.addCase(fetchInventoryOrigins.rejected, (state, action) => {
				if (state.origins.requestId !== action.meta.requestId) return;
				state.origins.loading = false;
				state.origins.response = null;
				state.origins.error = action.meta.aborted
					? null
					: (action.payload ?? 'No pudimos cargar las procedencias.');
			});
	},
});
export default inventoryStockSlice.reducer;
