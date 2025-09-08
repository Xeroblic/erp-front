import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type {
    IQuote,
    ICreateQuoteRequest,
    IUpdateQuoteRequest,
    IConvertQuoteRequest,
    QuoteStatus
} from '@/interface/quotes.interface';

// Estado del slice
export interface QuoteState {
    loading: boolean;
    error?: string;

    // Lista de cotizaciones
    quotes: IQuote[];
    totalQuotes: number;
    currentPage: number;
    totalPages: number;

    // Cotización actual
    currentQuote?: IQuote;

    // Estados específicos para acciones
    createLoading: boolean;
    updateLoading: boolean;
    convertLoading: boolean;
    sendLoading: boolean;

    // Filtros
    filters: {
        status?: QuoteStatus;
        customer_id?: number;
        date_from?: string;
        date_to?: string;
        valid_until_from?: string;
        valid_until_to?: string;
    };

    // Reportes
    conversionReport?: {
        total_quotes: number;
        converted_quotes: number;
        conversion_rate: number;
        total_value: number;
        converted_value: number;
    };
}

const initialState: QuoteState = {
    loading: false,
    quotes: [],
    totalQuotes: 0,
    currentPage: 1,
    totalPages: 1,
    createLoading: false,
    updateLoading: false,
    convertLoading: false,
    sendLoading: false,
    filters: {}
};

// Async thunks
export const fetchQuotes = createAsyncThunk<
    { data: IQuote[]; total: number; page: number; totalPages: number },
    { page?: number; limit?: number; filters?: any },
    { rejectValue: string }
>(
    'quotes/fetchQuotes',
    async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
        try {
            const params = { page, limit, ...filters };

            const response = await ApiService.fetchData<{
                data: IQuote[];
                meta: { total: number; current_page: number; last_page: number };
            }>({
                url: '/quotes',
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
            return rejectWithValue(error.response?.data?.message || 'Error al obtener cotizaciones');
        }
    }
);

export const fetchQuoteById = createAsyncThunk<
    IQuote,
    number,
    { rejectValue: string }
>(
    'quotes/fetchQuoteById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IQuote>({
                url: `/quotes/${id}`,
                method: 'get'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al obtener cotización');
        }
    }
);

export const createQuote = createAsyncThunk<
    IQuote,
    ICreateQuoteRequest,
    { rejectValue: string }
