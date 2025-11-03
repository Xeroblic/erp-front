import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
  ISupplier,
  ICreateSupplierRequest,
  IUpdateSupplierRequest,
  IAttachCustomersToSupplierRequest,
} from '@/interface/supplier.interface';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

export interface SuppliersState {
  items: ISupplier[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  current: ISupplier | null;
  customers: ICustomerSupplier[];
  customersLoading: boolean;
  attaching: boolean;
  detaching: boolean;
}

const initialState: SuppliersState = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  current: null,
  customers: [],
  customersLoading: false,
  attaching: false,
  detaching: false,
};

const normalizeArray = (payload: any): any[] => {
  const raw = payload?.data ?? payload;
  return Array.isArray(raw) ? raw : [];
};

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;

// Allow per-module API prefix override (e.g. '/api/v1' or '/catalogs')
const SUPPLIERS_PREFIX = (import.meta as any)?.env?.VITE_API_SUPPLIERS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (p: string) => join(SUPPLIERS_PREFIX, p);

export const fetchSuppliers = createAsyncThunk<
  ISupplier[],
  { subsidiaryId: number; search?: string; with_customers?: boolean },
  { rejectValue: string }
>('suppliers/fetchSuppliers', async ({ subsidiaryId, search, with_customers }, { rejectWithValue }) => {
  try {
    const resp = await ApiService.fetchData<{ data?: any[] }>({
      url: ep(`/subsidiaries/${subsidiaryId}/suppliers/`),
      method: 'get',
      params: { q: search || undefined, with_customers: with_customers ? 1 : undefined, per_page: 200 },
      dedupe: true,
      cacheTTLms: 10_000,
    });
    return normalizeArray(resp.data) as ISupplier[];
  } catch (error: any) {
    // Si es un 404 por falta de acceso a subsidiaria, retornar array vacío silenciosamente
    if (error?.response?.status === 404 && error?.response?.data?.message?.includes('No query results for model')) {
      console.warn('⚠️ fetchSuppliers - Usuario sin acceso a subsidiary:', subsidiaryId);
      return [] as ISupplier[]; // Retornar vacío en lugar de error
    }
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los proveedores');
  }
});

export const fetchSupplierById = createAsyncThunk<
  ISupplier,
  { subsidiaryId: number; id: number },
  { rejectValue: string }
>('suppliers/fetchSupplierById', async ({ subsidiaryId, id }, { rejectWithValue }) => {
  try {
    const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${id}/`), method: 'get' });
    return normalizeObject(resp.data) as ISupplier;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo cargar el proveedor');
  }
});

export const createSupplier = createAsyncThunk<
  ISupplier,
  { subsidiaryId: number; data: ICreateSupplierRequest },
  { rejectValue: string }
>('suppliers/createSupplier', async ({ subsidiaryId, data }, { rejectWithValue }) => {
  try {
    const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/`), method: 'post', data });
    return normalizeObject(resp.data) as ISupplier;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo crear el proveedor');
  }
});

export const updateSupplier = createAsyncThunk<
  ISupplier,
  { subsidiaryId: number; data: IUpdateSupplierRequest },
  { rejectValue: string }
>('suppliers/updateSupplier', async ({ subsidiaryId, data }, { rejectWithValue }) => {
  try {
    const { id, ...rest } = data;
    const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${id}/`), method: 'patch', data: rest });
    return normalizeObject(resp.data) as ISupplier;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el proveedor');
  }
});

export const deleteSupplier = createAsyncThunk<
  number,
  { subsidiaryId: number; id: number },
  { rejectValue: string }
>('suppliers/deleteSupplier', async ({ subsidiaryId, id }, { rejectWithValue }) => {
  try {
    await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${id}/`), method: 'delete' });
    return id;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar el proveedor');
  }
});

export const fetchSupplierCustomers = createAsyncThunk<
  ICustomerSupplier[],
  { subsidiaryId: number; supplierId: number; search?: string },
  { rejectValue: string }
