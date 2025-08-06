import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../../services/ApiService';
import { IUserMe } from '../../../interface/user.interface';

// Interfaces adicionales
export interface UserWithDetails extends Omit<IUserMe, 'roles'> {
    roles?: Array<{
        id: number;
        name: string;
        level: number;
        company_id?: number;
        subsidiary_id?: number;
        branch_id?: number;
    }>;
    permissions?: Array<{
        id: number;
        code: string;
        name: string;
        expires_at?: string;
    }>;
}

export interface CreateUserData {
    first_name: string;
    last_name: string;
    email: string;
    rut?: string;
    phone_number?: string;
    position?: string;
    company_id: number;
    subsidiary_id?: number;
    branch_id?: number;
    role_ids?: number[];
    password?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
    id: number;
}

export interface UserInvitation {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    company_id: number;
    subsidiary_id?: number;
    branch_id?: number;
    role_ids: number[];
    invited_by: number;
    token: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    created_at: string;
}

interface UsersAdminState {
    users: UserWithDetails[];
    invitations: UserInvitation[];
    selectedUser: UserWithDetails | null;
    loading: {
        users: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        invitations: boolean;
        userDetails: boolean;
    };
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
    filters: {
        search: string;
        company_id?: number;
        subsidiary_id?: number;
        branch_id?: number;
        role_id?: number;
        status?: 'active' | 'inactive';
    };
    error: string | null;
}

const initialState: UsersAdminState = {
    users: [],
    invitations: [],
    selectedUser: null,
    loading: {
        users: false,
        create: false,
        update: false,
        delete: false,
        invitations: false,
        userDetails: false,
    },
    pagination: {
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0,
    },
    filters: {
        search: '',
    },
    error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
    'usersAdmin/fetchUsers',
    async (params: {
        page?: number;
        per_page?: number;
        search?: string;
        company_id?: number;
        subsidiary_id?: number;
        branch_id?: number;
        role_id?: number;
        status?: string;
    } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });

            // Probar diferentes formatos de include que son comunes en APIs
            const includeParams = 'roles,permissions,company,subsidiary,branch';

            // Intentar múltiples formatos comunes
            const urlOptions = [
                `/admin/users?include=${includeParams}&${queryParams.toString()}`,
                `/admin/users?with=${includeParams}&${queryParams.toString()}`,
                `/admin/users?relations=${includeParams}&${queryParams.toString()}`,
                `/admin/users?expand=${includeParams}&${queryParams.toString()}`,
                `/admin/users?${queryParams.toString()}&include=${includeParams}`,
                `/admin/users?${queryParams.toString()}`
            ];

            let response;
            let successUrl = '';

            // Probar cada URL hasta encontrar una que funcione
            for (const url of urlOptions) {
                try {
                    console.log(`🔍 Probando URL: ${url}`);
                    response = await ApiService.fetchData<any>({ url, method: 'get' });

                    // Verificar si esta URL devuelve relaciones
                    if (response.data?.data && response.data.data.length > 0) {
                        const firstUser = response.data.data[0];
                        if (firstUser.company || firstUser.subsidiary || firstUser.roles) {
                            successUrl = url;
                            console.log(`✅ URL exitosa encontrada: ${url}`);
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`❌ URL falló: ${url}`, error);
                    continue;
                }
            }

            if (!response) {
                throw new Error('Ninguna URL de admin/users funcionó');
            }

            console.log(`🔍 DEBUG - URL final usada: ${successUrl || 'fallback'}`);
            console.log('🔍 DEBUG - Response completo:', response);
            console.log('🔍 DEBUG - Response.data:', response.data);

            // Log del primer usuario para ver estructura
            if (response.data?.data && response.data.data.length > 0) {
                console.log('🔍 DEBUG - Primer usuario completo:', response.data.data[0]);
                console.log('🔍 DEBUG - Company del primer usuario:', response.data.data[0].company);
                console.log('🔍 DEBUG - Subsidiary del primer usuario:', response.data.data[0].subsidiary);
                console.log('🔍 DEBUG - Branch del primer usuario:', response.data.data[0].branch);
                console.log('🔍 DEBUG - Roles del primer usuario:', response.data.data[0].roles);
            }

            // Manejar diferentes formatos de respuesta
            let users: UserWithDetails[] = [];
            let pagination = {
                page: 1,
                per_page: 10,
                total: 0,
                total_pages: 0
            };

            // Formato 1: {success: boolean, data: UserWithDetails[], meta: {...}}
            if (response.data.data && Array.isArray(response.data.data)) {
                users = response.data.data;
                if (response.data.meta) {
                    pagination = {
                        page: response.data.meta.current_page || 1,
                        per_page: response.data.meta.per_page || 10,
                        total: response.data.meta.total || 0,
                        total_pages: response.data.meta.last_page || 0
                    };
                }
            }
            // Formato 2: {usuarios: UserWithDetails[]} - Formato usado en Usuarios.tsx
            else if (response.data.usuarios && Array.isArray(response.data.usuarios)) {
                users = response.data.usuarios;
                pagination.total = response.data.usuarios.length;
                pagination.total_pages = 1;
            }
            // Formato 3: UserWithDetails[] directo
            else if (Array.isArray(response.data)) {
                users = response.data;
                pagination.total = response.data.length;
                pagination.total_pages = 1;
            }
            // Formato 4: {users: UserWithDetails[], ...}
            else if (response.data.users && Array.isArray(response.data.users)) {
                users = response.data.users;
                pagination.total = response.data.users.length;
                pagination.total_pages = 1;
            }

            return { users, pagination };
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener usuarios');
        }
    }
);

