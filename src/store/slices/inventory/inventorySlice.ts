import { IInventoryMovement } from "@/interface/inventoryMovements.interface";
import ApiService from "@/services/ApiService";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


export interface IInventoryState {
	loading: boolean;
	error: string | undefined;
	listaMovimientoSucursal: IInventoryMovement[];
	detalleMovimientoSucursal: IInventoryMovement | undefined;
}

const initialState: IInventoryState = {
	loading: false,
	error: undefined,
	listaMovimientoSucursal: [],
	detalleMovimientoSucursal: undefined,
}


export const fetchListaMovimientoSucursalThunk = createAsyncThunk<IInventoryMovement[], {branch_id: number}, {rejectValue: string}>(
	'inventario/listaMovimientoSucursal',
	async ({branch_id}, {rejectWithValue}) => {
		try {
			const response = await ApiService.fetchData<IInventoryMovement[]>(
				{
					url: `/branches/${branch_id}/inventory-movements`,
					method: 'get',
				}
			)
			return response.data;
		} catch (error: any) {
			return rejectWithValue(error.response.data);
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
			return rejectWithValue(error.response.data);
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
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListaMovimientoSucursalThunk.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchListaMovimientoSucursalThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.listaMovimientoSucursal = action.payload;
			})
			.addCase(fetchListaMovimientoSucursalThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
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

export const { clearDetalleMovimientoSucursal } = inventorySlice.actions;
export default inventorySlice.reducer;