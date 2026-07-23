import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';
import ApiService from '@/services/ApiService';
import {
	mockFetchDeferredPayments,
	mockFetchDeferredPaymentsSummary,
} from './deferredPaymentsMock';

const USE_DEFERRED_PAYMENTS_MOCK = import.meta.env.VITE_DEFERRED_PAYMENTS_MOCK !== 'false';

export const DEFAULT_DEFERRED_PAYMENTS_FILTERS: DeferredPaymentsFilters = {
	page: 1,
	per_page: 10,
	sort: 'due_date',
};

export interface DeferredPaymentsState {
	list: IDeferredPaymentListItem[];
	meta: DeferredPaymentsPaginationMeta | null;
	summary: IDeferredPaymentsSummary | null;
	filters: DeferredPaymentsFilters;
	loading: boolean;
	loadingSummary: boolean;
	error: string | null;
}

const initialState: DeferredPaymentsState = {
	list: [],
	meta: null,
	summary: null,
	filters: DEFAULT_DEFERRED_PAYMENTS_FILTERS,
	loading: false,
	loadingSummary: false,
	error: null,
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

const getErrorMessage = (error: unknown, fallback: string): string => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const dataRecord = asRecord(responseRecord?.data);
	if (typeof dataRecord?.message === 'string' && dataRecord.message.trim())
		return dataRecord.message;
	if (error instanceof Error && error.message.trim()) return error.message;
	return fallback;
};

const baseUrl = (subsidiaryId: number): string => `/subsidiaries/${subsidiaryId}/deferred-payments`;

export const fetchDeferredPaymentsSummary = createAsyncThunk<
	IDeferredPaymentsSummary,
	{ subsidiaryId: number },
	{ rejectValue: string }
>('deferredPayments/fetchSummary', async ({ subsidiaryId }, { rejectWithValue }) => {
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockFetchDeferredPaymentsSummary();
		const response = await ApiService.fetchData<IDeferredPaymentsSummary>({
			url: `${baseUrl(subsidiaryId)}/summary`,
			method: 'get',
			cacheTTLms: 30_000,
			dedupe: true,
		});
		return response.data;
	} catch (error) {
		return rejectWithValue(
			getErrorMessage(error, 'No se pudo cargar el resumen de pagos diferidos'),
		);
	}
});

export const fetchDeferredPayments = createAsyncThunk<
	DeferredPaymentsListResponse,
	{ subsidiaryId: number; filters?: DeferredPaymentsFilters },
	{ rejectValue: string }
>('deferredPayments/fetchList', async ({ subsidiaryId, filters }, { rejectWithValue }) => {
	const query = filters ?? DEFAULT_DEFERRED_PAYMENTS_FILTERS;
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockFetchDeferredPayments(query);
		const response = await ApiService.fetchData<DeferredPaymentsListResponse>({
			url: baseUrl(subsidiaryId),
			method: 'get',
			params: query,
			cacheTTLms: 15_000,
			dedupe: true,
		});
		return response.data;
	} catch (error) {
		return rejectWithValue(getErrorMessage(error, 'No se pudieron cargar los pagos diferidos'));
	}
});

const deferredPaymentsSlice = createSlice({
	name: 'deferredPayments',
	initialState,
	reducers: {
		setDeferredPaymentsFilters: (
			state,
			action: PayloadAction<Partial<DeferredPaymentsFilters>>,
		) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		resetDeferredPaymentsFilters: (state) => {
			state.filters = { ...DEFAULT_DEFERRED_PAYMENTS_FILTERS };
		},
		clearDeferredPaymentsError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDeferredPayments.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchDeferredPayments.fulfilled, (state, action) => {
				state.loading = false;
				state.list = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchDeferredPayments.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'No se pudieron cargar los pagos diferidos';
			})
			.addCase(fetchDeferredPaymentsSummary.pending, (state) => {
				state.loadingSummary = true;
			})
			.addCase(fetchDeferredPaymentsSummary.fulfilled, (state, action) => {
				state.loadingSummary = false;
				state.summary = action.payload;
			})
			.addCase(fetchDeferredPaymentsSummary.rejected, (state, action) => {
				state.loadingSummary = false;
				state.error = action.payload ?? 'No se pudo cargar el resumen de pagos diferidos';
			});
	},
});

export const {
	setDeferredPaymentsFilters,
	resetDeferredPaymentsFilters,
	clearDeferredPaymentsError,
} = deferredPaymentsSlice.actions;

export default deferredPaymentsSlice.reducer;
