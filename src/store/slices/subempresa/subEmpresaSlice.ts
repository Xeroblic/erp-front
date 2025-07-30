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

// 1) Listar todas las subempresas de una empresa
export const fetchSubempresasByEmpresa = createAsyncThunk<
  ISubempresa[],
  number,
  { rejectValue: string }
>(
  'subempresa/fetchByEmpresa',
  async (empresaId, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<{ subempresas: ISubempresa[] }>({
        url: `/companies/${empresaId}/subsidiaries`,
        method: 'get',
      })
      return response.data.subempresas
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar subempresas')
    }
  }
)

// 2) Obtener detalle de una subempresa
export const fetchSubempresaDetail = createAsyncThunk<
  ISubempresa,
  number,
  { rejectValue: string }
>(
  'subempresa/fetchDetail',
  async (subempresaId, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<ISubempresa>({
        url: `/subempresas/${subempresaId}`,
        method: 'get',
      })
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar detalle de subempresa')
    }
  }
)

// 3) Crear nueva subempresa en empresa dada
export const createSubempresa = createAsyncThunk<
  ISubempresa,
  { empresaId: number; nombre: string; slug?: string; descripcion?: string },
  { rejectValue: string }
>(
  'subempresa/create',
  async ({ empresaId, nombre, slug, descripcion }, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<ISubempresa>({
        url: `/companies/${empresaId}/subsidiaries`,
        method: 'post',
        data: { nombre, slug, descripcion },
      })
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al crear subempresa')
    }
  }
)

// 4) Actualizar subempresa existente
export const updateSubempresa = createAsyncThunk<
  ISubempresa,
  ISubempresa,
  { rejectValue: string }
>(
  'subempresa/update',
  async (subempresa, { rejectWithValue }) => {
    try {
      const response = await ApiService.fetchData<ISubempresa>({
        url: `/subsidaries/${subempresa.id}`,
        method: 'patch',
        data: {
          nombre: subempresa.subsidiary_name,
          slug: subempresa.subsidiary_rut,
          descripcion: subempresa.subsidiary_phone,
        },
      })
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al actualizar subempresa')
    }
  }
)

// 5) Eliminar subempresa
export const deleteSubempresa = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'subempresa/delete',
  async (subempresaId, { rejectWithValue }) => {
    try {
      await ApiService.fetchData<void>({
        url: `/subsidaries/${subempresaId}`,
        method: 'delete',
      })
      return subempresaId
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al eliminar subempresa')
    }
  }
)

const subempresaSlice = createSlice({
  name: 'subempresa',
  initialState,
  reducers: {
    // si necesitas limpiar estado o detalle:
    clearDetalle(state) {
      state.detalle = undefined
      state.error = undefined
    },
  },
  extraReducers: builder => {
    // fetchSubempresasByEmpresa
    builder
      .addCase(fetchSubempresasByEmpresa.pending, state => {
        state.loading = true
        state.error = undefined
      })
      .addCase(
        fetchSubempresasByEmpresa.fulfilled,
        (state, action: PayloadAction<ISubempresa[]>) => {
          state.loading = false
          state.lista = action.payload
        }
      )
      .addCase(fetchSubempresasByEmpresa.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })

    // fetchSubempresaDetail
    builder
      .addCase(fetchSubempresaDetail.pending, state => {
        state.loading = true
        state.error = undefined
      })
      .addCase(
        fetchSubempresaDetail.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.loading = false
          state.detalle = action.payload
        }
      )
      .addCase(fetchSubempresaDetail.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })

    // createSubempresa
    builder
      .addCase(createSubempresa.pending, state => {
        state.createLoading = true
        state.createError = undefined
      })
      .addCase(
        createSubempresa.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.createLoading = false
          state.lista.push(action.payload)
        }
      )
      .addCase(createSubempresa.rejected, (state, { payload }) => {
        state.createLoading = false
        state.createError = payload
      })

    // updateSubempresa
    builder
      .addCase(updateSubempresa.pending, state => {
        state.updateLoading = true
        state.updateError = undefined
      })
      .addCase(
        updateSubempresa.fulfilled,
        (state, action: PayloadAction<ISubempresa>) => {
          state.updateLoading = false
          const idx = state.lista.findIndex(s => s.id === action.payload.id)
          if (idx !== -1) state.lista[idx] = action.payload
          if (state.detalle?.id === action.payload.id) {
            state.detalle = action.payload
          }
        }
      )
      .addCase(updateSubempresa.rejected, (state, { payload }) => {
        state.updateLoading = false
        state.updateError = payload
      })

    // deleteSubempresa
    builder
      .addCase(deleteSubempresa.pending, state => {
        state.deleteLoading = true
        state.deleteError = undefined
      })
      .addCase(
        deleteSubempresa.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.deleteLoading = false
          state.lista = state.lista.filter(s => s.id !== action.payload)
          if (state.detalle?.id === action.payload) {
            state.detalle = undefined
          }
        }
      )
      .addCase(deleteSubempresa.rejected, (state, { payload }) => {
        state.deleteLoading = false
        state.deleteError = payload
      })
  },
})

export const { clearDetalle } = subempresaSlice.actions
export default subempresaSlice.reducer
