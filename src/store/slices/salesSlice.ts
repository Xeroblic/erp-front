import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import type { RootState } from '@/store/rootReducer';
import salesService, {
  type SalesListFilters,
  type CloseSaleResponse,
} from '@/services/salesService';
import type { ISale, ISaleItem, ICloseSaleRequest } from '@/interface/sales.interface';

type CloseSalePayloadItem = ICloseSaleRequest['items'][number];
type SaleDetail = ISale;
type SaleListItem = ISale;
type SaleItem = ISaleItem;

export interface SalesState {
  list: SaleListItem[];
  detail: SaleDetail | null;
  items: SaleItem[];
  loading: boolean;
  error?: string | null;
}

const initialState: SalesState = {
  list: [],
  detail: null,
  items: [],
  loading: false,
  error: null,
};

export const loadSalesList = createAsyncThunk<
  SaleListItem[],
  { subsidiaryId: number; filters?: SalesListFilters },
  { rejectValue: string }
>('salesModule/loadSalesList', async ({ subsidiaryId, filters = {} }, { rejectWithValue }) => {
  try {
    const { data } = await salesService.fetchSalesList(subsidiaryId, filters);
    return data ?? [];
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Error al cargar ventas');
  }
});

export const loadSaleDetail = createAsyncThunk<
  SaleDetail,
  { subsidiaryId: number; saleId: number },
  { rejectValue: string }
>('salesModule/loadSaleDetail', async ({ subsidiaryId, saleId }, { rejectWithValue }) => {
  try {
    const data = await salesService.fetchSaleDetail(subsidiaryId, saleId);
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Error al cargar detalle de venta');
  }
});

export const loadSaleItems = createAsyncThunk<
  SaleItem[],
  { subsidiaryId: number; saleId: number },
  { rejectValue: string }
>('salesModule/loadSaleItems', async ({ subsidiaryId, saleId }, { rejectWithValue }) => {
  try {
    const data = await salesService.fetchSaleItems(subsidiaryId, saleId);
    return data ?? [];
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Error al cargar ítems de la venta');
  }
});

export const closeSaleThunk = createAsyncThunk<
  CloseSaleResponse,
  { subsidiaryId: number; saleId: number; items: CloseSalePayloadItem[] },
  { rejectValue: string }
>('salesModule/closeSale', async ({ subsidiaryId, saleId, items }, { rejectWithValue }) => {
  try {
    const data = await salesService.closeSale(subsidiaryId, saleId, { items });
    return data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0] ||
      'Error al cerrar la venta';
    return rejectWithValue(message);
  }
});

const salesSlice = createSlice({
  name: 'salesModule',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearDetail(state) {
      state.detail = null;
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(loadSalesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSalesList.fulfilled, (state, action: PayloadAction<SaleListItem[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(loadSalesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar ventas';
      })
      // Detail
      .addCase(loadSaleDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSaleDetail.fulfilled, (state, action: PayloadAction<SaleDetail>) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(loadSaleDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar detalle de venta';
      })
      // Items
      .addCase(loadSaleItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSaleItems.fulfilled, (state, action: PayloadAction<SaleItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadSaleItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar ítems de la venta';
      })
      // Close sale
      .addCase(closeSaleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeSaleThunk.fulfilled, (state, action: PayloadAction<CloseSaleResponse>) => {
        state.loading = false;
        toast.success(action.payload?.message || 'Venta cerrada correctamente');
      })
      .addCase(closeSaleThunk.rejected, (state, action) => {
        state.loading = false;
        const msg = action.payload || 'Error al cerrar la venta';
        state.error = msg;
        toast.error(String(msg));
      });
  },
});

export const { clearError, clearDetail } = salesSlice.actions;

// Selectors
export const selectSalesList = (state: RootState) => (state as any).salesModule?.list ?? [];
export const selectSaleDetail = (state: RootState) => (state as any).salesModule?.detail ?? null;
export const selectSaleItems = (state: RootState) => (state as any).salesModule?.items ?? [];
export const selectSalesLoading = (state: RootState) => Boolean((state as any).salesModule?.loading);
export const selectSalesError = (state: RootState) => (state as any).salesModule?.error ?? null;

export default salesSlice.reducer;

