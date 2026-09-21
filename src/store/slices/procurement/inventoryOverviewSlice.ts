import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import type { RootState } from '@/store';
import type {
	IInventoryOverviewParams,
	IInventoryOverviewResponse,
	IInventoryStockDetailResponse,
	IInventoryStockSummaryResponse,
	IInventoryWarehouseAggregatesResponse,
} from '@/interface/inventoryOverview.interface';
import {
	getInventoryStockDetail,
	getInventoryStockSummary,
	listInventoryOverview,
	listInventoryWarehouseAggregates,
	updateInventoryCriticalThreshold,
} from '@/services/procurement/inventoryOverview.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';

/**
 * Vista unificada de Inventario (`docs/inventario-unificado-contrato.md`).
 * Mismo patrón que `inventoryStockSlice`: cada consulta guarda la clave de
 * quien la pidió (`ownerContext`) y la vista sólo pinta la respuesta si la
 * clave coincide con la suya, así un cambio de sucursal nunca muestra datos
 * de la anterior (ZF-12).
 */

interface IBranchRequest {
	branchId: number;
	ownerContext: string;
}
interface IOverviewRequest extends IBranchRequest {
	params: IInventoryOverviewParams;
}
interface IDetailRequest extends IBranchRequest {
	productId: number;
}

export const inventoryOverviewQueryKey = (request: IOverviewRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.params]);
export const inventoryBranchQueryKey = (request: IBranchRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId]);
export const inventoryDetailQueryKey = (request: IDetailRequest): string =>
	JSON.stringify([request.ownerContext, request.branchId, request.productId]);

export const fetchInventoryOverview = createAsyncThunk<
	IInventoryOverviewResponse,
	IOverviewRequest,
	{ rejectValue: string }
