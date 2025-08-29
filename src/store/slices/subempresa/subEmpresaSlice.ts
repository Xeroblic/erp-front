// src/store/slices/subempresa/subempresaSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import ApiService from '@/services/ApiService'
import { ISubempresa } from '@/interface/empresas.interface'

export interface SubempresaState {
  loading: boolean
  error?: string
  lista: ISubempresa[]
  detalle?: ISubempresa
  createLoading: boolean
  createError?: string
  updateLoading: boolean
  updateError?: string
  deleteLoading: boolean
  deleteError?: string
}

const initialState: SubempresaState = {
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

const normalizeSubsidiaryData = (backendData: any): ISubempresa => {
  return {
    ...backendData,
    // Mapear campos del backend al formato del frontend
    name: backendData.subsidiary_name || backendData.name || '',
    rut: backendData.subsidiary_rut || backendData.rut,
    website: backendData.subsidiary_website || backendData.website,
    phone: backendData.subsidiary_phone || backendData.phone,
    address: backendData.subsidiary_address || backendData.address,
    email: backendData.subsidiary_email || backendData.email,
    manager_name: backendData.subsidiary_manager_name || backendData.manager_name,
    manager_phone: backendData.subsidiary_manager_phone || backendData.manager_phone,
    manager_email: backendData.subsidiary_manager_email || backendData.manager_email,
    status: backendData.subsidiary_status ?? backendData.status,
    sucursales: backendData.sucursales || [],
    branches_count: backendData.branches?.length || backendData.branches_count || 0
  }
}

export const fetchMisSubsidiarias = createAsyncThunk<
  ISubempresa[],
  void,
  { rejectValue: string }
>(
  'subempresa/fetchMisSubsidiarias',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<{ subempresas: any[] }>({
        url: '/my-company/subsidiaries',
        method: 'get',
      })
      const normalizedSubsidiaries = response.data.subempresas.map(normalizeSubsidiaryData)
      return normalizedSubsidiaries
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar subsidiarias')
    }
  }
)

export const fetchSubsidiariaDetail = createAsyncThunk<
  ISubempresa,
  number,
  { rejectValue: string }
>(
  'subempresa/fetchSubsidiariaDetail',
  async (subsidiariaId, { rejectWithValue }) => {
    try {
      const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
        url: `/my-company/subsidiaries/${subsidiariaId}`,
        method: 'get',
      })
      return subsidiary
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar detalle de subsidiaria')
    }
  }
)

export const createSubsidiaria = createAsyncThunk<
  ISubempresa,
  Partial<ISubempresa>,
  { rejectValue: string }
>(
  'subempresa/createSubsidiaria',
  async (subsidiariaData, { rejectWithValue }) => {
    try {
      const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
        url: '/my-company/subsidiaries',
        method: 'post',
        data: subsidiariaData,
      })
      return subsidiary
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al crear subsidiaria')
    }
  }
)

export const updateSubsidiaria = createAsyncThunk<
  ISubempresa,
  { id: number; data: Partial<ISubempresa> },
  { rejectValue: string }
>(
  'subempresa/updateSubsidiaria',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const subsidiary = await ApiService.fetchNormalized<ISubempresa>({
        url: `/my-company/subsidiaries/${id}`,
        method: 'put',
        data,
      })
      return subsidiary
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar subsidiaria')
    }
  }
)

export const deleteSubsidiaria = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'subempresa/deleteSubsidiaria',
  async (subsidiariaId, { rejectWithValue }) => {
    try {
      await ApiService.fetchData<void>({
        url: `/my-company/subsidiaries/${subsidiariaId}`,
        method: 'delete',
      })
      return subsidiariaId
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar subsidiaria')
    }
  }
)

const subempresaSlice = createSlice({
  name: 'subempresa',
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
    resetSubempresaState: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMisSubsidiarias.pending, state => {
        state.loading = true
        state.error = undefined
      })
      .addCase(
        fetchMisSubsidiarias.fulfilled,
        (state, action: PayloadAction<ISubempresa[]>) => {
          state.loading = false
          state.lista = action.payload
          state.error = undefined
        }
      )
      .addCase(fetchMisSubsidiarias.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })

    builder
      .addCase(fetchSubsidiariaDetail.pending, state => {
        state.loading = true
        state.error = undefined
      })
      .addCase(
        fetchSubsidiariaDetail.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.loading = false
          state.detalle = action.payload
          state.error = undefined
        }
      )
      .addCase(fetchSubsidiariaDetail.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })

    builder
      .addCase(createSubsidiaria.pending, state => {
        state.createLoading = true
        state.createError = undefined
      })
      .addCase(
        createSubsidiaria.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.createLoading = false
          state.lista.push(action.payload)
          state.createError = undefined
        }
      )
      .addCase(createSubsidiaria.rejected, (state, { payload }) => {
        state.createLoading = false
        state.createError = payload
      })

    builder
      .addCase(updateSubsidiaria.pending, state => {
        state.updateLoading = true
        state.updateError = undefined
      })
      .addCase(
        updateSubsidiaria.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.updateLoading = false
          const idx = state.lista.findIndex(s => s.id === action.payload.id)
          if (idx !== -1) state.lista[idx] = action.payload
          if (state.detalle?.id === action.payload.id) {
            state.detalle = action.payload
          }
          state.updateError = undefined
        }
      )
      .addCase(updateSubsidiaria.rejected, (state, { payload }) => {
        state.updateLoading = false
        state.updateError = payload
      })

    builder
      .addCase(deleteSubsidiaria.pending, state => {
        state.deleteLoading = true
        state.deleteError = undefined
      })
      .addCase(
        deleteSubsidiaria.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.deleteLoading = false
          state.lista = state.lista.filter(s => s.id !== action.payload)
          if (state.detalle?.id === action.payload) {
            state.detalle = undefined
          }
          state.deleteError = undefined
        }
      )
      .addCase(deleteSubsidiaria.rejected, (state, { payload }) => {
        state.deleteLoading = false
        state.deleteError = payload
      })
  },
})

export const { clearDetalle, clearErrors, resetSubempresaState } = subempresaSlice.actions
export default subempresaSlice.reducer
