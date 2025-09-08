import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import type {
    ISale,
    SaleStatus,
    ISaleItem,
    ISaleRequest,
    ISaleUpdateRequest,
    ISalesResponse,
    ISaleResponse
} from '@/interface/sales.interface';
import ApiService from '@/services/ApiService';

// Tipos para el estado del slice
interface SalesState {
    sales: ISale[];
    currentSale: ISale | null;
    loading: {
        fetch: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        invoice: boolean;
        payment: boolean;
        ship: boolean;
        cancel: boolean;
    };
    pagination: {
        currentPage: number;
        totalPages: number;
        totalSales: number;
        perPage: number;
    };
    filters: {
        status?: SaleStatus;
        customer_id?: string;
        sale_date_from?: string;
        sale_date_to?: string;
        delivery_date_from?: string;
        delivery_date_to?: string;
        salesperson_id?: string;
        min_amount?: number;
        max_amount?: number;
    };
    statistics: {
        totalSalesAmount: number;
        totalSalesCount: number;
        pendingSales: number;
        deliveredSales: number;
        cancelledSales: number;
        monthlyGrowth: number;
    };
}

// Estado inicial
const initialState: SalesState = {
    sales: [],
    currentSale: null,
    loading: {
        fetch: false,
        create: false,
        update: false,
        delete: false,
        invoice: false,
        payment: false,
        ship: false,
        cancel: false,
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalSales: 0,
        perPage: 20,
    },
    filters: {},
    statistics: {
        totalSalesAmount: 0,
        totalSalesCount: 0,
        pendingSales: 0,
        deliveredSales: 0,
        cancelledSales: 0,
        monthlyGrowth: 0,
    },
};

// Async thunks
export const fetchSales = createAsyncThunk(
    'sales/fetchSales',
    async (params: {
        page?: number;
        perPage?: number;
        filters?: SalesState['filters'];
    } = {}) => {
        try {
            const { page = 1, perPage = 20, filters = {} } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                ...Object.fromEntries(
                    Object.entries(filters)
                        .filter(([_, value]) => value !== undefined && value !== '')
                        .map(([key, value]) => [key, value!.toString()])
                ),
            });

            const response = await ApiService.get<ISalesResponse>(
                `/sales?${queryParams.toString()}`
            );

            return response.data;
        } catch (error: any) {
            toast.error('Error al cargar las ventas');
            throw error;
        }
    }
);

export const fetchSaleById = createAsyncThunk(
    'sales/fetchSaleById',
    async (id: number) => {
        try {
            const response = await ApiService.get<ISaleResponse>(`/sales/${id}`);
            return response.data;
        } catch (error: any) {
            toast.error('Error al cargar la venta');
            throw error;
        }
    }
);

