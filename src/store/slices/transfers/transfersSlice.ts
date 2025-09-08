import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type {
    ITransfer,
    ICreateTransferRequest,
    IReceiveTransferRequest,
    TransferStatus
} from '@/interface/transfers.interface';

// Estado del slice
export interface TransferState {
    loading: boolean;
    error?: string;

    // Lista de transferencias
    transfers: ITransfer[];
    totalTransfers: number;
    currentPage: number;
    totalPages: number;

    // Transferencia actual
    currentTransfer?: ITransfer;

    // Estados específicos para acciones
    createLoading: boolean;
    updateLoading: boolean;
    shipLoading: boolean;
    receiveLoading: boolean;

    // Filtros
    filters: {
        status?: TransferStatus;
        from_warehouse_id?: number;
        to_warehouse_id?: number;
        date_from?: string;
        date_to?: string;
    };
}

const initialState: TransferState = {
    loading: false,
    transfers: [],
    totalTransfers: 0,
    currentPage: 1,
    totalPages: 1,
    createLoading: false,
    updateLoading: false,
    shipLoading: false,
    receiveLoading: false,
    filters: {}
};

// Async thunks
export const fetchTransfers = createAsyncThunk<
    { data: ITransfer[]; total: number; page: number; totalPages: number },
    { page?: number; limit?: number; filters?: any },
    { rejectValue: string }
>(
    'transfers/fetchTransfers',
    async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
        try {
            const params = {
                page,
                limit,
                ...filters
            };

            const response = await ApiService.fetchData<{
                data: ITransfer[];
                meta: { total: number; current_page: number; last_page: number };
            }>({
                url: '/transfers',
                method: 'get',
                params
            });

            return {
                data: response.data.data,
                total: response.data.meta.total,
                page: response.data.meta.current_page,
                totalPages: response.data.meta.last_page
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al obtener transferencias');
        }
    }
);

export const fetchTransferById = createAsyncThunk<
    ITransfer,
    number,
    { rejectValue: string }
>(
    'transfers/fetchTransferById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<ITransfer>({
                url: `/transfers/${id}`,
                method: 'get'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al obtener transferencia');
        }
    }
);

export const createTransfer = createAsyncThunk<
    ITransfer,
    ICreateTransferRequest,
    { rejectValue: string }
>(
    'transfers/createTransfer',
    async (transferData, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<ITransfer>({
                url: '/transfers',
                method: 'post',
                data: transferData
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al crear transferencia');
        }
    }
);

export const shipTransfer = createAsyncThunk<
    ITransfer,
    number,
    { rejectValue: string }
>(
    'transfers/shipTransfer',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<ITransfer>({
                url: `/transfers/${id}/ship`,
                method: 'post'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al enviar transferencia');
        }
    }
);

export const receiveTransfer = createAsyncThunk<
    ITransfer,
    { id: number; data: IReceiveTransferRequest },
    { rejectValue: string }
>(
    'transfers/receiveTransfer',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<ITransfer>({
                url: `/transfers/${id}/receive`,
                method: 'post',
                data
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al recibir transferencia');
        }
    }
);

export const cancelTransfer = createAsyncThunk<
    ITransfer,
    number,
    { rejectValue: string }
>(
    'transfers/cancelTransfer',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<ITransfer>({
                url: `/transfers/${id}`,
                method: 'delete'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al cancelar transferencia');
        }
    }
);

// Slice
const transfersSlice = createSlice({
    name: 'transferencias',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<TransferState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        clearCurrentTransfer: (state) => {
            state.currentTransfer = undefined;
        },
        clearError: (state) => {
            state.error = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch transfers
            .addCase(fetchTransfers.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchTransfers.fulfilled, (state, action) => {
                state.loading = false;
                state.transfers = action.payload.data;
                state.totalTransfers = action.payload.total;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.totalPages;
            })
            .addCase(fetchTransfers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al cargar transferencias');
            })

            // Fetch transfer by ID
            .addCase(fetchTransferById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTransferById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTransfer = action.payload;
            })
            .addCase(fetchTransferById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al cargar transferencia');
            })

            // Create transfer
            .addCase(createTransfer.pending, (state) => {
                state.createLoading = true;
                state.error = undefined;
            })
            .addCase(createTransfer.fulfilled, (state, action) => {
                state.createLoading = false;
                state.transfers.unshift(action.payload);
                state.totalTransfers += 1;
                toast.success('Transferencia creada exitosamente');
            })
            .addCase(createTransfer.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al crear transferencia');
            })

            // Ship transfer
            .addCase(shipTransfer.pending, (state) => {
                state.shipLoading = true;
            })
            .addCase(shipTransfer.fulfilled, (state, action) => {
                state.shipLoading = false;
                const index = state.transfers.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.transfers[index] = action.payload;
                }
                if (state.currentTransfer?.id === action.payload.id) {
                    state.currentTransfer = action.payload;
                }
                toast.success('Transferencia enviada exitosamente');
            })
            .addCase(shipTransfer.rejected, (state, action) => {
                state.shipLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al enviar transferencia');
            })

            // Receive transfer
            .addCase(receiveTransfer.pending, (state) => {
                state.receiveLoading = true;
            })
            .addCase(receiveTransfer.fulfilled, (state, action) => {
                state.receiveLoading = false;
                const index = state.transfers.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.transfers[index] = action.payload;
                }
                if (state.currentTransfer?.id === action.payload.id) {
                    state.currentTransfer = action.payload;
                }
                toast.success('Transferencia recibida exitosamente');
            })
            .addCase(receiveTransfer.rejected, (state, action) => {
                state.receiveLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al recibir transferencia');
            })

            // Cancel transfer
            .addCase(cancelTransfer.fulfilled, (state, action) => {
                const index = state.transfers.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.transfers[index] = action.payload;
                }
                if (state.currentTransfer?.id === action.payload.id) {
                    state.currentTransfer = action.payload;
                }
                toast.success('Transferencia cancelada');
            })
            .addCase(cancelTransfer.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Error al cancelar transferencia');
            });
    }
});

// Actions
export const { setFilters, clearFilters, clearCurrentTransfer, clearError } = transfersSlice.actions;

// Selectors
export const selectTransfers = (state: { transferencias: TransferState }) => state.transferencias.transfers;
export const selectCurrentTransfer = (state: { transferencias: TransferState }) => state.transferencias.currentTransfer;
export const selectTransfersLoading = (state: { transferencias: TransferState }) => state.transferencias.loading;
export const selectTransfersPagination = (state: { transferencias: TransferState }) => ({
    currentPage: state.transferencias.currentPage,
    totalPages: state.transferencias.totalPages,
    totalTransfers: state.transferencias.totalTransfers
});
export const selectTransferFilters = (state: { transferencias: TransferState }) => state.transferencias.filters;
export const selectTransferActionLoading = (state: { transferencias: TransferState }) => ({
    create: state.transferencias.createLoading,
    update: state.transferencias.updateLoading,
    ship: state.transferencias.shipLoading,
    receive: state.transferencias.receiveLoading
});

export default transfersSlice.reducer;
