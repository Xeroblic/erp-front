// src/store/slices/rolesPermisosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import ApiService from '@/services/ApiService'
import { UsuarioConRolesPerms } from '@/interface/usuariosConRolesPerms.interface'


export interface RolesPermisosState {
  data: UsuarioConRolesPerms[]
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: RolesPermisosState = {
  data: [],
  status: 'idle',
  error: null,
}

export const fetchUsuariosConRolesPerms = createAsyncThunk<UsuarioConRolesPerms[],void,{ rejectValue: string }>(
    'rolesPermisos/fetchAll',
        async (_, { rejectWithValue }) => {
            try {
            const res = await ApiService.fetchData<{ data: UsuarioConRolesPerms[] }>({
                url: '/usuarios?include=roles,permisos',
                method: 'get',
            })
            return res.data.data
            } catch (err: any) {
                return rejectWithValue(err.message)
            }
        }
    )

export const updateUsuarioRolesPerms = createAsyncThunk<void, { id: number; roles: string[]; permisos: string[] }, { rejectValue: string }>(
    'rolesPermisos/updateUsuarioRolesPerms',
    async ({ id, roles, permisos }, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/usuarios/${id}/roles-permisos`,
                method: 'put',
                data: { roles, permisos },
            })
            return
        } catch (err: any) {
            return rejectWithValue(err.message)
        }
    }
)
// Define el slice

const rolesPermisosSlice = createSlice({
  name: 'rolesPermiso/rolesPermisosSlice',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUsuariosConRolesPerms.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsuariosConRolesPerms.fulfilled, (state, { payload }) => {
        state.status = 'idle'
        state.data = payload
      })
      .addCase(fetchUsuariosConRolesPerms.rejected, (state, { payload }) => {
        state.status = 'failed'
        state.error = typeof payload === 'string' ? payload : 'Error desconocido'
      })
        .addCase(updateUsuarioRolesPerms.pending, state => {
            state.status = 'loading'
            state.error = null
        })
        .addCase(updateUsuarioRolesPerms.fulfilled, (state, { payload }) => {
            state.status = 'idle'
        })
        .addCase(updateUsuarioRolesPerms.rejected, (state, { payload }) => {
            state.status = 'failed'
            state.error = typeof payload === 'string' ? payload : 'Error desconocido'
        })

  },
})

export const { } = rolesPermisosSlice.actions

export default rolesPermisosSlice.reducer
