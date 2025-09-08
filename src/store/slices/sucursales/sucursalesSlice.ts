// src/store/slices/sucursales/sucursalesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import ApiService from '@/services/ApiService'
import { ISucursal } from '@/interface/empresas.interface'

export interface SucursalesState {
    loading: boolean
    error?: string
    lista: ISucursal[]
    detalle?: ISucursal
    createLoading: boolean
    createError?: string
    updateLoading: boolean
    updateError?: string
    deleteLoading: boolean
    deleteError?: string
}

const initialState: SucursalesState = {
    loading: false,
    error: undefined,
    lista: [],
    detalle: undefined,
    createLoading: false,
    createError: undefined,
    updateLoading: false,
    updateError: undefined,
    deleteLoading: false,
    deleteError: undefined,
}

const normalizeBranchData = (backendData: any): ISucursal => {
    return {
        ...backendData,
        // Mapear campos del backend al formato del frontend
        name: backendData.branch_name || backendData.name || backendData.nombre || '',
        rut: backendData.branch_rut || backendData.rut,
        phone: backendData.branch_phone || backendData.phone,
        address: backendData.branch_address || backendData.address || backendData.direccion,
        email: backendData.branch_email || backendData.email,
        manager_name: backendData.branch_manager_name || backendData.manager_name,
        manager_phone: backendData.branch_manager_phone || backendData.manager_phone,
        manager_email: backendData.branch_manager_email || backendData.manager_email,
        status: backendData.branch_status ?? backendData.status,
        subsidiary_id: backendData.subsidiary_id || backendData.subempresa_id,
        created_at: backendData.branch_created_at || backendData.created_at || new Date().toISOString(),
        updated_at: backendData.branch_updated_at || backendData.updated_at || new Date().toISOString(),
        usuarios: backendData.usuarios || [],
        // Datos adicionales de la subsidiaria si están disponibles
        subsidiary_name: backendData.subsidiary_name,
    }
}

export const fetchMisSucursales = createAsyncThunk<
    ISucursal[],
    void,
    { rejectValue: string }
>(
    'sucursales/fetchMisSucursales',
    async (_, { rejectWithValue }) => {
        try {
            // Intentar desde el endpoint específico de sucursales o desde subsidiarias con branches
            const response = await ApiService.fetchData<{ sucursales?: any[], branches?: any[], subempresas?: any[] }>({
                url: '/my-company/subsidiaries', // Usar endpoint de subsidiarias que incluye branches
                method: 'get',
            })

            // Extraer sucursales desde subsidiarias.branches o desde sucursales directas
            let branchesData: any[] = []
            if (response.data.subempresas) {
                // Extraer todas las sucursales de todas las subsidiarias
                branchesData = response.data.subempresas.flatMap((sub: any) =>
                    (sub.branches || sub.sucursales || []).map((branch: any) => ({
                        ...branch,
                        subsidiary_id: sub.id,
                        subsidiary_name: sub.subsidiary_name || sub.name
                    }))
                )
            } else if (response.data.branches) {
                branchesData = response.data.branches
            } else if (response.data.sucursales) {
                branchesData = response.data.sucursales
            }

            const normalizedBranches = branchesData.map(normalizeBranchData)
            return normalizedBranches
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Error al cargar sucursales')
        }
    }
)

export const fetchSucursalDetail = createAsyncThunk<
    ISucursal,
    number,
    { rejectValue: string }
>(
    'sucursales/fetchSucursalDetail',
    async (sucursalId, { rejectWithValue }) => {
        try {
            const branch = await ApiService.fetchNormalized<ISucursal>({
                url: `/branches/${sucursalId}`,
                method: 'get',
            })
            return normalizeBranchData(branch)
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Error al cargar detalle de sucursal')
        }
    }
)

export const createSucursal = createAsyncThunk<
    ISucursal,
    Partial<ISucursal>,
    { rejectValue: string }
>(
    'sucursales/createSucursal',
    async (sucursalData, { rejectWithValue }) => {
        try {
            const branch = await ApiService.fetchNormalized<ISucursal>({
                url: '/branches',
                method: 'post',
                data: sucursalData,
            })
            return normalizeBranchData(branch)
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Error al crear sucursal')
        }
    }
)

