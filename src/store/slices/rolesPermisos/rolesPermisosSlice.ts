// src/store/slices/rolesPermisosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { UserWithDetails } from '@/store/slices/usersAdmin/usersAdminSlice';

export interface RolesPermisosState {
  data: UserWithDetails[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: RolesPermisosState = {
  data: [],
  status: 'idle',
  error: null,
};

export const fetchUsuariosConRolesPerms = createAsyncThunk<UserWithDetails[], void, { rejectValue: string }>(
  'rolesPermisos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await ApiService.fetchData<{
        success: boolean;
        data: UserWithDetails[];
        meta?: Record<string, unknown>;
      }>({
        url: '/users',
        method: 'get',
        dedupe: true,
        dedupeKey: 'users-with-roles-permissions',
      });

      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : [];

      return payload;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Error al obtener usuarios con roles y permisos';
      return rejectWithValue(message);
    }
  }
);

export const updateUsuarioRolesPerms = createAsyncThunk<
  void,
  {
    id: number;
    nextRoles: string[];
    nextPermissions: string[];
    currentRoles: string[];
    currentPermissions: string[];
  },
  { rejectValue: string }
>(
  'rolesPermisos/updateUsuarioRolesPerms',
  async ({ id, nextRoles, nextPermissions, currentRoles, currentPermissions }, { rejectWithValue }) => {
    try {
      const rolesToAdd = nextRoles.filter((role) => !currentRoles.includes(role));
      const rolesToRemove = currentRoles.filter((role) => !nextRoles.includes(role));
      const permissionsToAdd = nextPermissions.filter((perm) => !currentPermissions.includes(perm));
      const permissionsToRemove = currentPermissions.filter((perm) => !nextPermissions.includes(perm));

      if (rolesToAdd.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/roles`,
          method: 'post',
          data: { roles: rolesToAdd },
        });
      }

      if (rolesToRemove.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/roles`,
          method: 'delete',
          data: { roles: rolesToRemove },
        });
      }

      if (permissionsToAdd.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/permissions`,
          method: 'post',
          data: { permissions: permissionsToAdd },
        });
      }

      if (permissionsToRemove.length > 0) {
        await ApiService.fetchData({
          url: `/users/${id}/permissions`,
          method: 'delete',
          data: { permissions: permissionsToRemove },
        });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Error al actualizar roles o permisos';
      return rejectWithValue(message);
    }
  }
);

const rolesPermisosSlice = createSlice({
  name: 'rolesPermiso/rolesPermisosSlice',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUsuariosConRolesPerms.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsuariosConRolesPerms.fulfilled, (state, { payload }) => {
        state.status = 'idle';
        state.data = payload;
      })
      .addCase(fetchUsuariosConRolesPerms.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = typeof payload === 'string' ? payload : 'Error desconocido';
      })
      .addCase(updateUsuarioRolesPerms.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUsuarioRolesPerms.fulfilled, state => {
        state.status = 'idle';
      })
      .addCase(updateUsuarioRolesPerms.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = typeof payload === 'string' ? payload : 'Error desconocido';
      });
  },
});

export default rolesPermisosSlice.reducer;
