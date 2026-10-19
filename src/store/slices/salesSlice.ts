import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import type { RootState } from '@/store/rootReducer';
import salesService, {
	type SalesListFilters,
	type PaginatedResponse,
	type PaginationMeta,
	type PaginationLinks,
} from '@/services/salesService';
import type {
	ISale,
	ISaleItem,
	ICloseSaleRequest,
	ICloseSaleResponse,
} from '@/interface/sales.interface';
import {
	isSerialsRequiredError,
	resolveSaleCloseError,
	type ISaleCloseError,
} from '@/utils/saleCloseErrors.util';

type CloseSalePayloadItem = ICloseSaleRequest['items'][number];
type SaleDetail = ISale;
type SaleListItem = ISale;
type SaleItem = ISaleItem;

export interface SaleResourceOwner {
	subsidiaryId: number;
	saleId: number;
}

export interface SalesState {
	list: SaleListItem[];
	meta: PaginationMeta | null;
	links: PaginationLinks | null;
	detail: SaleDetail | null;
	items: SaleItem[];
	detailOwner: SaleResourceOwner | null;
	itemsOwner: SaleResourceOwner | null;
	detailRequestId: string | null;
	itemsRequestId: string | null;
	detailLoading: boolean;
	itemsLoading: boolean;
	detailError: string | null;
	itemsError: string | null;
	listSubsidiaryId: number | null;
	loading: boolean;
	error?: string | null;
}

const initialState: SalesState = {
	list: [],
	meta: null,
	links: null,
	detail: null,
	items: [],
	detailOwner: null,
	itemsOwner: null,
	detailRequestId: null,
	itemsRequestId: null,
	detailLoading: false,
	itemsLoading: false,
	detailError: null,
	itemsError: null,
	listSubsidiaryId: null,
	loading: false,
	error: null,
};

const getErrorMessage = (err: unknown, fallback: string): string => {
	if (typeof err === 'string') return err;
	if (err && typeof err === 'object') {
		const maybeResponse = (
			err as { response?: { data?: { message?: string; errors?: string[] } } }
		).response;
		const msg = maybeResponse?.data?.message || maybeResponse?.data?.errors?.[0];
		if (msg) return msg;
	}
	return fallback;
};

export const loadSalesList = createAsyncThunk<
	PaginatedResponse<SaleListItem>,
	{ subsidiaryId: number; filters?: SalesListFilters },
	{ rejectValue: string }
>('salesModule/loadSalesList', async ({ subsidiaryId, filters = {} }, { rejectWithValue }) => {
	try {
		// Usar fetchSalesPage para server-side pagination
		const result = await salesService.fetchSalesPage(subsidiaryId, filters);
		return result;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, 'Error al cargar ventas'));
	}
});

export const loadSaleDetail = createAsyncThunk<
	SaleDetail,
	{ subsidiaryId: number; saleId: number },
	{ rejectValue: string }
>('salesModule/loadSaleDetail', async ({ subsidiaryId, saleId }, { rejectWithValue }) => {
	try {
		const data = await salesService.fetchSaleDetail(subsidiaryId, saleId);
		return data;
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, 'Error al cargar detalle de venta'));
	}
});

export const loadSaleItems = createAsyncThunk<
	SaleItem[],
	{ subsidiaryId: number; saleId: number },
	{ rejectValue: string }
>('salesModule/loadSaleItems', async ({ subsidiaryId, saleId }, { rejectWithValue }) => {
	try {
		const data = await salesService.fetchSaleItems(subsidiaryId, saleId);
		return data ?? [];
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, 'Error al cargar ítems de la venta'));
	}
});

/** Rechaza con el error tipado: el 409 de stock y el 422 de series se leen por `code`/`context`. */
export const closeSaleThunk = createAsyncThunk<
	ICloseSaleResponse,
	{ subsidiaryId: number; saleId: number; items: CloseSalePayloadItem[] },
	{ rejectValue: ISaleCloseError }
>('salesModule/closeSale', async ({ subsidiaryId, saleId, items }, { rejectWithValue }) => {
	try {
		return await salesService.closeSale(subsidiaryId, saleId, { items });
	} catch (err: unknown) {
		return rejectWithValue(resolveSaleCloseError(err));
	}
});

const ownsSale = (actual: SaleResourceOwner | null | undefined, expected: SaleResourceOwner) =>
	actual?.subsidiaryId === expected.subsidiaryId && actual.saleId === expected.saleId;

