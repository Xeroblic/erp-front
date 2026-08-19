import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import {
	ICustomerSale,
	ICustomerSaleOverview,
	ICustomerSalePayload,
} from '@/interface/customerSales.interface';
import type { PaginationMeta, PaginationLinks, PaginatedResponse } from '@/services/salesService';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';

/**
 * Error de una mutación de cliente venta. Conserva por separado el mensaje ya
 * normalizado (para toast / `state.error`) y los errores por campo que Laravel
 * devuelve en un 422, para poder pintarlos sobre el input que corresponde.
 */
export interface CustomerSaleRequestError {
	message: string;
	errors?: Record<string, string[]>;
}

export interface CustomerSalesOverviewParams {
	q?: string;
	st?: string;
	date_from?: string;
	date_to?: string;
	min_loyalty?: number;
	strict?: boolean;
	max?: number;
}

export interface FetchCustomersOverviewArgs {
	subsidiary: number | string;
	page?: number;
	per_page?: number;
	params?: CustomerSalesOverviewParams;
}

interface CustomerSalesOverviewResponse {
	data?: ICustomerSaleOverview[];
	current_page?: number;
	from?: number | null;
	last_page?: number;
	per_page?: number;
	to?: number | null;
	total?: number;
	first_page_url?: string | null;
	last_page_url?: string | null;
	prev_page_url?: string | null;
	next_page_url?: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

const toFieldErrors = (value: unknown): Record<string, string[]> | undefined => {
	const rawErrors = asRecord(value);
	if (!rawErrors) return undefined;
	const fieldErrors = Object.entries(rawErrors).reduce<Record<string, string[]>>(
		(acc, [field, messages]) => {
			const list = Array.isArray(messages)
				? messages.filter((message): message is string => typeof message === 'string')
				: [];
			if (list.length) acc[field] = list;
			return acc;
		},
		{},
	);
	return Object.keys(fieldErrors).length ? fieldErrors : undefined;
};

const toRequestError = (error: unknown, fallback: string): CustomerSaleRequestError => {
	const data = asRecord(asRecord(asRecord(error)?.response)?.data);
	const errors = toFieldErrors(data?.errors);
	const message = getDeferredPaymentErrorMessage(error, fallback);
	return errors ? { message, errors } : { message };
};

export interface CustomerSalesState {
	loading: boolean;
	error: string | undefined;
	overviewLoading: boolean;
	overviewError: string | undefined;
	overviewRequestId: string | null;
	overviewSubsidiaryId: number | string | null;
	listOverviewLoading: boolean;
	listOverviewError: string | undefined;
	listOverviewRequestId: string | null;
	listOverviewSubsidiaryId: number | string | null;
	lista: ICustomerSale[];
	overview: ICustomerSaleOverview[];
	listOverview: ICustomerSaleOverview[];
	detalle: ICustomerSale | undefined;
	detalleCliente: ICustomerSaleOverview | undefined;
	meta: PaginationMeta | null;
	links: PaginationLinks | null;
	listMeta: PaginationMeta | null;
	listLinks: PaginationLinks | null;
}

const initialState: CustomerSalesState = {
	loading: false,
	error: undefined,
	overviewLoading: false,
	overviewError: undefined,
	overviewRequestId: null,
	overviewSubsidiaryId: null,
	listOverviewLoading: false,
	listOverviewError: undefined,
	listOverviewRequestId: null,
	listOverviewSubsidiaryId: null,
	lista: [],
	overview: [],
	listOverview: [],
	detalle: undefined,
	detalleCliente: undefined,
	meta: null,
	links: null,
	listMeta: null,
	listLinks: null,
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
	} catch (error: unknown) {
		return rejectWithValue(getDeferredPaymentErrorMessage(error, 'Error al cargar clientes'));
	}
});

export const fetchCustomerDetailThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string },
	{ rejectValue: CustomerSaleRequestError }