>(
    'quotes/createQuote',
    async (quoteData, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IQuote>({
                url: '/quotes',
                method: 'post',
                data: quoteData
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al crear cotización');
        }
    }
);

export const updateQuote = createAsyncThunk<
    IQuote,
    { id: number; data: IUpdateQuoteRequest },
    { rejectValue: string }
>(
    'quotes/updateQuote',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IQuote>({
                url: `/quotes/${id}`,
                method: 'put',
                data
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al actualizar cotización');
        }
    }
);

export const convertQuoteToSale = createAsyncThunk<
    { quote: IQuote; sale: any },
    { id: number; data?: IConvertQuoteRequest },
    { rejectValue: string }
>(
    'quotes/convertQuoteToSale',
    async ({ id, data = {} }, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<{ quote: IQuote; sale: any }>({
                url: `/quotes/${id}/convert`,
                method: 'post',
                data
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al convertir cotización');
        }
    }
);

export const sendQuote = createAsyncThunk<
    IQuote,
    number,
    { rejectValue: string }
>(
    'quotes/sendQuote',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IQuote>({
                url: `/quotes/${id}/send`,
                method: 'post'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al enviar cotización');
        }
    }
);

export const approveQuote = createAsyncThunk<
    IQuote,
    number,
    { rejectValue: string }
>(
    'quotes/approveQuote',
    async (id, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<IQuote>({
                url: `/quotes/${id}/approve`,
                method: 'post'
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al aprobar cotización');
        }
    }
);

export const fetchConversionReport = createAsyncThunk<
    any,
    { date_from?: string; date_to?: string },
    { rejectValue: string }
>(
    'quotes/fetchConversionReport',
    async (params, { rejectWithValue }) => {
        try {
            const response = await ApiService.fetchData<any>({
                url: '/reports/quotes/conversion',
                method: 'get',
                params
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Error al obtener reporte');
        }
    }
);

// Slice
const cotizacionesSlice = createSlice({
    name: 'cotizaciones',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<QuoteState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        clearCurrentQuote: (state) => {
            state.currentQuote = undefined;
        },
        clearError: (state) => {
            state.error = undefined;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch quotes
            .addCase(fetchQuotes.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchQuotes.fulfilled, (state, action) => {
                state.loading = false;
                state.quotes = action.payload.data;
                state.totalQuotes = action.payload.total;
                state.currentPage = action.payload.page;
                state.totalPages = action.payload.totalPages;
            })
            .addCase(fetchQuotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al cargar cotizaciones');
            })

            // Fetch quote by ID
            .addCase(fetchQuoteById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchQuoteById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentQuote = action.payload;
            })
            .addCase(fetchQuoteById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al cargar cotización');
            })

            // Create quote
            .addCase(createQuote.pending, (state) => {
                state.createLoading = true;
                state.error = undefined;
            })
            .addCase(createQuote.fulfilled, (state, action) => {
                state.createLoading = false;
                state.quotes.unshift(action.payload);
                state.totalQuotes += 1;
                toast.success('Cotización creada exitosamente');
            })
            .addCase(createQuote.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al crear cotización');
            })

            // Update quote
            .addCase(updateQuote.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateQuote.fulfilled, (state, action) => {
                state.updateLoading = false;
                const index = state.quotes.findIndex(q => q.id === action.payload.id);
                if (index !== -1) {
                    state.quotes[index] = action.payload;
                }
                if (state.currentQuote?.id === action.payload.id) {
                    state.currentQuote = action.payload;
                }
                toast.success('Cotización actualizada exitosamente');
            })
            .addCase(updateQuote.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al actualizar cotización');
            })

            // Convert quote to sale
            .addCase(convertQuoteToSale.pending, (state) => {
                state.convertLoading = true;
            })
            .addCase(convertQuoteToSale.fulfilled, (state, action) => {
                state.convertLoading = false;
                const index = state.quotes.findIndex(q => q.id === action.payload.quote.id);
                if (index !== -1) {
                    state.quotes[index] = action.payload.quote;
                }
                if (state.currentQuote?.id === action.payload.quote.id) {
                    state.currentQuote = action.payload.quote;
                }
                toast.success('Cotización convertida a venta exitosamente');
            })
            .addCase(convertQuoteToSale.rejected, (state, action) => {
                state.convertLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al convertir cotización');
            })

            // Send quote
            .addCase(sendQuote.pending, (state) => {
                state.sendLoading = true;
            })
            .addCase(sendQuote.fulfilled, (state, action) => {
                state.sendLoading = false;
                const index = state.quotes.findIndex(q => q.id === action.payload.id);
                if (index !== -1) {
                    state.quotes[index] = action.payload;
                }
                if (state.currentQuote?.id === action.payload.id) {
                    state.currentQuote = action.payload;
                }
                toast.success('Cotización enviada exitosamente');
            })
            .addCase(sendQuote.rejected, (state, action) => {
                state.sendLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Error al enviar cotización');
            })

            // Conversion report
            .addCase(fetchConversionReport.fulfilled, (state, action) => {
                state.conversionReport = action.payload;
            });
    }
});

// Actions
export const { setFilters, clearFilters, clearCurrentQuote, clearError } = cotizacionesSlice.actions;

// Selectors
export const selectQuotes = (state: { cotizaciones: QuoteState }) => state.cotizaciones.quotes;
export const selectCurrentQuote = (state: { cotizaciones: QuoteState }) => state.cotizaciones.currentQuote;
export const selectQuotesLoading = (state: { cotizaciones: QuoteState }) => state.cotizaciones.loading;
export const selectQuotesPagination = (state: { cotizaciones: QuoteState }) => ({
    currentPage: state.cotizaciones.currentPage,
    totalPages: state.cotizaciones.totalPages,
    totalQuotes: state.cotizaciones.totalQuotes
});
export const selectQuoteFilters = (state: { cotizaciones: QuoteState }) => state.cotizaciones.filters;
export const selectQuoteActionLoading = (state: { cotizaciones: QuoteState }) => ({
    create: state.cotizaciones.createLoading,
    update: state.cotizaciones.updateLoading,
    convert: state.cotizaciones.convertLoading,
    send: state.cotizaciones.sendLoading
});
export const selectConversionReport = (state: { cotizaciones: QuoteState }) => state.cotizaciones.conversionReport;

export default cotizacionesSlice.reducer;
