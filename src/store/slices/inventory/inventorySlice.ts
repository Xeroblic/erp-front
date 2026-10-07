import { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import ApiService from '@/services/ApiService';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface IInventoryMovementsResponse {
	data: IInventoryMovement[];
	links: {
		first: string | null;
		last: string | null;
		prev: string | null;
		next: string | null;
	};
	meta: {
		current_page: number;
		from: number | null;
		last_page: number;
		path: string;
		per_page: number;
		to: number | null;
		total: number;
	};
}

export interface IInventoryPagination {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	perPage: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface IInventoryFilters {
	occurred_from?: string;
	occurred_to?: string;
	q?: string;
	warehouse_id?: number;
	movement_type?: string;
}

export interface IInventoryState {
	loading: boolean;
	error: string | undefined;
	listaMovimientoSucursal: IInventoryMovement[];
	pagination: IInventoryPagination;
	listRequestId: string | null;
}

const initialState: IInventoryState = {
	loading: false,
	error: undefined,
	listaMovimientoSucursal: [],
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		perPage: 20,
		hasNextPage: false,
		hasPrevPage: false,
	},
	listRequestId: null,
};

export interface FetchMovimientosParams {
	branch_id: number;
	page?: number;
	per_page?: number;
	occurred_from?: string;
	occurred_to?: string;
	q?: string;
	warehouse_id?: number;
	movement_type?: string;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const getErrorMessage = (error: unknown, fallback: string): string => {
	const message = asRecord(asRecord(asRecord(error)?.response)?.data)?.message;
	return typeof message === 'string' && message.trim() ? message : fallback;
};

export const fetchListaMovimientoSucursalThunk = createAsyncThunk<
	IInventoryMovementsResponse,
	FetchMovimientosParams & { append?: boolean },
	{ rejectValue: string }
>('inventario/listaMovimientoSucursal', async (params, { rejectWithValue, signal }) => {
	try {
		const {
			branch_id: branchId,
			page = 1,
			per_page: perPage = 20,
			append,
			...filters
		} = params;

		const queryParams = new URLSearchParams({
			page: page.toString(),
			per_page: perPage.toString(),
		});

		if (filters.occurred_from) queryParams.append('occurred_from', filters.occurred_from);
		if (filters.occurred_to) queryParams.append('occurred_to', filters.occurred_to);
		if (filters.q) queryParams.append('q', filters.q);
		if (filters.warehouse_id)
			queryParams.append('warehouse_id', filters.warehouse_id.toString());
		if (filters.movement_type) queryParams.append('movement_type', filters.movement_type);

		const response = await ApiService.fetchData<IInventoryMovementsResponse>({
			url: `/branches/${branchId}/inventory-movements?${queryParams.toString()}`,
			method: 'get',
			signal,
		});
		return response.data;
	} catch (error) {
		if (signal.aborted) throw error;
		return rejectWithValue(getErrorMessage(error, 'Error al cargar movimientos'));
	}
});

const inventorySlice = createSlice({
	name: 'inventario',
	initialState,
	reducers: {
		clearListaMovimientoSucursal: (state) => {
			state.listaMovimientoSucursal = [];
			state.pagination = initialState.pagination;
			state.loading = false;
			state.error = undefined;
			state.listRequestId = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListaMovimientoSucursalThunk.pending, (state, action) => {
				state.loading = true;
				state.error = undefined;
				state.listRequestId = action.meta.requestId;
			})
			.addCase(fetchListaMovimientoSucursalThunk.fulfilled, (state, action) => {
				if (state.listRequestId !== action.meta.requestId) return;
				state.loading = false;
				if (action.meta.arg.append) {
					state.listaMovimientoSucursal = [
						...state.listaMovimientoSucursal,
						...action.payload.data,
					];
				} else {
					state.listaMovimientoSucursal = action.payload.data;
				}
				state.pagination = {
					currentPage: action.payload.meta.current_page,
					totalPages: action.payload.meta.last_page,
					totalItems: action.payload.meta.total,
					perPage: action.payload.meta.per_page,
					hasNextPage: action.payload.links.next !== null,
					hasPrevPage: action.payload.links.prev !== null,
				};
			})
			.addCase(fetchListaMovimientoSucursalThunk.rejected, (state, action) => {
				if (state.listRequestId !== action.meta.requestId) return;
				state.loading = false;
				// Un «cargar más» fallido o cancelado no invalida las páginas ya cargadas.
				if (action.meta.aborted || action.meta.arg.append) return;
				state.error = action.payload;
				state.listaMovimientoSucursal = [];
			});
	},
});

export const selectMovimientosSucursal = (state: RootState) =>
	state.inventario.listaMovimientoSucursal;
export const selectInventarioPagination = (state: RootState) => state.inventario.pagination;
export const selectInventarioLoading = (state: RootState) => state.inventario.loading;
export const selectInventarioError = (state: RootState) => state.inventario.error;

export const { clearListaMovimientoSucursal } = inventorySlice.actions;
export default inventorySlice.reducer;
