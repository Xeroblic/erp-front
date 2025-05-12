// import { IEmpresa, IUltimasActividadesUsuarioEmpresa, IUsuarioEmpresa } from "@/interface/empresas.interface"
// import ApiService from "@/services/ApiService"
// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"


// export interface EmpresaState {
//     loading: boolean
//     error: string | undefined
//     listaEmpresas: IEmpresa[]
//     listaUsuariosEmpresa: IUsuarioEmpresa[]
//     detalleUsuarioEmpresa: IUsuarioEmpresa | undefined
//     listaUltimasActividades: IUltimasActividadesUsuarioEmpresa[]
//     selectEmpresas: IEmpresa[]
//     detalleEmpresa: IEmpresa | undefined
// }

// const initialState: EmpresaState = {
//     loading: false,
//     error: undefined,
//     listaEmpresas: [],
//     listaUsuariosEmpresa: [],
//     detalleUsuarioEmpresa: undefined,
//     listaUltimasActividades: [],
//     selectEmpresas: [],
//     detalleEmpresa: undefined
    
// }

// export const detalleEmpresaThunk = createAsyncThunk<IEmpresa, {id_empresa: string | number | undefined}, {rejectValue: string}>(
//     'bodega/detalleOrdenCompraThunk',
//     async ({id_empresa}, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IEmpresa>({url: `/api/empresas/${id_empresa}`, method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error.response.data)
//         }
//     }
// )

// export const selectEmpresasThunk = createAsyncThunk<IEmpresa[], undefined, {rejectValue: string}>(
//     'empresa/selectEmpresasThunk',
//     async (_, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IEmpresa[]>({url: '/api/empresas/select-empresas', method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error.response.data)
//         }
//     }
// )

// export const listaEmpresasThunk = createAsyncThunk<IEmpresa[], undefined, {rejectValue: string}>(
//     'empresa/listaEmpresasThunk',
//     async (_, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IEmpresa[]>({url: '/api/empresas/', method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error)
//         }
//     }
// )

// export const listaUsuariosEmpresaThunk = createAsyncThunk<IUsuarioEmpresa[], undefined, {rejectValue: string}>(
//     'empresa/listaUsuariosEmpresaThunk',
//     async (_, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IUsuarioEmpresa[]>({url: `/api/usuarios-empresa/`, method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error.response.data)
//         }
//     }
// )

// export const detalleUsuarioEmpresaPorUserThunk = createAsyncThunk<IUsuarioEmpresa, {id_usuario: string | number | undefined}, {rejectValue: string}>(
//     'empresa/detalleUsuarioEmpresaPorUserThunk',
//     async ({id_usuario}, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IUsuarioEmpresa>({url: `/api/usuarios-empresa/detalle-usuario/?usuario_id=${id_usuario}`, method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error.response.data)
//         }
//     }
// )

// export const listaUltimasActividadesThunk = createAsyncThunk<IUltimasActividadesUsuarioEmpresa[], {id_usuario_empresa: number | string | undefined}, {rejectValue: string}>(
//     'empresa/listaUltimasActividadesThunk',
//     async ({id_usuario_empresa}, {rejectWithValue}) => {
//         try {
//             const response = await ApiService.fetchData<IUltimasActividadesUsuarioEmpresa[]>({url: `/api/usuarios-empresa/${id_usuario_empresa}/ultimas-actividades/`, method: 'get'})
//             return response.data
//         } catch (error: any) {
//             return rejectWithValue(error.response.data)
//         }
//     }
// )

// const empresaSlice = createSlice({
//     name: 'empresa/empresaSlice',
//     initialState,
//     reducers: {},
//     extraReducers(builder) {
//         builder
//             .addCase(listaEmpresasThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(listaEmpresasThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.listaEmpresas = action.payload
//             })
//             .addCase(listaEmpresasThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//             .addCase(listaUsuariosEmpresaThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(listaUsuariosEmpresaThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.listaUsuariosEmpresa = action.payload
//             })
//             .addCase(listaUsuariosEmpresaThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//             .addCase(detalleUsuarioEmpresaPorUserThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(detalleUsuarioEmpresaPorUserThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.detalleUsuarioEmpresa = action.payload
//             })
//             .addCase(detalleUsuarioEmpresaPorUserThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//             .addCase(listaUltimasActividadesThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(listaUltimasActividadesThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.listaUltimasActividades = action.payload
//             })
//             .addCase(listaUltimasActividadesThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//             .addCase(selectEmpresasThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(selectEmpresasThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.selectEmpresas = action.payload
//             })
//             .addCase(selectEmpresasThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//             .addCase(detalleEmpresaThunk.pending, (state) => {
//                 state.loading = true
//             })
//             .addCase(detalleEmpresaThunk.fulfilled, (state, action) => {
//                 state.loading = false
//                 state.detalleEmpresa = action.payload
//             })
//             .addCase(detalleEmpresaThunk.rejected, (state, action) => {
//                 state.loading = false
//                 state.error = action.payload
//             })
//     },
// })

// export const {} = empresaSlice.actions

// export default empresaSlice.reducer

