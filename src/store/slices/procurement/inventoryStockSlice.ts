import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
	IInventoryAdjustment,
	IInventoryAdjustmentPayload,
	IInventoryDocumentAllocation,
	IInventoryDocumentAllocationPayload,
	IInventoryStockListParams,
	IInventoryOriginsParams,
	IInventoryStockResponse,
	IInventoryOriginsResponse,
	IWarehouseStockMovement,
	IWarehouseStockMovementPayload,
} from '@/interface/procurement.interface';
import {
	createInventoryAdjustment,
	createInventoryDocumentAllocation,
	createWarehouseStockMovement,
	listAdjustmentStock,
	listInventoryStock,
	listInventoryOrigins,
	listTransferStock,
} from '@/services/procurement/inventoryStock.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';

interface StockRequest {
	branchId: number;
	ownerContext: string;
	params: IInventoryStockListParams;
	/**
	 * Ajuste y traslado leen su stock con su propia bandera (`listAdjustmentStock`,
	 * `listTransferStock`); sin fuente, la del resto de Inventario.
	 */
	source?: TInventoryStockSource;
}

export type TInventoryStockSource = 'adjustment' | 'transfer';

/** Se resuelve al pedir, no al cargar el módulo: cada consumidor lee su fuente vigente. */
const stockListerFor = (source: TInventoryStockSource | undefined) => {
	if (source === 'adjustment') return listAdjustmentStock;
	if (source === 'transfer') return listTransferStock;
	return listInventoryStock;
};
interface OriginsRequest extends Omit<StockRequest, 'params'> {
	productId: number;
	params: IInventoryOriginsParams;
}

/** Includes the mounted owner's identity, so reopening never displays an old response. */
export const inventoryStockQueryKey = (request: StockRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.params]);
export const inventoryOriginsQueryKey = (request: OriginsRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.productId, request.params]);

/*
 * Stock, procedencias, ajuste, traslado y documentación posterior ya tienen
 * ruta real: ninguno se condiciona a la bandera de datos simulados.
 */
export const fetchInventoryStock = createAsyncThunk<
	IInventoryStockResponse,
	StockRequest,
	{ rejectValue: string }
>('inventoryStock/list', async ({ branchId, params, source }, { signal, rejectWithValue }) => {
	try {
		return await stockListerFor(source)(branchId, params, signal);
	} catch (error: unknown) {
		return rejectWithValue(getProcurementErrorMessage(error, 'No pudimos cargar el stock.'));
	}
});
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
);

interface IWriteHeaders {
	idempotencyKey?: string;
}

/**
 * `POST .../document-allocations`: respalda documentalmente stock inicial sin
 * documento. No mueve stock, pero parte el origen en dos: no toca
 * `list`/`origins`, el llamador refresca las procedencias tras confirmar.
 */
export const createInventoryDocumentAllocationThunk = createAsyncThunk<
	IInventoryDocumentAllocation,
	{
		subsidiaryId: number | null;
		branchId: number;
		productId: number;
		payload: IInventoryDocumentAllocationPayload;
		headers?: IWriteHeaders;
	},
	{ rejectValue: unknown }
>(
	'inventoryStock/createDocumentAllocation',
	async ({ subsidiaryId, branchId, productId, payload, headers }, { rejectWithValue }) => {
		if (subsidiaryId === null)
			return rejectWithValue('No se pudo determinar la filial activa.');
		try {
			const response = await createInventoryDocumentAllocation(
				subsidiaryId,
				branchId,
				productId,
				payload,
				headers,
			);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(error);
		}
	},
);

/** `POST B/warehouse-stock-movements`: traslado interno inmediato; tampoco parchea `list`/`origins`. */
export const createWarehouseStockMovementThunk = createAsyncThunk<
	IWarehouseStockMovement,
	{
		branchId: number;
		payload: IWarehouseStockMovementPayload;
		headers?: IWriteHeaders;
	},
	{ rejectValue: unknown }
>(
	'inventoryStock/createWarehouseStockMovement',
	async ({ branchId, payload, headers }, { rejectWithValue }) => {
		try {
			const response = await createWarehouseStockMovement(branchId, payload, headers);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(error);
		}
	},
);

/**
 * `POST B/inventory-adjustments`: ajuste por conteo o corrección. Rechaza con
 * el error crudo para que `useIdempotentWrite` distinga un reintento con la
 * misma clave de una corrección de payload.
 */
export const createInventoryAdjustmentThunk = createAsyncThunk<
	IInventoryAdjustment,
	{
		branchId: number;
		payload: IInventoryAdjustmentPayload;
		headers?: IWriteHeaders;
	},
	{ rejectValue: unknown }
>(
	'inventoryStock/createInventoryAdjustment',
	async ({ branchId, payload, headers }, { rejectWithValue }) => {
		try {
			const response = await createInventoryAdjustment(branchId, payload, headers);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(error);
		}
	},
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
const initialState: InventoryStockState = {
	list: emptyQuery(),
	origins: emptyQuery(),
};
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
