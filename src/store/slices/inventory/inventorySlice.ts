import { IInventoryMovement } from "@/interface/inventoryMovements.interface";
import ApiService from "@/services/ApiService";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

// Interfaz para la respuesta paginada del API
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

// Interfaz para los filtros de búsqueda
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
	detalleMovimientoSucursal: IInventoryMovement | undefined;
	pagination: IInventoryPagination;
	filters: IInventoryFilters;
}

const initialState: IInventoryState = {
	loading: false,
	error: undefined,
	listaMovimientoSucursal: [],
	detalleMovimientoSucursal: undefined,
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		perPage: 20,
		hasNextPage: false,
		hasPrevPage: false,
	},
	filters: {},
}

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

export const fetchListaMovimientoSucursalThunk = createAsyncThunk<
	IInventoryMovementsResponse,
	FetchMovimientosParams & { append?: boolean },
	{ rejectValue: string }
>(
	'inventario/listaMovimientoSucursal',
	async (params, { rejectWithValue }) => {
		try {
			const { branch_id, page = 1, per_page = 20, append, ...filters } = params;
			
			const queryParams = new URLSearchParams({
				page: page.toString(),
				per_page: per_page.toString(),
			});

			// Agregar filtros opcionales
			if (filters.occurred_from) queryParams.append('occurred_from', filters.occurred_from);
			if (filters.occurred_to) queryParams.append('occurred_to', filters.occurred_to);
			if (filters.q) queryParams.append('q', filters.q);
			if (filters.warehouse_id) queryParams.append('warehouse_id', filters.warehouse_id.toString());
			if (filters.movement_type) queryParams.append('movement_type', filters.movement_type);

			const response = await ApiService.fetchData<IInventoryMovementsResponse>(
				{
					url: `/branches/${branch_id}/inventory-movements?${queryParams.toString()}`,
					method: 'get',
				}
			)
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al cargar movimientos');
		}
	}
)

export const fetchDetalleMovimientoSucursalThunk = createAsyncThunk<IInventoryMovement, {branch_id: number, movement_id: number}, {rejectValue: string}>(
	'inventario/detalleMovimientoSucursal',
	async ({branch_id, movement_id}, {rejectWithValue}) => {
		try {
			const response = await ApiService.fetchData<IInventoryMovement>(
				{
					url: `/branches/${branch_id}/inventory-movements/${movement_id}`,
					method: 'get',
				}
			)
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Error al cargar detalle');
		}
	}
)


const inventorySlice = createSlice({
	name: 'inventario',
	initialState,
	reducers: {
		clearDetalleMovimientoSucursal: (state) => {
			state.detalleMovimientoSucursal = undefined;
		},
		clearListaMovimientoSucursal: (state) => {
			state.listaMovimientoSucursal = [];
			state.pagination = initialState.pagination;
		},
		setPage: (state, action) => {
			state.pagination.currentPage = action.payload;
		},
		setFilters: (state, action) => {
			state.filters = action.payload;
		},
		clearFilters: (state) => {
			state.filters = {};
		},
		appendMovimientos: (state, action) => {
			state.listaMovimientoSucursal = [...state.listaMovimientoSucursal, ...action.payload];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListaMovimientoSucursalThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchListaMovimientoSucursalThunk.fulfilled, (state, action) => {
				state.loading = false;
				// Si es append (cargar más), agregar a la lista existente
				const isAppend = action.meta.arg.append;
				if (isAppend) {
					state.listaMovimientoSucursal = [...state.listaMovimientoSucursal, ...action.payload.data];
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
				state.loading = false;
				state.error = action.payload;
				state.listaMovimientoSucursal = [];
			})
			.addCase(fetchDetalleMovimientoSucursalThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchDetalleMovimientoSucursalThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.detalleMovimientoSucursal = action.payload;
			})
			.addCase(fetchDetalleMovimientoSucursalThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})
	}
})

// Selectors
export const selectMovimientosSucursal = (state: RootState) => state.inventario.listaMovimientoSucursal;
export const selectInventarioPagination = (state: RootState) => state.inventario.pagination;
export const selectInventarioLoading = (state: RootState) => state.inventario.loading;
export const selectInventarioError = (state: RootState) => state.inventario.error;
export const selectInventarioFilters = (state: RootState) => state.inventario.filters;

export const { clearDetalleMovimientoSucursal, clearListaMovimientoSucursal, setPage, setFilters, clearFilters } = inventorySlice.actions;
export default inventorySlice.reducer;