>(
	'inventoryOverview/list',
	async ({ branchId, params }, { signal, rejectWithValue }) => {
		try {
			return await listInventoryOverview(branchId, params, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar el inventario.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);

export const fetchInventorySummary = createAsyncThunk<
	IInventoryStockSummaryResponse,
	IBranchRequest,
	{ rejectValue: string }
>(
	'inventoryOverview/summary',
	async ({ branchId }, { signal, rejectWithValue }) => {
		try {
			return await getInventoryStockSummary(branchId, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar las alertas de inventario.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);

export const fetchInventoryWarehouses = createAsyncThunk<
	IInventoryWarehouseAggregatesResponse,
	IBranchRequest,
	{ rejectValue: string }
>(
	'inventoryOverview/warehouses',
	async ({ branchId }, { signal, rejectWithValue }) => {
		try {
			return await listInventoryWarehouseAggregates(branchId, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar las bodegas.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);

export const fetchInventoryDetail = createAsyncThunk<
	IInventoryStockDetailResponse,
	IDetailRequest,
	{ rejectValue: string }
>(
	'inventoryOverview/detail',
	async ({ branchId, productId }, { signal, rejectWithValue }) => {
		try {
			return await getInventoryStockDetail(branchId, productId, signal);
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos cargar la ficha del producto.'),
			);
		}
	},
	{ condition: () => INVENTORY_STOCK_USE_MOCKS },
);

/**
 * Edición del umbral crítico (§13). No parchea `detail`: el llamador vuelve a
 * pedir la ficha tras confirmar, porque el estado depende del umbral nuevo.
 */
export const updateInventoryThresholdThunk = createAsyncThunk<
	{ product_id: number; critical_stock_threshold: number | null },
	{ productId: number; threshold: number | null },
	{ rejectValue: string }
>(
	'inventoryOverview/updateThreshold',
	async ({ productId, threshold }, { rejectWithValue }) => {
		try {
			const response = await updateInventoryCriticalThreshold(productId, threshold);
			return response.data;
		} catch (error: unknown) {
			return rejectWithValue(
				getProcurementErrorMessage(error, 'No pudimos guardar el umbral.'),
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

export interface InventoryOverviewState {
	list: QueryState<IInventoryOverviewResponse>;
	summary: QueryState<IInventoryStockSummaryResponse>;
	warehouses: QueryState<IInventoryWarehouseAggregatesResponse>;
	detail: QueryState<IInventoryStockDetailResponse>;
	updatingThreshold: boolean;
}

const initialState: InventoryOverviewState = {
	list: emptyQuery(),
	summary: emptyQuery(),
	warehouses: emptyQuery(),
	detail: emptyQuery(),
	updatingThreshold: false,
};

type TQueryName = 'list' | 'summary' | 'warehouses' | 'detail';

const inventoryOverviewSlice = createSlice({
	name: 'inventoryOverview',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		/**
		 * Los cuatro listados comparten ciclo de vida: `pending` reemplaza la
		 * consulta y sólo la última petición (`requestId`) puede resolverla. Un
		 * abort no es un error que mostrar.
		 */
		const pending = (
			state: InventoryOverviewState,
			name: TQueryName,
			ownerContext: string,
			requestId: string,
		) => {
			state[name] = { ...emptyQuery(), ownerContext, requestId, loading: true };
		};
		const rejected = (
			state: InventoryOverviewState,
			name: TQueryName,
			requestId: string,
			aborted: boolean,
			message: string,
		) => {
			if (state[name].requestId !== requestId) return;
			state[name].loading = false;
			state[name].response = null;
			state[name].error = aborted ? null : message;
		};

		builder
			.addCase(fetchInventoryOverview.pending, (state, action) =>
				pending(
					state,
					'list',
					inventoryOverviewQueryKey(action.meta.arg),
					action.meta.requestId,
				),
			)
			.addCase(fetchInventoryOverview.fulfilled, (state, action) => {
				if (state.list.requestId !== action.meta.requestId) return;
				state.list.response = action.payload;
				state.list.loading = false;
			})
			.addCase(fetchInventoryOverview.rejected, (state, action) =>
				rejected(
					state,
					'list',
					action.meta.requestId,
					action.meta.aborted,
					action.payload ?? 'No pudimos cargar el inventario.',
				),
			)
			.addCase(fetchInventorySummary.pending, (state, action) =>
				pending(
					state,
					'summary',
					inventoryBranchQueryKey(action.meta.arg),
					action.meta.requestId,
				),
			)
			.addCase(fetchInventorySummary.fulfilled, (state, action) => {
				if (state.summary.requestId !== action.meta.requestId) return;
				state.summary.response = action.payload;
				state.summary.loading = false;
			})
			.addCase(fetchInventorySummary.rejected, (state, action) =>
				rejected(
					state,
					'summary',
					action.meta.requestId,
					action.meta.aborted,
					action.payload ?? 'No pudimos cargar las alertas de inventario.',
				),
			)
			.addCase(fetchInventoryWarehouses.pending, (state, action) =>
				pending(
					state,
					'warehouses',
					inventoryBranchQueryKey(action.meta.arg),
					action.meta.requestId,
				),
			)
			.addCase(fetchInventoryWarehouses.fulfilled, (state, action) => {
				if (state.warehouses.requestId !== action.meta.requestId) return;
				state.warehouses.response = action.payload;
				state.warehouses.loading = false;
			})
			.addCase(fetchInventoryWarehouses.rejected, (state, action) =>
				rejected(
					state,
					'warehouses',
					action.meta.requestId,
					action.meta.aborted,
					action.payload ?? 'No pudimos cargar las bodegas.',
				),
			)
			.addCase(fetchInventoryDetail.pending, (state, action) =>
				pending(
					state,
					'detail',
					inventoryDetailQueryKey(action.meta.arg),
					action.meta.requestId,
				),
			)
			.addCase(fetchInventoryDetail.fulfilled, (state, action) => {
				if (state.detail.requestId !== action.meta.requestId) return;
				state.detail.response = action.payload;
				state.detail.loading = false;
			})
			.addCase(fetchInventoryDetail.rejected, (state, action) =>
				rejected(
					state,
					'detail',
					action.meta.requestId,
					action.meta.aborted,
					action.payload ?? 'No pudimos cargar la ficha del producto.',
				),
			)
			.addCase(updateInventoryThresholdThunk.pending, (state) => {
				state.updatingThreshold = true;
			})
			.addCase(updateInventoryThresholdThunk.fulfilled, (state) => {
				state.updatingThreshold = false;
			})
			.addCase(updateInventoryThresholdThunk.rejected, (state) => {
				state.updatingThreshold = false;
			});
	},
});

export const selectInventoryUpdatingThreshold = (state: RootState) =>
	state.inventoryOverview.updatingThreshold;

export default inventoryOverviewSlice.reducer;
