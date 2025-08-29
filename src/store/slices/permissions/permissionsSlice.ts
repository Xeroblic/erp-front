import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../../services/ApiService';

// Interfaces
export interface Permission {
    id: number;
    name: string;
    code: string;
    description?: string;
    category: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    level: number;
    permissions: Permission[];
    created_at: string;
    updated_at: string;
}

export interface UserPermission {
    user_id: number;
    permission_id: number;
    granted_by: number;
    granted_at: string;
    expires_at?: string;
}

export interface UserRole {
    user_id: number;
    role_id: number;
    assigned_by: number;
    assigned_at: string;
    company_id?: number;
    subsidiary_id?: number;
    branch_id?: number;
}

interface PermissionsState {
    permissions: Permission[];
    roles: Role[];
    userPermissions: UserPermission[];
    userRoles: UserRole[];
    loading: {
        permissions: boolean;
        roles: boolean;
        userPermissions: boolean;
        userRoles: boolean;
    };
    error: string | null;
}

const initialState: PermissionsState = {
    permissions: [],
    roles: [],
    userPermissions: [],
    userRoles: [],
    loading: {
        permissions: false,
        roles: false,
        userPermissions: false,
        userRoles: false,
    },
    error: null,
};

// Async thunks para permisos
export const fetchPermissions = createAsyncThunk(
    'permissions/fetchPermissions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{
                success: boolean;
                data: Permission[]
            }>({
                url: '/admin/permissions',
                method: 'get'
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener permisos');
        }
    }
);

export const createPermission = createAsyncThunk(
    'permissions/createPermission',
    async (permissionData: Omit<Permission, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ permission: Permission }>({
                url: '/admin/permissions',
                method: 'post',
                data: permissionData
            });
            return response.data.permission;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al crear permiso');
        }
    }
);

export const updatePermission = createAsyncThunk(
    'permissions/updatePermission',
    async ({ id, ...permissionData }: Partial<Permission> & { id: number }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ permission: Permission }>({
                url: `/admin/permissions/${id}`,
                method: 'put',
                data: permissionData
            });
            return response.data.permission;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al actualizar permiso');
        }
    }
);

export const deletePermission = createAsyncThunk(
    'permissions/deletePermission',
    async (id: number, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/permissions/${id}`,
                method: 'delete'
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al eliminar permiso');
        }
    }
);

// Async thunks para roles
export const fetchRoles = createAsyncThunk(
    'permissions/fetchRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{
                success: boolean;
                data: Role[]
            }>({
                url: '/admin/roles',
                method: 'get'
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener roles');
        }
    }
);

export const createRole = createAsyncThunk(
    'permissions/createRole',
    async (roleData: { name: string; description?: string; level: number; permission_ids: number[] }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ role: Role }>({
                url: '/admin/roles',
                method: 'post',
                data: roleData
            });
            return response.data.role;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al crear rol');
        }
    }
);

export const updateRole = createAsyncThunk(
    'permissions/updateRole',
    async ({ id, permission_ids, ...roleData }: Partial<Role> & { id: number; permission_ids?: number[] }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ role: Role }>({
                url: `/admin/roles/${id}`,
                method: 'put',
                data: { ...roleData, permission_ids }
            });
            return response.data.role;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al actualizar rol');
        }
    }
);

export const deleteRole = createAsyncThunk(
    'permissions/deleteRole',
    async (id: number, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/roles/${id}`,
                method: 'delete'
            });
            return id;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al eliminar rol');
        }
    }
);

// Async thunks para asignación de permisos a usuarios
export const fetchUserPermissions = createAsyncThunk(
    'permissions/fetchUserPermissions',
    async (userId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user_permissions: UserPermission[] }>({
                url: `/admin/users/${userId}/permissions`,
                method: 'get'
            });
            return response.data.user_permissions;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener permisos del usuario');
        }
    }
);

export const assignPermissionToUser = createAsyncThunk(
    'permissions/assignPermissionToUser',
    async ({ userId, permissionId, expiresAt }: { userId: number; permissionId: number; expiresAt?: string }, { rejectWithValue }) => {
        try {
            const payload = {
                permissions: [String(permissionId)], // Backend ahora acepta IDs como strings
                expires_at: expiresAt
            };
            const response = await ApiService.fetchData<{ user_permission: UserPermission }>({
                url: `/admin/users/${userId}/permissions`,
                method: 'post',
                data: payload
            });
            return response.data.user_permission;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al asignar permiso');
        }
    }
);

