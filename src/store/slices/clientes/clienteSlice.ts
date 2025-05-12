import { ICliente } from "@/interface/clientes.interface";
import ApiService from "@/services/ApiService";
import { createAsyncThunk, createSlice, isRejectedWithValue } from "@reduxjs/toolkit";


export interface ClienteState{
    loadding: boolean;
    error: string | undefined;
    listaClientes: ICliente[];
    detalleCliente: ICliente | undefined;
}

const initialState: ClienteState = {
    loadding: false,
    error: undefined,
    listaClientes: [],
    detalleCliente: undefined
}

export const listaClientesThunk = createAsyncThunk<ICliente[], undefined, {rejectValue: string}>(
    'clientes/listaClientes',
    async (_, {rejectWithValue}) =>{
        try {
            const response = await ApiService.fetchData<ICliente[]>({url: '/api/clientes/', method: 'get'})
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.response.data)
        }
    }
)


export const detalleClienteThunk = createAsyncThunk<ICliente, {id_cliente: number | string | undefined}, {rejectValue: string}>(
    'clientes/detalleCliente',
    async ({id_cliente}, {rejectWithValue}) => {
        try {
            const response = await ApiService.fetchData<ICliente>({url: `/api/clientes/${id_cliente}/`, method: 'get'})
            return response.data
        } catch (error: any) {
            return rejectWithValue(error.response.data)
        }
    }
)



const clienteSlice = createSlice({
    name: 'clientes',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(listaClientesThunk.pending, (state) => {
                state.loadding = true
            })
            .addCase(listaClientesThunk.fulfilled, (state, action) => {
                state.loadding = false
                state.listaClientes = action.payload
            })
            .addCase(listaClientesThunk.rejected, (state, action) => {
                state.loadding = false
                if (isRejectedWithValue(action.payload)) {
                    state.error = action.payload
                }
            })
            .addCase(detalleClienteThunk.pending, (state) => {
                state.loadding = true
            })
            .addCase(detalleClienteThunk.fulfilled, (state, action) => {
                state.loadding = false
                state.detalleCliente = action.payload
            })
            .addCase(detalleClienteThunk.rejected, (state, action) => {
                state.loadding = false
                if (isRejectedWithValue(action.payload)) {
                    state.error = action.payload
                }
            })
    }
})

export const {} = clienteSlice.actions
export default clienteSlice.reducer