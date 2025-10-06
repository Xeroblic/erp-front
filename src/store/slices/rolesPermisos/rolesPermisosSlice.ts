// src/store/slices/rolesPermisosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import ApiService from '@/services/ApiService'
import { UsuarioConRolesPerms } from '@/interface/usuariosConRolesPerms.interface'

// Interfaz temporal que coincide con los datos del backend
interface BackendUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles?: any[];
  permissions?: any[];
}


// Función para transformar datos del backend al formato esperado
const transformBackendUser = (backendUser: BackendUser): UsuarioConRolesPerms => ({
  id: backendUser.id,
  nombre: `${backendUser.first_name} ${backendUser.last_name}`,
  email: backendUser.email,
  roles: backendUser.roles || [],
  permisos: backendUser.permissions || []
});

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

export const fetchUsuariosConRolesPerms = createAsyncThunk<UsuarioConRolesPerms[], void, { rejectValue: string }>(
  'rolesPermisos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Calling API endpoint: /users');

      // Primero probemos obteniendo un usuario específico para ver si tiene más datos
      const testUserRes = await ApiService.fetchData<any>({
        url: '/users/6', // Probar con un usuario específico
        method: 'get',
      });
      console.log('🔍 Single user response:', testUserRes.data);

      const res = await ApiService.fetchData<{ data: UsuarioConRolesPerms[] }>({
        url: '/users', // El endpoint correcto según el controlador PHP
        method: 'get',
        dedupe: true, // Activar deduplicación
        dedupeKey: 'users-with-roles-permissions' // Clave específica
      })

      // Debug: vamos a ver qué estructura tiene la respuesta
      console.log('🔍 Response from API:', res);
      console.log('🔍 Response data:', res.data);

      // La respuesta puede venir como array directo o envuelta en data
      const usersArray = Array.isArray(res.data) ? res.data : (res.data as any).data || [];

      if (usersArray && usersArray.length > 0) {
        console.log('🔍 First user detailed from slice:', JSON.stringify(usersArray[0], null, 2));
      }      // La respuesta puede venir como array directo o envuelta en data
      const users = Array.isArray(res.data) ? res.data : (res.data as any).data || [];

      console.log('🔍 Users before any transformation:', users);

      // NO transformar - preservar los datos tal como vienen del backend PHP
      // El backend ya envía los datos en el formato correcto
      return users;
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateUsuarioRolesPerms = createAsyncThunk<void, { id: number; roles: string[]; permisos: string[] }, { rejectValue: string }>(
  'rolesPermisos/updateUsuarioRolesPerms',
  async ({ id, roles, permisos }, { rejectWithValue }) => {
    try {
      // Asignar roles
      if (roles && roles.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/assign-roles`,
          method: 'post',
          data: { roles },
        })
      }

      // Asignar permisos
      if (permisos && permisos.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/assign-permissions`,
          method: 'post',
          data: { permissions: permisos },
        })
      }

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
      .addCase(updateUsuarioRolesPerms.fulfilled, (state) => {
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
