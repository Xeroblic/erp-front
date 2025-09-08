import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type {
    IInventoryMovement,
    MovementType,
    IInventoryItem,
    IInventoryRequest,
    IInventoryUpdateRequest,
    IInventoryResponse,
    IInventoryItemResponse,
    IStockLevel,
    IStockAlert
} from '@/interface/inventory.interface';
import ApiService from '@/services/ApiService';
import { showErrorToast, showSuccessToast } from '@/utils/toast.utils';

// Tipos para el estado del slice
interface InventoryState {
    movements: IInventoryMovement[];
    items: IInventoryItem[];
    stockLevels: IStockLevel[];
    stockAlerts: IStockAlert[];
    currentMovement: IInventoryMovement | null;
    currentItem: IInventoryItem | null;
    loading: {
        movements: boolean;
        items: boolean;
        stockLevels: boolean;
        stockAlerts: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        adjust: boolean;
        transfer: boolean;
    };
    pagination: {
        movements: {
            currentPage: number;
            totalPages: number;
            total: number;
            perPage: number;
        };
        items: {
            currentPage: number;
            totalPages: number;
            total: number;
            perPage: number;
        };
    };
    filters: {
        movement_type?: MovementType;
        product_id?: string;
        warehouse_id?: string;
        date_from?: string;
        date_to?: string;
        reference_type?: string;
        reference_id?: string;
        low_stock_only?: boolean;
        out_of_stock_only?: boolean;
    };
    statistics: {
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        totalMovements: number;
        recentMovements: number;
    };
}

// Estado inicial
const initialState: InventoryState = {
    movements: [],
    items: [],
    stockLevels: [],
    stockAlerts: [],
    currentMovement: null,
    currentItem: null,
    loading: {
        movements: false,
        items: false,
        stockLevels: false,
        stockAlerts: false,
        create: false,
        update: false,
        delete: false,
        adjust: false,
        transfer: false,
    },
    pagination: {
        movements: {
            currentPage: 1,
            totalPages: 1,
            total: 0,
            perPage: 20,
        },
        items: {
            currentPage: 1,
            totalPages: 1,
            total: 0,
            perPage: 20,
        },
    },
    filters: {},
    statistics: {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalMovements: 0,
        recentMovements: 0,
    },
};

// Async thunks para movimientos
export const fetchInventoryMovements = createAsyncThunk(
    'inventory/fetchMovements',
    async (params: {
        page?: number;
        perPage?: number;
        filters?: InventoryState['filters'];
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

            const response = await ApiService.get<IInventoryResponse>(
                `/inventory/movements?${queryParams.toString()}`
            );

            return response.data;
        } catch (error: any) {
            showErrorToast('Error al cargar movimientos de inventario');
            throw error;
        }
    }
);

export const fetchInventoryItems = createAsyncThunk(
    'inventory/fetchItems',
    async (params: {
        page?: number;
        perPage?: number;
        filters?: InventoryState['filters'];
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

            const response = await ApiService.get<IInventoryItemResponse>(
                `/inventory/items?${queryParams.toString()}`
            );

            return response.data;
        } catch (error: any) {
            showErrorToast('Error al cargar items de inventario');
            throw error;
        }
    }
);

export const fetchStockLevels = createAsyncThunk(
    'inventory/fetchStockLevels',
    async (warehouseId?: number) => {
        try {
            const url = warehouseId
                ? `/inventory/stock-levels?warehouse_id=${warehouseId}`
                : '/inventory/stock-levels';

            const response = await ApiService.get(url);
            return response.data.data;
        } catch (error: any) {
            showErrorToast('Error al cargar niveles de stock');
            throw error;
        }
    }
);

export const fetchStockAlerts = createAsyncThunk(
    'inventory/fetchStockAlerts',
    async () => {
        try {
            const response = await ApiService.get('/inventory/stock-alerts');
            return response.data.data;
        } catch (error: any) {
            showErrorToast('Error al cargar alertas de stock');
            throw error;
        }
    }
);

export const createInventoryMovement = createAsyncThunk(
    'inventory/createMovement',
    async (data: IInventoryRequest) => {
        try {
            const response = await ApiService.post<{ data: IInventoryMovement }>(
                '/inventory/movements',
                data
            );
            showSuccessToast('Movimiento de inventario creado exitosamente');
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al crear el movimiento';
            showErrorToast(message);
            throw error;
        }
    }
);