>('suppliers/fetchSupplierCustomers', async ({ subsidiaryId, supplierId, search }, { rejectWithValue }) => {
  try {
    const resp = await ApiService.fetchData<{ data?: any[] }>({
      url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${supplierId}/customers/`),
      method: 'get',
      params: { q: search || undefined, per_page: 200 },
      dedupe: true,
      cacheTTLms: 5_000,
    });
    return normalizeArray(resp.data) as ICustomerSupplier[];
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los clientes del proveedor',
    );
  }
});

export const attachCustomersToSupplier = createAsyncThunk<
  ICustomerSupplier[],
  { subsidiaryId: number; supplierId: number; payload: IAttachCustomersToSupplierRequest },
  { rejectValue: string }
>('suppliers/attachCustomersToSupplier', async ({ subsidiaryId, supplierId, payload }, { rejectWithValue, dispatch }) => {
  try {
    await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${supplierId}/attach-customers/`), method: 'post', data: payload });
    const refreshed = await dispatch(fetchSupplierCustomers({ subsidiaryId, supplierId })).unwrap();
    return refreshed;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo asociar clientes');
  }
});

export const detachCustomersFromSupplier = createAsyncThunk<
  ICustomerSupplier[],
  { subsidiaryId: number; supplierId: number; payload: IAttachCustomersToSupplierRequest },
  { rejectValue: string }
>('suppliers/detachCustomersFromSupplier', async ({ subsidiaryId, supplierId, payload }, { rejectWithValue, dispatch }) => {
  try {
    await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/suppliers/${supplierId}/detach-customers/`), method: 'post', data: payload });
    const refreshed = await dispatch(fetchSupplierCustomers({ subsidiaryId, supplierId })).unwrap();
    return refreshed;
  } catch (error: any) {
    return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo desasociar clientes');
  }
});

const suppliersSlice = createSlice({
  name: 'suppliers/suppliersSlice',
  initialState,
  reducers: {
    clearSuppliersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Limpiar items anteriores cuando cambia de subsidiaria
        state.items = [];
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Error al cargar proveedores';
        // Limpiar items cuando hay error (ej: subsidiaria sin acceso)
        state.items = [];
      })
      // Detail
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      // Create
      .addCase(createSupplier.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? 'Error al crear proveedor';
      })
      // Update
      .addCase(updateSupplier.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.updating = false;
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? 'Error al actualizar proveedor';
      })
      // Delete
      .addCase(deleteSupplier.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((s) => s.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? 'Error al eliminar proveedor';
      })
      // Customers of supplier
      .addCase(fetchSupplierCustomers.pending, (state) => {
        state.customersLoading = true;
      })
      .addCase(fetchSupplierCustomers.fulfilled, (state, action) => {
        state.customersLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchSupplierCustomers.rejected, (state, action) => {
        state.customersLoading = false;
        state.error = action.payload ?? 'Error al cargar clientes del proveedor';
      })
      .addCase(attachCustomersToSupplier.pending, (state) => {
        state.attaching = true;
      })
      .addCase(attachCustomersToSupplier.fulfilled, (state, action) => {
        state.attaching = false;
        state.customers = action.payload;
      })
      .addCase(attachCustomersToSupplier.rejected, (state, action) => {
        state.attaching = false;
        state.error = action.payload ?? 'Error al asociar clientes';
      })
      .addCase(detachCustomersFromSupplier.pending, (state) => {
        state.detaching = true;
      })
      .addCase(detachCustomersFromSupplier.fulfilled, (state, action) => {
        state.detaching = false;
        state.customers = action.payload;
      })
      .addCase(detachCustomersFromSupplier.rejected, (state, action) => {
        state.detaching = false;
        state.error = action.payload ?? 'Error al desasociar clientes';
      });
  },
});

export const { clearSuppliersError } = suppliersSlice.actions;
export default suppliersSlice.reducer;
