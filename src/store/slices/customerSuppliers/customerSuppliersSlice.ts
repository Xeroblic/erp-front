import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	ICustomerSupplier,
	ICreateCustomerSupplierRequest,
	IUpdateCustomerSupplierRequest,
	IAttachSuppliersToCustomerSupplierRequest,
} from '@/interface/customerSupplier.interface';
import type { ISupplier } from '@/interface/supplier.interface';

export interface CustomerSuppliersState {
	items: ICustomerSupplier[];
	loading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	error: string | null;
	current: ICustomerSupplier | null;
	suppliers: ISupplier[];
	suppliersLoading: boolean;
	attaching: boolean;
	detaching: boolean;
}

const initialState: CustomerSuppliersState = {
	items: [],
	loading: false,
	creating: false,
	updating: false,
	deleting: false,
	error: null,
	current: null,
	suppliers: [],
	suppliersLoading: false,
	attaching: false,
	detaching: false,
};

const normalizeArray = (payload: any): any[] => {
	const raw = payload?.data ?? payload;
	return Array.isArray(raw) ? raw : [];
};
const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;

// Allow per-module API prefix override
const CUSTOMER_SUPPLIERS_PREFIX = (import.meta as any)?.env?.VITE_API_CUSTOMER_SUPPLIERS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (p: string) => join(CUSTOMER_SUPPLIERS_PREFIX, p);

export const fetchCustomerSuppliers = createAsyncThunk<
	ICustomerSupplier[],
	{ subsidiaryId: number; search?: string; with_suppliers?: boolean },
	{ rejectValue: string }
>('customerSuppliers/fetchList', async ({ subsidiaryId, search, with_suppliers }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ data?: any[] }>({
			url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/`),
			method: 'get',
			params: { q: search || undefined, with_suppliers: with_suppliers ? 1 : undefined, per_page: 200 },
			dedupe: true,
			cacheTTLms: 10_000,
		});
		return normalizeArray(resp.data) as ICustomerSupplier[];
	} catch (error: any) {
		// Si es un 404 por falta de acceso a subsidiaria, retornar array vacío silenciosamente
		if (error?.response?.status === 404 && error?.response?.data?.message?.includes('No query results for model')) {
			console.warn('⚠️ fetchCustomerSuppliers - Usuario sin acceso a subsidiary:', subsidiaryId);
			return [] as ICustomerSupplier[]; // Retornar vacío en lugar de error
		}
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los clientes-proveedor');
	}
});

export const fetchCustomerSupplierById = createAsyncThunk<
	ICustomerSupplier,
	{ subsidiaryId: number; id: number },
	{ rejectValue: string }
>('customerSuppliers/fetchById', async ({ subsidiaryId, id }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${id}/`), method: 'get' });
		return normalizeObject(resp.data) as ICustomerSupplier;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo cargar el cliente-proveedor');
	}
});

export const createCustomerSupplier = createAsyncThunk<
	ICustomerSupplier,
	{ subsidiaryId: number; data: ICreateCustomerSupplierRequest },
	{ rejectValue: string }
>('customerSuppliers/create', async ({ subsidiaryId, data }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/`), method: 'post', data });
		return normalizeObject(resp.data) as ICustomerSupplier;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo crear el cliente-proveedor');
	}
});

export const updateCustomerSupplier = createAsyncThunk<
	ICustomerSupplier,
	{ subsidiaryId: number; data: IUpdateCustomerSupplierRequest },
	{ rejectValue: string }
>('customerSuppliers/update', async ({ subsidiaryId, data }, { rejectWithValue }) => {
	try {
		const { id, ...rest } = data;
		const resp = await ApiService.fetchData<{ data?: any }>({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${id}/`), method: 'patch', data: rest });
		return normalizeObject(resp.data) as ICustomerSupplier;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el cliente-proveedor');
	}
});

export const deleteCustomerSupplier = createAsyncThunk<
	number,
	{ subsidiaryId: number; id: number },
	{ rejectValue: string }
>('customerSuppliers/delete', async ({ subsidiaryId, id }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${id}/`), method: 'delete' });
		return id;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar el cliente-proveedor');
	}
});

export const fetchSuppliersOfCustomerSupplier = createAsyncThunk<
	ISupplier[],
	{ subsidiaryId: number; customerSupplierId: number; search?: string },
	{ rejectValue: string }
>('customerSuppliers/fetchSuppliers', async ({ subsidiaryId, customerSupplierId, search }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ data?: any[] }>({
			url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${customerSupplierId}/suppliers/`),
			method: 'get',
			params: { q: search || undefined, per_page: 200 },
			dedupe: true,
			cacheTTLms: 5_000,
		});
		return normalizeArray(resp.data) as ISupplier[];
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar los proveedores del cliente-proveedor');
	}
});

export const attachSuppliersToCustomerSupplier = createAsyncThunk<
	ISupplier[],
	{ subsidiaryId: number; customerSupplierId: number; payload: IAttachSuppliersToCustomerSupplierRequest },
	{ rejectValue: string }
