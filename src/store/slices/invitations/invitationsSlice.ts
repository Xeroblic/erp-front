import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../../services/ApiService';

// Types
export interface Invitation {
    id: number;
    uid: string;
    email: string;
    first_name: string;
    last_name: string;
    rut?: string;
    position?: string;
    phone_number?: string;
    address?: string;
    company_id: number;
    subsidiary_id?: number;
    branch_id: number;
    role_name: string;
    role: string; // Alias para role_name para consistencia con la UI
    permissions?: string[];
    status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
    additional_data?: Record<string, any>;
    expires_at: string;
    sent_at?: string;
    accepted_at?: string;
    created_at: string;
    updated_at: string;

    // Relaciones
    company?: {
        id: number;
        company_name: string;
    };
    subsidiary?: {
        id: number;
        name: string;
    };
    branch?: {
        id: number;
        branch_name: string;
    };
    sent_by_user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface InvitationStats {
    total: number;
    pending: number;
    sent: number;
    accepted: number;
    expired: number;
    cancelled: number;
}

export interface CreateInvitationData {
    email: string;
    first_name: string;
    last_name: string;
    rut?: string;
    position?: string;
    phone_number?: string;
    address?: string;
    company_id: number;
    subsidiary_id?: number;
    branch_id: number;
    role_name: string;
    permissions?: string[];
    additional_data?: Record<string, any>;
    send_immediately?: boolean;
}

export interface InvitationFilters {
    search?: string;
    status?: string;
    role?: string;
    company_id?: number;
    branch_id?: number;
}

export interface InvitationsState {
    invitations: Invitation[];
    selectedInvitation: Invitation | null;
    stats: InvitationStats | null;
    isLoading: boolean;
    error: string | null;
    loading: {
        invitations: boolean;
        stats: boolean;
        create: boolean;
        resend: boolean;
        cancel: boolean;
    };
    filters: {
        search: string;
        status: string;
        role: string;
        company_id: number | null;
        branch_id: number | null;
    };
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

const initialState: InvitationsState = {
    invitations: [],
    selectedInvitation: null,
    stats: null,
    isLoading: false,
    error: null,
    loading: {
        invitations: false,
        stats: false,
        create: false,
        resend: false,
        cancel: false,
    },
    filters: {
        search: '',
        status: '',
        role: '',
        company_id: null,
        branch_id: null,
    },
    pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
    },
};

// Async thunks
export const fetchInvitations = createAsyncThunk(
    'invitations/fetchInvitations',
    async (params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
        company_id?: number;
        branch_id?: number;
    } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });

            const response = await ApiService.fetchData<{
                data: Invitation[];
                current_page: number;
                per_page: number;
                total: number;
                last_page: number;
            }>({
                url: `/invitations?${queryParams.toString()}`,
                method: 'get',
            });

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cargar invitaciones');
        }
    }
);

export const fetchInvitationStats = createAsyncThunk(
    'invitations/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<InvitationStats>({
                url: '/invitations/stats/summary',
                method: 'get',
            });

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cargar estadísticas');
        }
    }
);

export const createInvitation = createAsyncThunk(
    'invitations/create',
    async (data: CreateInvitationData, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: Invitation }>({
                url: '/invitations',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            });

            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al crear invitación');
        }
    }
);

export const resendInvitation = createAsyncThunk(
    'invitations/resend',
    async (invitationId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: Invitation }>({
                url: `/invitations/${invitationId}/resend`,
                method: 'post',
            });

            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al reenviar invitación');
        }
    }
);

export const cancelInvitation = createAsyncThunk(
    'invitations/cancel',
    async (invitationId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: Invitation }>({
                url: `/invitations/${invitationId}/cancel`,
                method: 'delete',
            });

            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cancelar invitación');
        }
    }
);

export const fetchInvitationDetails = createAsyncThunk(
    'invitations/fetchDetails',
    async (invitationId: number, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ invitation: Invitation }>({
                url: `/invitations/${invitationId}`,
                method: 'get',
            });

            return response.data.invitation;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.message || 'Error al cargar detalles de invitación');
        }
    }
);

