import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import {
	ICustomerSale,
	ICustomerSaleOverview,
	ICustomerSalePayload,
} from '@/interface/customerSales.interface';
import type {
	PaginationMeta,
	PaginationLinks,
	PaginatedResponse,
} from '@/services/salesService';

export interface CustomerSalesState {
	loading: boolean;
	error: string | undefined;
	lista: ICustomerSale[];
	overview: ICustomerSaleOverview[];
	detalle: ICustomerSale | undefined;
	detalleCliente: ICustomerSaleOverview | undefined;
	meta: PaginationMeta | null;
	links: PaginationLinks | null;
}

const initialState: CustomerSalesState = {
	loading: false,
	error: undefined,
	lista: [],
	overview: [],
	detalle: undefined,
	detalleCliente: undefined,
	meta: null,
	links: null,
};

export const fetchCustomersThunk = createAsyncThunk<
	ICustomerSale[],
	{ subsidiary: number | string },
	{ rejectValue: string }
>('customerSales/fetchCustomers', async ({ subsidiary }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ICustomerSale[]>({
			url: `/subsidiaries/${subsidiary}/customer-sales`,
			method: 'get',
		});
		return response.data;
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'Error al cargar clientes');
	}
});

export const fetchCustomerDetailThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string },
	{ rejectValue: string }
>('customerSales/fetchCustomerDetail', async ({ subsidiary, id }, { rejectWithValue }) => {
	try {
		// Algunos endpoints devuelven { data: {...} } y otros devuelven directamente el objeto
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'get',
		});
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo obtener el cliente');
	}
});

export const createCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; payload: ICustomerSalePayload },
	{ rejectValue: string }
>('customerSales/createCustomer', async ({ subsidiary, payload }, { rejectWithValue }) => {
	try {
		// Algunos endpoints devuelven { data: {...} } y otros devuelven directamente el objeto
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales`,
			method: 'post',
			data: payload,
		});
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo crear el cliente');
	}
});

export const updateCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string; payload: ICustomerSalePayload },
	{ rejectValue: string }
>('customerSales/updateCustomer', async ({ subsidiary, id, payload }, { rejectWithValue }) => {
	try {
		// porque el backend envía {message, data}
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'patch',
			data: payload,
		});
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo actualizar');
	}
});

export const deleteCustomerThunk = createAsyncThunk<
	{ message: string },
	{ subsidiary: number | string; id: number | string },
	{ rejectValue: string }
>('customerSales/deleteCustomer', async ({ subsidiary, id }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ message: string }>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'delete',
		});
		return response.data;
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo eliminar');
	}
});

export const fetchCustomersOverviewThunk = createAsyncThunk<
	PaginatedResponse<ICustomerSaleOverview>,
	{ subsidiary: number | string; page?: number; per_page?: number; params?: any },
	{ rejectValue: string }
>('customerSales/fetchOverview', async ({ subsidiary, page = 1, per_page = 5, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<any>({
			url: `/subsidiaries/${subsidiary}/customer-sales/overview`,
			method: 'get',
			params: { page, per_page, sort: 'created_at', order: 'desc', ...params },
		});
		const rootData = response.data;

		return {
			data: (rootData?.data ?? []) as ICustomerSaleOverview[],
			meta: {
				current_page: rootData?.current_page ?? 1,
				from: rootData?.from ?? null,
				last_page: rootData?.last_page ?? 1,
				per_page: rootData?.per_page ?? 5,
				to: rootData?.to ?? null,
				total: rootData?.total ?? 0,
			},
			links: {
				first: rootData?.first_page_url ?? null,
				last: rootData?.last_page_url ?? null,
				prev: rootData?.prev_page_url ?? null,
				next: rootData?.next_page_url ?? null,
			},
		};
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'Error al cargar overview');
	}
});


export const customerSalesSlice = createSlice({
	name: 'customerSales',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			/* Lista */
			.addCase(fetchCustomersThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchCustomersThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.lista = action.payload;
			})
			.addCase(fetchCustomersThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			/* Detalle */
			.addCase(fetchCustomerDetailThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchCustomerDetailThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.detalle = action.payload;
			})
			.addCase(fetchCustomerDetailThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			/* Crear */
			.addCase(createCustomerThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(createCustomerThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.lista.push(action.payload);
			})
			.addCase(createCustomerThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			/* Actualizar */
			.addCase(updateCustomerThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(updateCustomerThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.detalle = action.payload;
				state.lista = state.lista.map((c) =>
					c.id === action.payload.id ? action.payload : c,
				);
			})
			.addCase(updateCustomerThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			/* Eliminar */
			.addCase(deleteCustomerThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(deleteCustomerThunk.fulfilled, (state) => {
				state.loading = false;
			})
			.addCase(deleteCustomerThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			})

			/* Overview */
			.addCase(fetchCustomersOverviewThunk.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchCustomersOverviewThunk.fulfilled, (state, action) => {
				state.loading = false;
				state.overview = action.payload.data;
				state.meta = action.payload.meta;
				state.links = action.payload.links;
			})
			.addCase(fetchCustomersOverviewThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				state.meta = null;
				state.links = null;
			});
	},
});

// Selectores
export const selectCustomerSalesMeta = (state: { customerSales: CustomerSalesState }) =>
	state.customerSales.meta;
export const selectCustomerSalesLinks = (state: { customerSales: CustomerSalesState }) =>
	state.customerSales.links;

export default customerSalesSlice.reducer;
