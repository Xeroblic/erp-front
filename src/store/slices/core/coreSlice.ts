import { IComuna, IProvincia, IRegion } from "@/interface/core.interface"
import ApiService from "@/services/ApiService"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"


export interface CoreState {
    loading: boolean
    error: string | undefined
    listaRegiones: IRegion[]
    listaProvincias: IProvincia[]
    listaComunas: IComuna[]
}

const initialState: CoreState = {
    loading: false,
    error: undefined,
    listaRegiones: [],
    listaProvincias: [],
    listaComunas: []
}

export const listaRegionesThunk = createAsyncThunk<IRegion[], undefined, {rejectValue: string}>(
    'core/listaRegionesThunk',
    async (_, {rejectWithValue}) => {
        try {
            const response = await ApiService.fetchData<IRegion[], string>({url: '/api/regiones/', method: 'get'})
            return response.data
        } catch (error: any) {
            return rejectWithValue(error)
        }
    }
)

export const listaProvinciasThunk = createAsyncThunk<IProvincia[], undefined, {rejectValue: string}>(
    'core/listaProvinciasThunk',
    async (_, {rejectWithValue}) => {
        try {
            const response = await ApiService.fetchData<IProvincia[], string>({url: '/api/provincias/', method: 'get'})
            return response.data
        } catch (error: any) {
            return rejectWithValue(error)
        }
    }
)

export const listaComunasThunk = createAsyncThunk<IComuna[], undefined, {rejectValue: string}>(
    'core/listaComunasThunk',
    async (_, {rejectWithValue}) => {
        try {
            const response = await ApiService.fetchData<IComuna[], string>({url: '/api/comunas/', method: 'get'})
            return response.data
        } catch (error: any) {
            return rejectWithValue(error)
        }
    }
)

const coreSlice = createSlice({
    name: `core/coreSlice`,
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder
            .addCase(listaRegionesThunk.pending, (state) => {
                state.loading = true
            })
            .addCase(listaRegionesThunk.fulfilled, (state, action) => {
                state.loading = false
                state.listaRegiones = action.payload
            })
            .addCase(listaRegionesThunk.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(listaProvinciasThunk.pending, (state) => {
                state.loading = true
            })
            .addCase(listaProvinciasThunk.fulfilled, (state, action) => {
                state.loading = false
                state.listaProvincias = action.payload
            })
            .addCase(listaProvinciasThunk.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(listaComunasThunk.pending, (state) => {
                state.loading = true
            })
            .addCase(listaComunasThunk.fulfilled, (state, action) => {
                state.loading = false
                state.listaComunas = action.payload
            })
            .addCase(listaComunasThunk.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const {} = coreSlice.actions

export default coreSlice.reducer