export const updateSucursal = createAsyncThunk<
    ISucursal,
    { id: number; data: Partial<ISucursal> },
    { rejectValue: string }
>(
    'sucursales/updateSucursal',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const branch = await ApiService.fetchNormalized<ISucursal>({
                url: `/branches/${id}`,
                method: 'put',
                data,
            })
            return normalizeBranchData(branch)
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Error al actualizar sucursal')
        }
    }
)

export const deleteSucursal = createAsyncThunk<
    number,
    number,
    { rejectValue: string }
>(
    'sucursales/deleteSucursal',
    async (sucursalId, { rejectWithValue }) => {
        try {
            await ApiService.fetchData<void>({
                url: `/branches/${sucursalId}`,
                method: 'delete',
            })
            return sucursalId
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Error al eliminar sucursal')
        }
    }
)

const sucursalesSlice = createSlice({
    name: 'sucursales',
    initialState,
    reducers: {
        clearDetalle(state) {
            state.detalle = undefined
            state.error = undefined
        },
        clearErrors(state) {
            state.error = undefined
            state.createError = undefined
            state.updateError = undefined
            state.deleteError = undefined
        },
        resetSucursalesState: () => initialState,
    },
    extraReducers: builder => {
        builder
            .addCase(fetchMisSucursales.pending, state => {
                state.loading = true
                state.error = undefined
            })
            .addCase(
                fetchMisSucursales.fulfilled,
                (state, action: PayloadAction<ISucursal[]>) => {
                    state.loading = false
                    state.lista = action.payload
                    state.error = undefined
                }
            )
            .addCase(fetchMisSucursales.rejected, (state, { payload }) => {
                state.loading = false
                state.error = payload
            })

        builder
            .addCase(fetchSucursalDetail.pending, state => {
                state.loading = true
                state.error = undefined
            })
            .addCase(
                fetchSucursalDetail.fulfilled,
                (state, action: PayloadAction<ISucursal>) => {
                    state.loading = false
                    state.detalle = action.payload
                    state.error = undefined
                }
            )
            .addCase(fetchSucursalDetail.rejected, (state, { payload }) => {
                state.loading = false
                state.error = payload
            })

        builder
            .addCase(createSucursal.pending, state => {
                state.createLoading = true
                state.createError = undefined
            })
            .addCase(
                createSucursal.fulfilled,
                (state, action: PayloadAction<ISucursal>) => {
                    state.createLoading = false
                    state.lista.push(action.payload)
                    state.createError = undefined
                }
            )
            .addCase(createSucursal.rejected, (state, { payload }) => {
                state.createLoading = false
                state.createError = payload
            })

        builder
            .addCase(updateSucursal.pending, state => {
                state.updateLoading = true
                state.updateError = undefined
            })
            .addCase(
                updateSucursal.fulfilled,
                (state, action: PayloadAction<ISucursal>) => {
                    state.updateLoading = false
                    const idx = state.lista.findIndex(s => s.id === action.payload.id)
                    if (idx !== -1) state.lista[idx] = action.payload
                    if (state.detalle?.id === action.payload.id) {
                        state.detalle = action.payload
                    }
                    state.updateError = undefined
                }
            )
            .addCase(updateSucursal.rejected, (state, { payload }) => {
                state.updateLoading = false
                state.updateError = payload
            })

        builder
            .addCase(deleteSucursal.pending, state => {
                state.deleteLoading = true
                state.deleteError = undefined
            })
            .addCase(
                deleteSucursal.fulfilled,
                (state, action: PayloadAction<number>) => {
                    state.deleteLoading = false
                    state.lista = state.lista.filter(s => s.id !== action.payload)
                    if (state.detalle?.id === action.payload) {
                        state.detalle = undefined
                    }
                    state.deleteError = undefined
                }
            )
            .addCase(deleteSucursal.rejected, (state, { payload }) => {
                state.deleteLoading = false
                state.deleteError = payload
            })
    },
})

export const { clearDetalle, clearErrors, resetSucursalesState } = sucursalesSlice.actions
export default sucursalesSlice.reducer