export const fetchUserDetails = createAsyncThunk(
    'usersAdmin/fetchUserDetails',
    async (userId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user: UserWithDetails }>({
                url: `/admin/users/${userId}?include=roles,permissions,company,subsidiary,branch`,
                method: 'get'
            });
            return response.data.user;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener detalles del usuario');
        }
    }
);

export const createUser = createAsyncThunk(
    'usersAdmin/createUser',
    async (userData: CreateUserData, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user: UserWithDetails }>({
                url: '/admin/users',
                method: 'post',
                data: userData as unknown as Record<string, unknown>
            });
            return response.data.user;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al crear usuario');
        }
    }
);

export const updateUser = createAsyncThunk(
    'usersAdmin/updateUser',
    async ({ id, ...userData }: UpdateUserData, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user: UserWithDetails }>({
                url: `/admin/users/${id}`,
                method: 'put',
                data: userData as unknown as Record<string, unknown>
            });
            return response.data.user;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al actualizar usuario');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'usersAdmin/deleteUser',
    async (userId: number, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/users/${userId}`,
                method: 'delete'
            });
            return userId;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al eliminar usuario');
        }
    }
);

export const toggleUserStatus = createAsyncThunk(
    'usersAdmin/toggleUserStatus',
    async ({ userId, status }: { userId: number; status: boolean }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ user: UserWithDetails }>({
                url: `/admin/users/${userId}/status`,
                method: 'patch',
                data: { is_active: status }
            });
            return response.data.user;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cambiar estado del usuario');
        }
    }
);

// Invitaciones
export const fetchInvitations = createAsyncThunk(
    'usersAdmin/fetchInvitations',
    async (params: { status?: string; company_id?: number } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });

            const response = await ApiService.fetchData<{ invitations: UserInvitation[] }>({
                url: `/admin/invitations?${queryParams.toString()}`,
                method: 'get'
            });
            return response.data.invitations;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al obtener invitaciones');
        }
    }
);

export const sendInvitation = createAsyncThunk(
    'usersAdmin/sendInvitation',
    async (invitationData: {
        email: string;
        first_name: string;
        last_name: string;
        company_id: number;
        subsidiary_id?: number;
        branch_id?: number;
        role_ids: number[];
        expires_in_hours?: number;
    }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: UserInvitation }>({
                url: '/admin/invitations',
                method: 'post',
                data: invitationData as unknown as Record<string, unknown>
            });
            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al enviar invitación');
        }
    }
);

export const cancelInvitation = createAsyncThunk(
    'usersAdmin/cancelInvitation',
    async (invitationId: number, { rejectWithValue }) => {
        try {
            await ApiService.fetchData({
                url: `/admin/invitations/${invitationId}/cancel`,
                method: 'patch'
            });
            return invitationId;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cancelar invitación');
        }
    }
);

export const resendInvitation = createAsyncThunk(
    'usersAdmin/resendInvitation',
    async (invitationId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: UserInvitation }>({
                url: `/admin/invitations/${invitationId}/resend`,
                method: 'post'
            });
            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al reenviar invitación');
        }
    }
);

// Slice
const usersAdminSlice = createSlice({
    name: 'usersAdmin',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<UsersAdminState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setPagination: (state, action: PayloadAction<Partial<UsersAdminState['pagination']>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        clearSelectedUser: (state) => {
            state.selectedUser = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetUsersAdmin: () => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.loading.users = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading.users = false;
                state.users = action.payload.users;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading.users = false;
                state.error = action.payload as string;
            })

            // Fetch user details
            .addCase(fetchUserDetails.pending, (state) => {
                state.loading.userDetails = true;
                state.error = null;
            })
            .addCase(fetchUserDetails.fulfilled, (state, action) => {
                state.loading.userDetails = false;
                state.selectedUser = action.payload;
            })
            .addCase(fetchUserDetails.rejected, (state, action) => {
                state.loading.userDetails = false;
                state.error = action.payload as string;
            })

            // Create user
            .addCase(createUser.pending, (state) => {
                state.loading.create = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading.create = false;
                state.users.unshift(action.payload);
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading.create = false;
                state.error = action.payload as string;
            })

            // Update user
            .addCase(updateUser.pending, (state) => {
                state.loading.update = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading.update = false;
                const index = state.users.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
                if (state.selectedUser?.id === action.payload.id) {
                    state.selectedUser = action.payload;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading.update = false;
                state.error = action.payload as string;
            })

            // Delete user
            .addCase(deleteUser.pending, (state) => {
                state.loading.delete = true;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading.delete = false;
                state.users = state.users.filter(u => u.id !== action.payload);
                if (state.selectedUser?.id === action.payload) {
                    state.selectedUser = null;
                }
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading.delete = false;
                state.error = action.payload as string;
            })

            // Toggle user status
            .addCase(toggleUserStatus.fulfilled, (state, action) => {
                const index = state.users.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
                if (state.selectedUser?.id === action.payload.id) {
                    state.selectedUser = action.payload;
                }
            })

            // Invitations
            .addCase(fetchInvitations.pending, (state) => {
                state.loading.invitations = true;
                state.error = null;
            })
            .addCase(fetchInvitations.fulfilled, (state, action) => {
                state.loading.invitations = false;
                state.invitations = action.payload;
            })
            .addCase(fetchInvitations.rejected, (state, action) => {
                state.loading.invitations = false;
                state.error = action.payload as string;
            })
            .addCase(sendInvitation.fulfilled, (state, action) => {
                state.invitations.unshift(action.payload);
            })
            .addCase(cancelInvitation.fulfilled, (state, action) => {
                const index = state.invitations.findIndex(i => i.id === action.payload);
                if (index !== -1) {
                    state.invitations[index].status = 'cancelled';
                }
            })
            .addCase(resendInvitation.fulfilled, (state, action) => {
                const index = state.invitations.findIndex(i => i.id === action.payload.id);
                if (index !== -1) {
                    state.invitations[index] = action.payload;
                }
            });
    }
});

export const {
    setFilters,
    setPagination,
    clearSelectedUser,
    clearError,
    resetUsersAdmin
} = usersAdminSlice.actions;

export default usersAdminSlice.reducer;
