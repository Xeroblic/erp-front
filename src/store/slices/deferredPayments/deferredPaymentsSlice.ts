import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentDocument,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
} from '@/interface/deferredPayments.interface';
import ApiService from '@/services/ApiService';
import USE_DEFERRED_PAYMENTS_MOCK from './deferredPaymentsConfig';
import {
	mockFetchDeferredPaymentById,
	mockFetchDeferredPayments,
	mockFetchDeferredPaymentsSummary,
} from './deferredPaymentsMock';

export const DEFAULT_DEFERRED_PAYMENTS_FILTERS: DeferredPaymentsFilters = {
	page: 1,
	per_page: 10,
	sort: 'due_date',
};

export interface DeferredPaymentsState {
	list: IDeferredPaymentListItem[];
	meta: DeferredPaymentsPaginationMeta | null;
	summary: IDeferredPaymentsSummary | null;
	current: IDeferredPaymentDocument | null;
	filters: DeferredPaymentsFilters;
	loading: boolean;
	loadingSummary: boolean;
	loadingDetail: boolean;
	error: string | null;
	errorSummary: string | null;
	errorDetail: string | null;
	listRequestId: string | null;
	listSubsidiaryId: number | null;
	summaryRequestId: string | null;
	summarySubsidiaryId: number | null;
	detailRequestId: string | null;
	detailSubsidiaryId: number | null;
}

const initialState: DeferredPaymentsState = {
	list: [],
	meta: null,
	summary: null,
	current: null,
	filters: DEFAULT_DEFERRED_PAYMENTS_FILTERS,
	loading: false,
	loadingSummary: false,
	loadingDetail: false,
	error: null,
	errorSummary: null,
	errorDetail: null,
	listRequestId: null,
	listSubsidiaryId: null,
	summaryRequestId: null,
	summarySubsidiaryId: null,
	detailRequestId: null,
	detailSubsidiaryId: null,
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
>('deferredPayments/fetchSummary', async ({ subsidiaryId }, { rejectWithValue, signal }) => {
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockFetchDeferredPaymentsSummary(signal);
		const response = await ApiService.fetchData<IDeferredPaymentsSummary>({
			url: `${baseUrl(subsidiaryId)}/summary`,
			method: 'get',
			cacheTTLms: 30_000,
			signal,
		});
		return response.data;
	} catch (error) {
		if (signal.aborted) throw error;
		return rejectWithValue(
			getErrorMessage(error, 'No se pudo cargar el resumen de pagos diferidos'),
		);
	}
});

export const fetchDeferredPayments = createAsyncThunk<
	DeferredPaymentsListResponse,
	{ subsidiaryId: number; filters?: DeferredPaymentsFilters },
	{ rejectValue: string }
>('deferredPayments/fetchList', async ({ subsidiaryId, filters }, { rejectWithValue, signal }) => {
	const query = filters ?? DEFAULT_DEFERRED_PAYMENTS_FILTERS;
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockFetchDeferredPayments(query, signal);
		const response = await ApiService.fetchData<DeferredPaymentsListResponse>({
			url: baseUrl(subsidiaryId),
			method: 'get',
			params: query,
			cacheTTLms: 15_000,
			signal,
		});
		return response.data;
	} catch (error) {
		if (signal.aborted) throw error;
		return rejectWithValue(getErrorMessage(error, 'No se pudieron cargar los pagos diferidos'));
	}
});

export const fetchDeferredPaymentById = createAsyncThunk<
	IDeferredPaymentDocument,
	{ subsidiaryId: number; documentId: number },
	{ rejectValue: string }
>(
	'deferredPayments/fetchDetail',
	async ({ subsidiaryId, documentId }, { rejectWithValue, signal }) => {
		try {
			if (USE_DEFERRED_PAYMENTS_MOCK)
				return await mockFetchDeferredPaymentById(documentId, signal);
			const response = await ApiService.fetchData<IDeferredPaymentDocument>({
				url: `${baseUrl(subsidiaryId)}/${documentId}`,
				method: 'get',
				cacheTTLms: 15_000,
				signal,
			});
			return response.data;
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getErrorMessage(error, 'No se pudo cargar el detalle del pago diferido'),
			);
		}
	},
);
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
		clearDeferredPaymentDetail: (state) => {
			state.current = null;
			state.errorDetail = null;
			state.detailRequestId = null;
			state.detailSubsidiaryId = null;
			state.loadingDetail = false;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDeferredPayments.pending, (state, action) => {
				const isContextChange =
					state.listSubsidiaryId !== null &&
					state.listSubsidiaryId !== action.meta.arg.subsidiaryId;
				state.listRequestId = action.meta.requestId;
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
				state.loading = true;
				state.error = null;
				if (isContextChange) {
					state.filters.page = 1;
					state.list = [];
					state.meta = null;
				}
			})
			.addCase(fetchDeferredPayments.fulfilled, (state, action) => {
				if (state.listRequestId !== action.meta.requestId) return;
				state.listRequestId = null;
				state.loading = false;
				state.list = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchDeferredPayments.rejected, (state, action) => {
				if (state.listRequestId !== action.meta.requestId) return;
				state.listRequestId = null;
				state.loading = false;
				if (action.meta.aborted) return;
				state.list = [];
				state.meta = null;
				state.error = action.payload ?? 'No se pudieron cargar los pagos diferidos';
			})
			.addCase(fetchDeferredPaymentsSummary.pending, (state, action) => {
				const isContextChange =
					state.summarySubsidiaryId !== null &&
					state.summarySubsidiaryId !== action.meta.arg.subsidiaryId;
				state.summaryRequestId = action.meta.requestId;
				state.summarySubsidiaryId = action.meta.arg.subsidiaryId;
				state.loadingSummary = true;
				state.errorSummary = null;
				if (isContextChange) state.summary = null;
			})
			.addCase(fetchDeferredPaymentsSummary.fulfilled, (state, action) => {
				if (state.summaryRequestId !== action.meta.requestId) return;
				state.summaryRequestId = null;
				state.loadingSummary = false;
				state.summary = action.payload;
			})
			.addCase(fetchDeferredPaymentsSummary.rejected, (state, action) => {
				if (state.summaryRequestId !== action.meta.requestId) return;
				state.summaryRequestId = null;
				state.loadingSummary = false;
				if (action.meta.aborted) return;
				state.summary = null;
				state.errorSummary =
					action.payload ?? 'No se pudo cargar el resumen de pagos diferidos';
			})
			.addCase(fetchDeferredPaymentById.pending, (state, action) => {
				state.detailRequestId = action.meta.requestId;
				state.detailSubsidiaryId = action.meta.arg.subsidiaryId;
				state.loadingDetail = true;
				state.errorDetail = null;
				state.current = null;
			})
			.addCase(fetchDeferredPaymentById.fulfilled, (state, action) => {
				if (state.detailRequestId !== action.meta.requestId) return;
				state.detailRequestId = null;
				state.loadingDetail = false;
				state.current = action.payload;
			})
			.addCase(fetchDeferredPaymentById.rejected, (state, action) => {
				if (state.detailRequestId !== action.meta.requestId) return;
				state.detailRequestId = null;
				state.loadingDetail = false;
				if (action.meta.aborted) return;
				state.current = null;
				state.errorDetail =
					action.payload ?? 'No se pudo cargar el detalle del pago diferido';
			});
	},
});

export const {
	setDeferredPaymentsFilters,
	resetDeferredPaymentsFilters,
	clearDeferredPaymentDetail,
} = deferredPaymentsSlice.actions;

export default deferredPaymentsSlice.reducer;