export const adjustInventory = createAsyncThunk(
    'inventory/adjustInventory',
    async (data: {
        product_id: number;
        warehouse_id: number;
        quantity_change: number;
        reason: string;
        notes?: string;
    }) => {
        try {
            const response = await ApiService.post<{ data: IInventoryMovement }>(
                '/inventory/adjust',
                data
            );
            showSuccessToast('Ajuste de inventario realizado exitosamente');
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al ajustar el inventario';
            showErrorToast(message);
            throw error;
        }
    }
);

export const transferInventory = createAsyncThunk(
    'inventory/transferInventory',
    async (data: {
        product_id: number;
        from_warehouse_id: number;
        to_warehouse_id: number;
        quantity: number;
        notes?: string;
    }) => {
        try {
            const response = await ApiService.post<{ data: IInventoryMovement[] }>(
                '/inventory/transfer',
                data
            );
            showSuccessToast('Transferencia de inventario realizada exitosamente');
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al transferir el inventario';
            showErrorToast(message);
            throw error;
        }
    }
);

export const updateStockLevels = createAsyncThunk(
    'inventory/updateStockLevels',
    async (data: {
        product_id: number;
        warehouse_id: number;
        min_stock: number;
        max_stock: number;
        reorder_point: number;
    }) => {
        try {
            const response = await ApiService.put(
                `/inventory/stock-levels/${data.product_id}/${data.warehouse_id}`,
                data
            );
            showSuccessToast('Niveles de stock actualizados exitosamente');
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al actualizar niveles de stock';
            showErrorToast(message);
            throw error;
        }
    }
);

export const performStockCount = createAsyncThunk(
    'inventory/performStockCount',
    async (data: {
        warehouse_id: number;
        counts: Array<{
            product_id: number;
            physical_count: number;
            notes?: string;
        }>;
    }) => {
        try {
            const response = await ApiService.post('/inventory/stock-count', data);
            showSuccessToast('Conteo físico registrado exitosamente');
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Error al registrar el conteo físico';
            showErrorToast(message);
            throw error;
        }
    }
);

export const fetchInventoryStatistics = createAsyncThunk(
    'inventory/fetchStatistics',
    async (warehouseId?: number) => {
        try {
            const url = warehouseId
                ? `/inventory/statistics?warehouse_id=${warehouseId}`
                : '/inventory/statistics';

            const response = await ApiService.get(url);
            return response.data.data;
        } catch (error: any) {
            showErrorToast('Error al cargar estadísticas de inventario');
            throw error;
        }
    }
);