// Slice
const invitationsSlice = createSlice({
    name: 'invitations',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        setSelectedInvitation: (state, action: PayloadAction<Invitation | null>) => {
            state.selectedInvitation = action.payload;
        },
        clearSelectedInvitation: (state) => {
            state.selectedInvitation = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch invitations
            .addCase(fetchInvitations.pending, (state) => {
                state.loading.invitations = true;
            })
            .addCase(fetchInvitations.fulfilled, (state, action) => {
                state.loading.invitations = false;
                // Validación defensiva para asegurar que data existe y es un array
                const data = action.payload?.data;
                state.invitations = Array.isArray(data) ? data.filter(Boolean) : [];
                state.pagination = {
                    page: action.payload?.current_page || 1,
                    pageSize: action.payload?.per_page || 10,
                    total: action.payload?.total || 0,
                    totalPages: action.payload?.last_page || 1,
                };
            })
            .addCase(fetchInvitations.rejected, (state) => {
                state.loading.invitations = false;
            })

            // Fetch stats
            .addCase(fetchInvitationStats.pending, (state) => {
                state.loading.stats = true;
            })
            .addCase(fetchInvitationStats.fulfilled, (state, action) => {
                state.loading.stats = false;
                state.stats = action.payload;
            })
            .addCase(fetchInvitationStats.rejected, (state) => {
                state.loading.stats = false;
            })

            // Create invitation
            .addCase(createInvitation.pending, (state) => {
                state.loading.create = true;
            })
            .addCase(createInvitation.fulfilled, (state, action) => {
                state.loading.create = false;
                // Validación defensiva para la nueva invitación
                if (action.payload && typeof action.payload === 'object') {
                    state.invitations.unshift(action.payload);
                    if (state.stats) {
                        state.stats.total += 1;
                        if (action.payload.status === 'pending') state.stats.pending += 1;
                        if (action.payload.status === 'sent') state.stats.sent += 1;
                    }
                }
            })
            .addCase(createInvitation.rejected, (state) => {
                state.loading.create = false;
            })

            // Resend invitation
            .addCase(resendInvitation.pending, (state) => {
                state.loading.resend = true;
            })
            .addCase(resendInvitation.fulfilled, (state, action) => {
                state.loading.resend = false;
                const index = state.invitations.findIndex(inv => inv.id === action.payload.id);
                if (index !== -1) {
                    state.invitations[index] = action.payload;
                }
                if (state.selectedInvitation?.id === action.payload.id) {
                    state.selectedInvitation = action.payload;
                }
            })
            .addCase(resendInvitation.rejected, (state) => {
                state.loading.resend = false;
            })

            // Cancel invitation
            .addCase(cancelInvitation.pending, (state) => {
                state.loading.cancel = true;
            })
            .addCase(cancelInvitation.fulfilled, (state, action) => {
                state.loading.cancel = false;
                const index = state.invitations.findIndex(inv => inv.id === action.payload.id);
                if (index !== -1) {
                    state.invitations[index] = action.payload;
                }
                if (state.selectedInvitation?.id === action.payload.id) {
                    state.selectedInvitation = action.payload;
                }
                if (state.stats) {
                    state.stats.cancelled += 1;
                    if (action.payload.status === 'pending') state.stats.pending -= 1;
                    if (action.payload.status === 'sent') state.stats.sent -= 1;
                }
            })
            .addCase(cancelInvitation.rejected, (state) => {
                state.loading.cancel = false;
            })

            // Fetch details
            .addCase(fetchInvitationDetails.fulfilled, (state, action) => {
                state.selectedInvitation = action.payload;
                const index = state.invitations.findIndex(inv => inv.id === action.payload.id);
                if (index !== -1) {
                    state.invitations[index] = action.payload;
                }
            });
    },
});

export const { setFilters, clearFilters, setSelectedInvitation, clearSelectedInvitation, setPagination } = invitationsSlice.actions;
export default invitationsSlice.reducer;
