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

export interface IInventoryState {
	loading: boolean;
	error: string | undefined;
	listaMovimientoSucursal: IInventoryMovement[];
	detalleMovimientoSucursal: IInventoryMovement | undefined;
	pagination: IInventoryPagination;
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
}

export const fetchListaMovimientoSucursalThunk = createAsyncThunk<
	IInventoryMovementsResponse,
	{ branch_id: number; page?: number; per_page?: number },
	{ rejectValue: string }
>(
	'inventario/listaMovimientoSucursal',
	async ({ branch_id, page = 1, per_page = 20 }, { rejectWithValue }) => {
		try {
			const queryParams = new URLSearchParams({
				page: page.toString(),
				per_page: per_page.toString(),
			});

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
					url: `/inventario/branches/${branch_id}/inventory-movements/${movement_id}`,
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
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListaMovimientoSucursalThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchListaMovimientoSucursalThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.listaMovimientoSucursal = action.payload.data;
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

export const { clearDetalleMovimientoSucursal, clearListaMovimientoSucursal, setPage } = inventorySlice.actions;
export default inventorySlice.reducer;