export const createSale = createAsyncThunk(
    'sales/createSale',
    async (data: ISaleRequest) => {
        try {
            const response = await ApiService.post<ISaleResponse>('/sales', data);
            toast.success('Venta creada exitosamente');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al crear la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const updateSale = createAsyncThunk(
    'sales/updateSale',
    async ({ id, data }: { id: number; data: ISaleUpdateRequest }) => {
        try {
            const response = await ApiService.put<ISaleResponse>(`/sales/${id}`, data);
            showSuccessToast('Venta actualizada exitosamente');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al actualizar la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const deleteSale = createAsyncThunk(
    'sales/deleteSale',
    async (id: number) => {
        try {
            await ApiService.delete(`/sales/${id}`);
            showSuccessToast('Venta eliminada exitosamente');
            return id;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al eliminar la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const generateInvoice = createAsyncThunk(
    'sales/generateInvoice',
    async (id: number) => {
        try {
            const response = await ApiService.post<ISaleResponse>(`/sales/${id}/invoice`);
            showSuccessToast('Factura generada exitosamente');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al generar la factura';
            showErrorToast(message);
            throw error;
        }
    }
);

export const recordPayment = createAsyncThunk(
    'sales/recordPayment',
    async ({
        id,
        data
    }: {
        id: number;
        data: {
            amount: number;
            payment_method: string;
            payment_date: string;
            reference?: string;
            notes?: string;
        };
    }) => {
        try {
            const response = await ApiService.post<ISaleResponse>(
                `/sales/${id}/payments`,
                data
            );
            showSuccessToast('Pago registrado exitosamente');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al registrar el pago';
            showErrorToast(message);
            throw error;
        }
    }
);

export const shipSale = createAsyncThunk(
    'sales/shipSale',
    async ({
        id,
        data
    }: {
        id: number;
        data: {
            tracking_number?: string;
            carrier?: string;
            shipped_date: string;
            expected_delivery_date?: string;
            notes?: string;
        };
    }) => {
        try {
            const response = await ApiService.post<ISaleResponse>(
                `/sales/${id}/ship`,
                data
            );
            showSuccessToast('Venta marcada como enviada');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al enviar la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const deliverSale = createAsyncThunk(
    'sales/deliverSale',
    async ({
        id,
        data
    }: {
        id: number;
        data: {
            delivered_date: string;
            received_by?: string;
            notes?: string;
        };
    }) => {
        try {
            const response = await ApiService.post<ISaleResponse>(
                `/sales/${id}/deliver`,
                data
            );
            showSuccessToast('Venta marcada como entregada');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al entregar la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const cancelSale = createAsyncThunk(
    'sales/cancelSale',
    async ({
        id,
        data
    }: {
        id: number;
        data: {
            reason: string;
            refund_amount?: number;
            notes?: string;
        };
    }) => {
        try {
            const response = await ApiService.post<ISaleResponse>(
                `/sales/${id}/cancel`,
                data
            );
            showSuccessToast('Venta cancelada exitosamente');
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al cancelar la venta';
            showErrorToast(message);
            throw error;
        }
    }
);

export const fetchSalesStatistics = createAsyncThunk(
    'sales/fetchStatistics',
    async (params: { period?: 'day' | 'week' | 'month' | 'year' } = {}) => {
        try {
            const { period = 'month' } = params;
            const response = await ApiService.get(`/sales/statistics?period=${period}`);
            return response.data.data;
        } catch (error: any) {
            showErrorToast('Error al cargar las estadísticas');
            throw error;
        }
    }
);

// Slice
const ventasSlice = createSlice({
    name: 'ventas',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        setCurrentSale: (state, action: PayloadAction<ISale | null>) => {
            state.currentSale = action.payload;
        },
        clearCurrentSale: (state) => {
            state.currentSale = null;
        },
        updateSaleItem: (state, action: PayloadAction<{ saleId: number; item: ISaleItem }>) => {
            const { saleId, item } = action.payload;
            const sale = state.sales.find(s => s.id === saleId);
            if (sale) {
                const itemIndex = sale.items.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                    sale.items[itemIndex] = item;
                    // Recalcular total
                    sale.total_amount = sale.items.reduce(
                        (total, item) => total + (item.price * item.quantity), 0
                    );
                }
            }

            if (state.currentSale && state.currentSale.id === saleId) {
                const itemIndex = state.currentSale.items.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                    state.currentSale.items[itemIndex] = item;
                    state.currentSale.total_amount = state.currentSale.items.reduce(
                        (total, item) => total + (item.price * item.quantity), 0
                    );
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch sales
            .addCase(fetchSales.pending, (state) => {
                state.loading.fetch = true;
            })
            .addCase(fetchSales.fulfilled, (state, action) => {
                state.loading.fetch = false;
                state.sales = action.payload.data;
                state.pagination = {
                    currentPage: action.payload.current_page,
                    totalPages: action.payload.last_page,
                    totalSales: action.payload.total,
                    perPage: action.payload.per_page,
                };
            })
            .addCase(fetchSales.rejected, (state) => {
                state.loading.fetch = false;
                state.sales = [];
            })

            // Fetch sale by ID
            .addCase(fetchSaleById.pending, (state) => {
                state.loading.fetch = true;
            })
            .addCase(fetchSaleById.fulfilled, (state, action) => {
                state.loading.fetch = false;
                state.currentSale = action.payload.data;
            })
            .addCase(fetchSaleById.rejected, (state) => {
                state.loading.fetch = false;
                state.currentSale = null;
            })

            // Create sale
            .addCase(createSale.pending, (state) => {
                state.loading.create = true;
            })
            .addCase(createSale.fulfilled, (state, action) => {
                state.loading.create = false;
                state.sales.unshift(action.payload.data);
                state.pagination.totalSales += 1;
            })
            .addCase(createSale.rejected, (state) => {
                state.loading.create = false;
            })

            // Update sale
            .addCase(updateSale.pending, (state) => {
                state.loading.update = true;
            })
            .addCase(updateSale.fulfilled, (state, action) => {
                state.loading.update = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(updateSale.rejected, (state) => {
                state.loading.update = false;
            })

            // Delete sale
            .addCase(deleteSale.pending, (state) => {
                state.loading.delete = true;
            })
            .addCase(deleteSale.fulfilled, (state, action) => {
                state.loading.delete = false;
                state.sales = state.sales.filter(s => s.id !== action.payload);
                state.pagination.totalSales -= 1;
                if (state.currentSale?.id === action.payload) {
                    state.currentSale = null;
                }
            })
            .addCase(deleteSale.rejected, (state) => {
                state.loading.delete = false;
            })

            // Generate invoice
            .addCase(generateInvoice.pending, (state) => {
                state.loading.invoice = true;
            })
            .addCase(generateInvoice.fulfilled, (state, action) => {
                state.loading.invoice = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(generateInvoice.rejected, (state) => {
                state.loading.invoice = false;
            })

            // Record payment
            .addCase(recordPayment.pending, (state) => {
                state.loading.payment = true;
            })
            .addCase(recordPayment.fulfilled, (state, action) => {
                state.loading.payment = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(recordPayment.rejected, (state) => {
                state.loading.payment = false;
            })

            // Ship sale
            .addCase(shipSale.pending, (state) => {
                state.loading.ship = true;
            })
            .addCase(shipSale.fulfilled, (state, action) => {
                state.loading.ship = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(shipSale.rejected, (state) => {
                state.loading.ship = false;
            })

            // Deliver sale
            .addCase(deliverSale.pending, (state) => {
                state.loading.ship = true;
            })
            .addCase(deliverSale.fulfilled, (state, action) => {
                state.loading.ship = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(deliverSale.rejected, (state) => {
                state.loading.ship = false;
            })

            // Cancel sale
            .addCase(cancelSale.pending, (state) => {
                state.loading.cancel = true;
            })
            .addCase(cancelSale.fulfilled, (state, action) => {
                state.loading.cancel = false;
                const index = state.sales.findIndex(s => s.id === action.payload.data.id);
                if (index !== -1) {
                    state.sales[index] = action.payload.data;
                }
                if (state.currentSale?.id === action.payload.data.id) {
                    state.currentSale = action.payload.data;
                }
            })
            .addCase(cancelSale.rejected, (state) => {
                state.loading.cancel = false;
            })

            // Fetch statistics
            .addCase(fetchSalesStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            });
    },
});

// Actions
export const {
    setFilters,
    clearFilters,
    setCurrentSale,
    clearCurrentSale,
    updateSaleItem,
} = ventasSlice.actions;

// Selectors
export const selectSales = (state: RootState) => state.ventas.sales;
export const selectCurrentSale = (state: RootState) => state.ventas.currentSale;
export const selectSalesLoading = (state: RootState) => state.ventas.loading;
export const selectSalesPagination = (state: RootState) => state.ventas.pagination;
export const selectSaleFilters = (state: RootState) => state.ventas.filters;
export const selectSalesStatistics = (state: RootState) => state.ventas.statistics;

// Loading selectors
export const selectSalesFetching = (state: RootState) => state.ventas.loading.fetch;
export const selectSaleActionLoading = (state: RootState) => ({
    create: state.ventas.loading.create,
    update: state.ventas.loading.update,
    delete: state.ventas.loading.delete,
    invoice: state.ventas.loading.invoice,
    payment: state.ventas.loading.payment,
    ship: state.ventas.loading.ship,
    cancel: state.ventas.loading.cancel,
});

export default ventasSlice.reducer;