const salesSlice = createSlice({
	name: 'salesModule',
	initialState,
	reducers: {
		clearError(state) {
			state.error = null;
		},
		clearDetail(state) {
			state.detail = null;
			state.items = [];
			state.detailOwner = null;
			state.itemsOwner = null;
			state.detailRequestId = null;
			state.itemsRequestId = null;
			state.detailLoading = false;
			state.itemsLoading = false;
			state.detailError = null;
			state.itemsError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// List
			.addCase(loadSalesList.pending, (state, action) => {
				state.loading = true;
				state.error = null;
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
				state.list = [];
				state.meta = null;
				state.links = null;
			})
			.addCase(loadSalesList.fulfilled, (state, action) => {
				if (state.listSubsidiaryId !== action.meta.arg.subsidiaryId) return;
				state.loading = false;
				state.list = action.payload.data;
				state.meta = action.payload.meta;
				state.links = action.payload.links;
			})
			.addCase(loadSalesList.rejected, (state, action) => {
				if (state.listSubsidiaryId !== action.meta.arg.subsidiaryId) return;
				state.loading = false;
				state.error = action.payload || 'Error al cargar ventas';
			})
			// Detail and items have independent request owners: resolving one cannot
			// complete the other or populate another sale after navigation.
			// Releer la misma venta conserva lo visible: sólo otra venta parte en blanco.
			.addCase(loadSaleDetail.pending, (state, action) => {
				if (!ownsSale(state.detailOwner, action.meta.arg)) state.detail = null;
				state.detailOwner = action.meta.arg;
				state.detailRequestId = action.meta.requestId;
				state.detailLoading = true;
				state.detailError = null;
			})
			.addCase(loadSaleDetail.fulfilled, (state, action) => {
				if (state.detailRequestId !== action.meta.requestId) return;
				state.detailLoading = false;
				state.detail = action.payload;
			})
			.addCase(loadSaleDetail.rejected, (state, action) => {
				if (state.detailRequestId !== action.meta.requestId) return;
				state.detailLoading = false;
				state.detail = null;
				state.detailError = action.payload || 'Error al cargar detalle de venta';
			})
			.addCase(loadSaleItems.pending, (state, action) => {
				if (!ownsSale(state.itemsOwner, action.meta.arg)) state.items = [];
				state.itemsOwner = action.meta.arg;
				state.itemsRequestId = action.meta.requestId;
				state.itemsLoading = true;
				state.itemsError = null;
			})
			.addCase(loadSaleItems.fulfilled, (state, action) => {
				if (state.itemsRequestId !== action.meta.requestId) return;
				state.itemsLoading = false;
				state.items = action.payload;
			})
			.addCase(loadSaleItems.rejected, (state, action) => {
				if (state.itemsRequestId !== action.meta.requestId) return;
				state.itemsLoading = false;
				state.items = [];
				state.itemsError = action.payload || 'Error al cargar ítems de la venta';
			})
			// Close sale
			.addCase(closeSaleThunk.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				closeSaleThunk.fulfilled,
				(state, action: PayloadAction<ICloseSaleResponse>) => {
					state.loading = false;
					toast.success(action.payload?.message || 'Venta cerrada correctamente');
				},
			)
			.addCase(closeSaleThunk.rejected, (state, action) => {
				state.loading = false;
				const msg = action.payload?.message ?? 'Error al cerrar la venta';
				state.error = msg;
				// Faltar series no es un fallo: quien llamó abre el formulario de series.
				if (action.payload && isSerialsRequiredError(action.payload)) return;
				toast.error(msg);
			});
	},
});

export const { clearError, clearDetail } = salesSlice.actions;

// Selectors
const selectModule = (state: RootState): SalesState | undefined =>
	(state as unknown as { salesModule?: SalesState }).salesModule;

export const selectSalesList = (state: RootState) => selectModule(state)?.list ?? [];
export const selectSalesListSubsidiaryId = (state: RootState) =>
	selectModule(state)?.listSubsidiaryId ?? null;
export const selectSalesMeta = (state: RootState) => selectModule(state)?.meta ?? null;
export const selectSalesLinks = (state: RootState) => selectModule(state)?.links ?? null;
const EMPTY_ITEMS: SaleItem[] = [];
export const selectSaleDetail = (state: RootState, owner?: SaleResourceOwner) => {
	const module = selectModule(state);
	return !owner || ownsSale(module?.detailOwner, owner) ? (module?.detail ?? null) : null;
};
export const selectSaleItems = (state: RootState, owner?: SaleResourceOwner) => {
	const module = selectModule(state);
	return !owner || ownsSale(module?.itemsOwner, owner)
		? (module?.items ?? EMPTY_ITEMS)
		: EMPTY_ITEMS;
};
export const selectSalesLoading = (state: RootState, owner?: SaleResourceOwner) => {
	const module = selectModule(state);
	if (!owner) return Boolean(module?.loading);
	return (
		!ownsSale(module?.detailOwner, owner) ||
		!ownsSale(module?.itemsOwner, owner) ||
		Boolean(module?.detailLoading || module?.itemsLoading)
	);
};
export const selectSalesError = (state: RootState) => selectModule(state)?.error ?? null;
/** Fallo al leer la ficha o sus ítems de esta venta; `null` si no es suya o no falló. */
export const selectSaleLoadError = (state: RootState, owner: SaleResourceOwner) => {
	const module = selectModule(state);
	const detailError = ownsSale(module?.detailOwner, owner) ? module?.detailError : null;
	const itemsError = ownsSale(module?.itemsOwner, owner) ? module?.itemsError : null;
	return detailError ?? itemsError ?? null;
};

export default salesSlice.reducer;
