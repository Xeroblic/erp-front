import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import {
	ICustomerSale,
	ICustomerSaleOverview,
	ICustomerSalePayload,
} from '@/interface/customerSales.interface';

export interface CustomerSalesState {
	loading: boolean;
	error: string | undefined;
	lista: ICustomerSale[];
	overview: ICustomerSaleOverview[];
	detalle: ICustomerSale | undefined;
}

const initialState: CustomerSalesState = {
	loading: false,
	error: undefined,
	lista: [],
	overview: [],
	detalle: undefined,
};

/* ----------------------------- THUNKS CRUD ----------------------------- */

// GET lista clientes
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

// GET detalle
export const fetchCustomerDetailThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string },
	{ rejectValue: string }
>('customerSales/fetchCustomerDetail', async ({ subsidiary, id }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'get',
		});
		// Algunos endpoints devuelven { data: {...} } y otros devuelven directamente el objeto
		return (response.data as any)?.data ?? response.data;
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo obtener el cliente');
	}
});

// POST crear
export const createCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; payload: ICustomerSalePayload },
	{ rejectValue: string }
>('customerSales/createCustomer', async ({ subsidiary, payload }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales`,
			method: 'post',
			data: payload,
		});
		return response.data;
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo crear el cliente');
	}
});

// PATCH editar
export const updateCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string; payload: ICustomerSalePayload },
	{ rejectValue: string }
>('customerSales/updateCustomer', async ({ subsidiary, id, payload }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'patch',
			data: payload,
		});
		return response.data; // porque el backend envía {message, data}
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'No se pudo actualizar');
	}
});

// DELETE eliminar
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

// GET overview
export const fetchCustomersOverviewThunk = createAsyncThunk<
	ICustomerSaleOverview[],
	{ subsidiary: number | string; params?: any },
	{ rejectValue: string }
>('customerSales/fetchOverview', async ({ subsidiary, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<ICustomerSaleOverview[]>({
			url: `/subsidiaries/${subsidiary}/customer-sales/overview`,
			method: 'get',
			params,
		});
		// El backend devuelve paginación: { data: [...], meta, ... }
		// Normalizamos para devolver siempre el array de overview
		const payload = (response.data as any)?.data ?? response.data;
		return payload as ICustomerSaleOverview[];
	} catch (error: any) {
		return rejectWithValue(error.response?.data || 'Error al cargar overview');
	}
});

/* ----------------------------- SLICE ----------------------------- */

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
				state.overview = action.payload;
			})
			.addCase(fetchCustomersOverviewThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export default customerSalesSlice.reducer;