>('customerSales/fetchCustomerDetail', async ({ subsidiary, id }, { rejectWithValue }) => {
	try {
		// Algunos endpoints devuelven { data: {...} } y otros devuelven directamente el objeto
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'get',
		});
	} catch (error: unknown) {
		return rejectWithValue(toRequestError(error, 'No se pudo obtener el cliente'));
	}
});

export const createCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; payload: ICustomerSalePayload },
	{ rejectValue: CustomerSaleRequestError }
>('customerSales/createCustomer', async ({ subsidiary, payload }, { rejectWithValue }) => {
	try {
		// Algunos endpoints devuelven { data: {...} } y otros devuelven directamente el objeto
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales`,
			method: 'post',
			data: payload,
		});
	} catch (error: unknown) {
		return rejectWithValue(toRequestError(error, 'No se pudo crear el cliente'));
	}
});

export const updateCustomerThunk = createAsyncThunk<
	ICustomerSale,
	{ subsidiary: number | string; id: number | string; payload: ICustomerSalePayload },
	{ rejectValue: CustomerSaleRequestError }
>('customerSales/updateCustomer', async ({ subsidiary, id, payload }, { rejectWithValue }) => {
	try {
		// porque el backend envía {message, data}
		return await ApiService.fetchNormalized<ICustomerSale>({
			url: `/subsidiaries/${subsidiary}/customer-sales/${id}`,
			method: 'patch',
			data: payload,
		});
	} catch (error: unknown) {
		return rejectWithValue(toRequestError(error, 'No se pudo actualizar el cliente'));
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
	} catch (error: unknown) {
		return rejectWithValue(getDeferredPaymentErrorMessage(error, 'No se pudo eliminar'));
	}
});

export const fetchCustomersOverviewThunk = createAsyncThunk<
	PaginatedResponse<ICustomerSaleOverview>,
	FetchCustomersOverviewArgs,
	{ rejectValue: string }
>(
	'customerSales/fetchOverview',
	async ({ subsidiary, page = 1, per_page = 5, params }, { rejectWithValue, signal }) => {
		try {
			const response = await ApiService.fetchData<CustomerSalesOverviewResponse>({
				url: `/subsidiaries/${subsidiary}/customer-sales/overview`,
				method: 'get',
				params: { page, per_page, sort: 'created_at', order: 'desc', ...params },
				signal,
			});
			const rootData = response.data;

			return {
				data: rootData?.data ?? [],
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
		} catch (error: unknown) {
			return rejectWithValue(
				getDeferredPaymentErrorMessage(error, 'Error al cargar overview'),
			);
		}
	},
);

export const fetchCustomersListOverviewThunk = createAsyncThunk<
	PaginatedResponse<ICustomerSaleOverview>,
	FetchCustomersOverviewArgs,
	{ rejectValue: string }
>(
	'customerSales/fetchListOverview',
	async ({ subsidiary, page = 1, per_page = 10, params }, { rejectWithValue, signal }) => {
		try {
			const response = await ApiService.fetchData<CustomerSalesOverviewResponse>({
				url: `/subsidiaries/${subsidiary}/customer-sales/overview`,
				method: 'get',
				params: { page, per_page, sort: 'created_at', order: 'desc', ...params },
				signal,
			});
			const rootData = response.data;

			return {
				data: rootData?.data ?? [],
				meta: {
					current_page: rootData?.current_page ?? 1,
					from: rootData?.from ?? null,
					last_page: rootData?.last_page ?? 1,
					per_page: rootData?.per_page ?? per_page,
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
		} catch (error: unknown) {
			return rejectWithValue(
				getDeferredPaymentErrorMessage(error, 'Error al cargar overview'),
			);
		}
	},
);

const clearOverview = (state: CustomerSalesState) => {
	state.overview = [];
	state.meta = null;
	state.links = null;
	state.overviewError = undefined;
	state.overviewRequestId = null;
	state.overviewLoading = false;
};

const clearListOverview = (state: CustomerSalesState) => {
	state.listOverview = [];
	state.listMeta = null;
	state.listLinks = null;
	state.listOverviewError = undefined;
	state.listOverviewRequestId = null;
	state.listOverviewLoading = false;
};

export const customerSalesSlice = createSlice({
	name: 'customerSales',
	initialState,
	reducers: {
		clearCustomersOverview: (state) => {
			clearOverview(state);
			state.overviewSubsidiaryId = null;
		},
		clearCustomersListOverview: (state) => {
			clearListOverview(state);
			state.listOverviewSubsidiaryId = null;
		},
	},
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
				state.error = action.payload?.message ?? action.error.message;
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
				state.error = action.payload?.message ?? action.error.message;
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
				state.error = action.payload?.message ?? action.error.message;
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
			.addCase(fetchCustomersOverviewThunk.pending, (state, action) => {
				const isContextChange =
					state.overviewSubsidiaryId !== null &&
					state.overviewSubsidiaryId !== action.meta.arg.subsidiary;
				state.overviewRequestId = action.meta.requestId;
				state.overviewSubsidiaryId = action.meta.arg.subsidiary;
				state.overviewLoading = true;
				state.overviewError = undefined;
				if (isContextChange) {
					state.overview = [];
					state.meta = null;
					state.links = null;
				}
			})
			.addCase(fetchCustomersOverviewThunk.fulfilled, (state, action) => {
				if (state.overviewRequestId !== action.meta.requestId) return;
				state.overviewRequestId = null;
				state.overviewLoading = false;
				state.overview = action.payload.data;
				state.meta = action.payload.meta;
				state.links = action.payload.links;
			})
			.addCase(fetchCustomersOverviewThunk.rejected, (state, action) => {
				if (state.overviewRequestId !== action.meta.requestId) return;
				state.overviewRequestId = null;
				state.overviewLoading = false;
				if (action.meta.aborted) return;
				state.overviewError = action.payload ?? 'Error al cargar overview';
				state.overview = [];
				state.meta = null;
				state.links = null;
			})
			.addCase(fetchCustomersListOverviewThunk.pending, (state, action) => {
				const isContextChange =
					state.listOverviewSubsidiaryId !== null &&
					state.listOverviewSubsidiaryId !== action.meta.arg.subsidiary;
				if (isContextChange) clearListOverview(state);
				state.listOverviewRequestId = action.meta.requestId;
				state.listOverviewSubsidiaryId = action.meta.arg.subsidiary;
				state.listOverviewLoading = true;
				state.listOverviewError = undefined;
			})
			.addCase(fetchCustomersListOverviewThunk.fulfilled, (state, action) => {
				if (state.listOverviewRequestId !== action.meta.requestId) return;
				state.listOverviewRequestId = null;
				state.listOverviewLoading = false;
				state.listOverview = action.payload.data;
				state.listMeta = action.payload.meta;
				state.listLinks = action.payload.links;
			})
			.addCase(fetchCustomersListOverviewThunk.rejected, (state, action) => {
				if (state.listOverviewRequestId !== action.meta.requestId) return;
				state.listOverviewRequestId = null;
				state.listOverviewLoading = false;
				if (action.meta.aborted) return;
				state.listOverviewError = action.payload ?? 'Error al cargar overview';
				state.listOverview = [];
				state.listMeta = null;
				state.listLinks = null;
			});
	},
});

export const { clearCustomersOverview, clearCustomersListOverview } = customerSalesSlice.actions;

// Selectores
export const selectCustomerSalesMeta = (state: { customerSales: CustomerSalesState }) =>
	state.customerSales.meta;
export const selectCustomerSalesLinks = (state: { customerSales: CustomerSalesState }) =>
	state.customerSales.links;

export default customerSalesSlice.reducer;