export const revokePermissionFromUser = createAsyncThunk(
    'permissions/revokePermissionFromUser',
    async ({ userId, permissionId }: { userId: number; permissionId: number }, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}/permissions/${permissionId}`,
                method: 'delete'
            });
            return { userId, permissionId };
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al revocar permiso');
        }
    }
);

// Async thunks para asignación de roles a usuarios
export const fetchUserRoles = createAsyncThunk(
    'permissions/fetchUserRoles',
    async (userId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user_roles: UserRole[] }>({
                url: `/admin/users/${userId}/roles`,
                method: 'get'
            });
            return response.data.user_roles;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener roles del usuario');
        }
    }
);

export const assignRoleToUser = createAsyncThunk(
    'permissions/assignRoleToUser',
    async (roleData: { userId: number; roleId: number; companyId?: number; subsidiaryId?: number; branchId?: number }, { rejectWithValue }) => {
        try {
            const payload = {
                roles: [String(roleData.roleId)], // Backend ahora acepta IDs como strings en array
                company_id: roleData.companyId,
                subsidiary_id: roleData.subsidiaryId,
                branch_id: roleData.branchId
            };
            const response = await ApiService.fetchData<{ user_role: UserRole }>({
                url: `/admin/users/${roleData.userId}/roles`,
                method: 'post',
                data: payload
            });
            return response.data.user_role;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al asignar rol');
        }
    }
);

export const revokeRoleFromUser = createAsyncThunk(
    'permissions/revokeRoleFromUser',
    async ({ userId, roleId }: { userId: number; roleId: number }, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}/roles/${roleId}`,
                method: 'delete'
            });
            return { userId, roleId };
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al revocar rol');
        }
    }
);

// Slice
const permissionsSlice = createSlice({
    name: 'permissions',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetPermissions: () => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        // Permisos
        builder
            .addCase(fetchPermissions.pending, (state) => {
                state.loading.permissions = true;
                state.error = null;
            })
            .addCase(fetchPermissions.fulfilled, (state, action) => {
                state.loading.permissions = false;
                state.permissions = action.payload;
            })
            .addCase(fetchPermissions.rejected, (state, action) => {
                state.loading.permissions = false;
                state.error = action.payload as string;
            })
            .addCase(createPermission.fulfilled, (state, action) => {
                state.permissions.push(action.payload);
            })
            .addCase(updatePermission.fulfilled, (state, action) => {
                const index = state.permissions.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.permissions[index] = action.payload;
                }
            })
            .addCase(deletePermission.fulfilled, (state, action) => {
                state.permissions = state.permissions.filter(p => p.id !== action.payload);
            })

            // Roles
            .addCase(fetchRoles.pending, (state) => {
                state.loading.roles = true;
                state.error = null;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading.roles = false;
                state.roles = action.payload;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading.roles = false;
                state.error = action.payload as string;
            })
            .addCase(createRole.fulfilled, (state, action) => {
                state.roles.push(action.payload);
            })
            .addCase(updateRole.fulfilled, (state, action) => {
                const index = state.roles.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.roles[index] = action.payload;
                }
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.roles = state.roles.filter(r => r.id !== action.payload);
            })

            // Permisos de usuario
            .addCase(fetchUserPermissions.pending, (state) => {
                state.loading.userPermissions = true;
                state.error = null;
            })
            .addCase(fetchUserPermissions.fulfilled, (state, action) => {
                state.loading.userPermissions = false;
                state.userPermissions = action.payload;
            })
            .addCase(fetchUserPermissions.rejected, (state, action) => {
                state.loading.userPermissions = false;
                state.error = action.payload as string;
            })
            .addCase(assignPermissionToUser.fulfilled, (state, action) => {
                state.userPermissions.push(action.payload);
            })
            .addCase(revokePermissionFromUser.fulfilled, (state, action) => {
                state.userPermissions = state.userPermissions.filter(
                    up => !(up.user_id === action.payload.userId && up.permission_id === action.payload.permissionId)
                );
            })

            // Roles de usuario
            .addCase(fetchUserRoles.pending, (state) => {
                state.loading.userRoles = true;
                state.error = null;
            })
            .addCase(fetchUserRoles.fulfilled, (state, action) => {
                state.loading.userRoles = false;
                state.userRoles = action.payload;
            })
            .addCase(fetchUserRoles.rejected, (state, action) => {
                state.loading.userRoles = false;
                state.error = action.payload as string;
            })
            .addCase(assignRoleToUser.fulfilled, (state, action) => {
                state.userRoles.push(action.payload);
            })
            .addCase(revokeRoleFromUser.fulfilled, (state, action) => {
                state.userRoles = state.userRoles.filter(
                    ur => !(ur.user_id === action.payload.userId && ur.role_id === action.payload.roleId)
                );
            });
    }
});

export const { clearError, resetPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;