>('customerSuppliers/attachSuppliers', async ({ subsidiaryId, customerSupplierId, payload }, { rejectWithValue, dispatch }) => {
	try {
		await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${customerSupplierId}/attach-suppliers/`), method: 'post', data: payload });
		const refreshed = await dispatch(fetchSuppliersOfCustomerSupplier({ subsidiaryId, customerSupplierId })).unwrap();
		return refreshed;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo asociar proveedores');
	}
});

export const detachSuppliersFromCustomerSupplier = createAsyncThunk<
	ISupplier[],
	{ subsidiaryId: number; customerSupplierId: number; payload: IAttachSuppliersToCustomerSupplierRequest },
	{ rejectValue: string }
>('customerSuppliers/detachSuppliers', async ({ subsidiaryId, customerSupplierId, payload }, { rejectWithValue, dispatch }) => {
	try {
		await ApiService.fetchData({ url: ep(`/subsidiaries/${subsidiaryId}/customer-suppliers/${customerSupplierId}/detach-suppliers/`), method: 'post', data: payload });
		const refreshed = await dispatch(fetchSuppliersOfCustomerSupplier({ subsidiaryId, customerSupplierId })).unwrap();
		return refreshed;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message ?? error?.message ?? 'No se pudo desasociar proveedores');
	}
});

const customerSuppliersSlice = createSlice({
	name: 'customerSuppliers/customerSuppliersSlice',
	initialState,
	reducers: {
		clearCustomerSuppliersError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// List
			.addCase(fetchCustomerSuppliers.pending, (state) => {
				state.loading = true;
				state.error = null;
				// Limpiar items anteriores cuando cambia de subsidiaria
				state.items = [];
			})
			.addCase(fetchCustomerSuppliers.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload;
			})
			.addCase(fetchCustomerSuppliers.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al cargar clientes-proveedor';
				// Limpiar items cuando hay error (ej: subsidiaria sin acceso)
				state.items = [];
			})
			// Detail
			.addCase(fetchCustomerSupplierById.fulfilled, (state, action) => {
				state.current = action.payload;
			})
			// Create
			.addCase(createCustomerSupplier.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createCustomerSupplier.fulfilled, (state, action) => {
				state.creating = false;
				state.items.unshift(action.payload);
			})
			.addCase(createCustomerSupplier.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload ?? 'Error al crear cliente-proveedor';
			})
			// Update
			.addCase(updateCustomerSupplier.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(updateCustomerSupplier.fulfilled, (state, action) => {
				state.updating = false;
				const idx = state.items.findIndex((c) => c.id === action.payload.id);
				if (idx !== -1) state.items[idx] = action.payload;
				if (state.current?.id === action.payload.id) state.current = action.payload;
			})
			.addCase(updateCustomerSupplier.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload ?? 'Error al actualizar cliente-proveedor';
			})
			// Delete
			.addCase(deleteCustomerSupplier.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteCustomerSupplier.fulfilled, (state, action) => {
				state.deleting = false;
				state.items = state.items.filter((c) => c.id !== action.payload);
				if (state.current?.id === action.payload) state.current = null;
			})
			.addCase(deleteCustomerSupplier.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.payload ?? 'Error al eliminar cliente-proveedor';
			})
			// Suppliers of customer-supplier
			.addCase(fetchSuppliersOfCustomerSupplier.pending, (state) => {
				state.suppliersLoading = true;
			})
			.addCase(fetchSuppliersOfCustomerSupplier.fulfilled, (state, action) => {
				state.suppliersLoading = false;
				state.suppliers = action.payload;
			})
			.addCase(fetchSuppliersOfCustomerSupplier.rejected, (state, action) => {
				state.suppliersLoading = false;
				state.error = action.payload ?? 'Error al cargar proveedores del cliente-proveedor';
			})
			.addCase(attachSuppliersToCustomerSupplier.pending, (state) => {
				state.attaching = true;
			})
			.addCase(attachSuppliersToCustomerSupplier.fulfilled, (state, action) => {
				state.attaching = false;
				state.suppliers = action.payload;
			})
			.addCase(attachSuppliersToCustomerSupplier.rejected, (state, action) => {
				state.attaching = false;
				state.error = action.payload ?? 'Error al asociar proveedores';
			})
			.addCase(detachSuppliersFromCustomerSupplier.pending, (state) => {
				state.detaching = true;
			})
			.addCase(detachSuppliersFromCustomerSupplier.fulfilled, (state, action) => {
				state.detaching = false;
				state.suppliers = action.payload;
			})
			.addCase(detachSuppliersFromCustomerSupplier.rejected, (state, action) => {
				state.detaching = false;
				state.error = action.payload ?? 'Error al desasociar proveedores';
			});
	},
});

export const { clearCustomerSuppliersError } = customerSuppliersSlice.actions;
export default customerSuppliersSlice.reducer;