// Slice
export const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        setCurrentMovement: (state, action: PayloadAction<IInventoryMovement | null>) => {
            state.currentMovement = action.payload;
        },
        clearCurrentMovement: (state) => {
            state.currentMovement = null;
        },
        setCurrentItem: (state, action: PayloadAction<IInventoryItem | null>) => {
            state.currentItem = action.payload;
        },
        clearCurrentItem: (state) => {
            state.currentItem = null;
        },
        updateStockLevel: (state, action: PayloadAction<IStockLevel>) => {
            const index = state.stockLevels.findIndex(
                level => level.product_id === action.payload.product_id &&
                    level.warehouse_id === action.payload.warehouse_id
            );
            if (index !== -1) {
                state.stockLevels[index] = action.payload;
            } else {
                state.stockLevels.push(action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch movements
            .addCase(fetchInventoryMovements.pending, (state) => {
                state.loading.movements = true;
            })
            .addCase(fetchInventoryMovements.fulfilled, (state, action) => {
                state.loading.movements = false;
                state.movements = action.payload.data;
                state.pagination.movements = {
                    currentPage: action.payload.current_page,
                    totalPages: action.payload.last_page,
                    total: action.payload.total,
                    perPage: action.payload.per_page,
                };
            })
            .addCase(fetchInventoryMovements.rejected, (state) => {
                state.loading.movements = false;
                state.movements = [];
            })

            // Fetch items
            .addCase(fetchInventoryItems.pending, (state) => {
                state.loading.items = true;
            })
            .addCase(fetchInventoryItems.fulfilled, (state, action) => {
                state.loading.items = false;
                state.items = action.payload.data;
                state.pagination.items = {
                    currentPage: action.payload.current_page,
                    totalPages: action.payload.last_page,
                    total: action.payload.total,
                    perPage: action.payload.per_page,
                };
            })
            .addCase(fetchInventoryItems.rejected, (state) => {
                state.loading.items = false;
                state.items = [];
            })

            // Fetch stock levels
            .addCase(fetchStockLevels.pending, (state) => {
                state.loading.stockLevels = true;
            })
            .addCase(fetchStockLevels.fulfilled, (state, action) => {
                state.loading.stockLevels = false;
                state.stockLevels = action.payload;
            })
            .addCase(fetchStockLevels.rejected, (state) => {
                state.loading.stockLevels = false;
            })

            // Fetch stock alerts
            .addCase(fetchStockAlerts.pending, (state) => {
                state.loading.stockAlerts = true;
            })
            .addCase(fetchStockAlerts.fulfilled, (state, action) => {
                state.loading.stockAlerts = false;
                state.stockAlerts = action.payload;
            })
            .addCase(fetchStockAlerts.rejected, (state) => {
                state.loading.stockAlerts = false;
            })

            // Create movement
            .addCase(createInventoryMovement.pending, (state) => {
                state.loading.create = true;
            })
            .addCase(createInventoryMovement.fulfilled, (state, action) => {
                state.loading.create = false;
                state.movements.unshift(action.payload);
                state.pagination.movements.total += 1;
            })
            .addCase(createInventoryMovement.rejected, (state) => {
                state.loading.create = false;
            })

            // Adjust inventory
            .addCase(adjustInventory.pending, (state) => {
                state.loading.adjust = true;
            })
            .addCase(adjustInventory.fulfilled, (state, action) => {
                state.loading.adjust = false;
                state.movements.unshift(action.payload);
                state.pagination.movements.total += 1;
            })
            .addCase(adjustInventory.rejected, (state) => {
                state.loading.adjust = false;
            })

            // Transfer inventory
            .addCase(transferInventory.pending, (state) => {
                state.loading.transfer = true;
            })
            .addCase(transferInventory.fulfilled, (state, action) => {
                state.loading.transfer = false;
                // Agregar ambos movimientos (salida y entrada)
                state.movements = [...action.payload, ...state.movements];
                state.pagination.movements.total += action.payload.length;
            })
            .addCase(transferInventory.rejected, (state) => {
                state.loading.transfer = false;
            })

            // Update stock levels
            .addCase(updateStockLevels.fulfilled, (state, action) => {
                const index = state.stockLevels.findIndex(
                    level => level.product_id === action.payload.product_id &&
                        level.warehouse_id === action.payload.warehouse_id
                );
                if (index !== -1) {
                    state.stockLevels[index] = action.payload;
                }
            })

            // Fetch statistics
            .addCase(fetchInventoryStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload;
            });
    },
});

// Actions
export const {
    setFilters,
    clearFilters,
    setCurrentMovement,
    clearCurrentMovement,
    setCurrentItem,
    clearCurrentItem,
    updateStockLevel,
} = inventorySlice.actions;

// Selectors
export const selectInventoryMovements = (state: RootState) => state.inventario.movements;
export const selectInventoryItems = (state: RootState) => state.inventario.items;
export const selectStockLevels = (state: RootState) => state.inventario.stockLevels;
export const selectStockAlerts = (state: RootState) => state.inventario.stockAlerts;
export const selectCurrentMovement = (state: RootState) => state.inventario.currentMovement;
export const selectCurrentItem = (state: RootState) => state.inventario.currentItem;
export const selectInventoryLoading = (state: RootState) => state.inventario.loading;
export const selectInventoryPagination = (state: RootState) => state.inventario.pagination;
export const selectInventoryFilters = (state: RootState) => state.inventario.filters;
export const selectInventoryStatistics = (state: RootState) => state.inventario.statistics;

// Specific loading selectors
export const selectInventoryActionLoading = (state: RootState) => ({
    create: state.inventario.loading.create,
    update: state.inventario.loading.update,
    delete: state.inventario.loading.delete,
    adjust: state.inventario.loading.adjust,
    transfer: state.inventario.loading.transfer,
});

export default inventorySlice.reducer;
