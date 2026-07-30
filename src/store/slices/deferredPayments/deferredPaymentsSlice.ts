import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
	CreateDeferredPaymentApiPayload,
	CreateDeferredPaymentPayload,
	DeferredPaymentMutationResponse,
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentDocument,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
	UpdateDeferredPaymentApiPayload,
	UpdateDeferredPaymentPayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import USE_DEFERRED_PAYMENTS_MOCK from './deferredPaymentsConfig';
import {
	mockCreateDeferredPayment,
	mockFetchDeferredPaymentById,
	mockFetchDeferredPayments,
	mockFetchDeferredPaymentsSummary,
	mockUpdateDeferredPayment,
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
	creating: boolean;
	updating: boolean;
	error: string | null;
	errorSummary: string | null;
	errorDetail: string | null;
	errorMutation: string | null;
	lastMutationCreditLimitExceeded: boolean;
	createRequestId: string | null;
	updateRequestId: string | null;
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
	creating: false,
	updating: false,
	error: null,
	errorSummary: null,
	errorDetail: null,
	errorMutation: null,
	lastMutationCreditLimitExceeded: false,
	createRequestId: null,
	updateRequestId: null,
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

export interface DeferredPaymentMutationError {
	message: string;
	errors: Record<string, string>;
}

const getMutationError = (error: unknown, fallback: string): DeferredPaymentMutationError => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const dataRecord = asRecord(responseRecord?.data);
	const rawErrors = asRecord(dataRecord?.errors);
	const errors = Object.fromEntries(
		Object.entries(rawErrors ?? {}).flatMap(([field, messages]) => {
			if (typeof messages === 'string' && messages.trim()) return [[field, messages]];
			if (Array.isArray(messages)) {
				const firstMessage = messages.find(
					(message): message is string =>
						typeof message === 'string' && message.trim().length > 0,
				);
				return firstMessage ? [[field, firstMessage]] : [];
			}
			return [];
		}),
	);
	return { message: getErrorMessage(error, fallback), errors };
};
const mapItemsToApi = (items: CreateDeferredPaymentPayload['items']) =>
	items.map((item) => ({
		product_id: item.product_id,
		code: item.code || null,
		description: item.description,
		quantity: item.quantity,
		unit_price: Number(item.unit_price).toFixed(2),
		serials: item.serials,
	}));

const calculateTotalAmount = (items: CreateDeferredPaymentPayload['items']): string =>
	items.reduce((total, item) => total + item.quantity * Number(item.unit_price), 0).toFixed(2);

const mapCreatePayloadToApi = (
	payload: CreateDeferredPaymentPayload,
): CreateDeferredPaymentApiPayload => ({
	customer_sale_id: payload.customer_sale_id,
	document_type: payload.document_type,
	document_number: payload.document_number,
	issue_date: payload.issue_date,
	due_date: payload.due_date,
	total_amount: calculateTotalAmount(payload.items),
	purchase_order: payload.purchase_order,
	notes: payload.notes,
	assignee_ids: payload.assignee_ids,
	items: mapItemsToApi(payload.items),
});

const mapUpdatePayloadToApi = (
	payload: UpdateDeferredPaymentPayload,
): UpdateDeferredPaymentApiPayload => {
	const { items, ...fields } = payload;
	return {
		...fields,
		...(items
			? { items: mapItemsToApi(items), total_amount: calculateTotalAmount(items) }
			: {}),
	};
};
export const fetchDeferredPaymentsSummary = createAsyncThunk<
	IDeferredPaymentsSummary,
	{ subsidiaryId: number },
	{ rejectValue: string }
>('deferredPayments/fetchSummary', async ({ subsidiaryId }, { rejectWithValue, signal }) => {
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockFetchDeferredPaymentsSummary(signal);
		return await deferredPaymentsService.getSummary(subsidiaryId, signal);
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
		return await deferredPaymentsService.getDocuments(
			subsidiaryId,
			{
				page: query.page,
				per_page: query.per_page,
				status: query.status,
				customer_sale_id: query.customer_sale_id,
				search: query.search,
				due_before: query.due_before,
				due_after: query.due_after,
			},
			signal,
		);
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
			return await deferredPaymentsService.getDocument(subsidiaryId, documentId, signal);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getErrorMessage(error, 'No se pudo cargar el detalle del pago diferido'),
			);
		}
	},
);
export const createDeferredPayment = createAsyncThunk<
	DeferredPaymentMutationResponse,
	{ subsidiaryId: number; payload: CreateDeferredPaymentPayload },
	{ rejectValue: DeferredPaymentMutationError }
>('deferredPayments/create', async ({ subsidiaryId, payload }, { rejectWithValue, signal }) => {
	try {
		if (USE_DEFERRED_PAYMENTS_MOCK) return await mockCreateDeferredPayment(payload, signal);
		return await deferredPaymentsService.createDocument(
			subsidiaryId,
			mapCreatePayloadToApi(payload),
			signal,
		);
	} catch (error) {
		if (signal.aborted) throw error;
		return rejectWithValue(
			getMutationError(error, 'No se pudo crear el documento de pago diferido'),
		);
	}
});

export const updateDeferredPayment = createAsyncThunk<
	DeferredPaymentMutationResponse,
	{ subsidiaryId: number; documentId: number; payload: UpdateDeferredPaymentPayload },
	{ rejectValue: DeferredPaymentMutationError }
>(
	'deferredPayments/update',
	async ({ subsidiaryId, documentId, payload }, { rejectWithValue, signal }) => {
		try {
			if (USE_DEFERRED_PAYMENTS_MOCK)
				return await mockUpdateDeferredPayment(documentId, payload, signal);
			const document = await deferredPaymentsService.updateDocument(
				subsidiaryId,
				documentId,
				mapUpdatePayloadToApi(payload),
				signal,
			);
			return { document, credit_limit_exceeded: false };
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getMutationError(error, 'No se pudo actualizar el documento de pago diferido'),
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
		clearDeferredPaymentMutation: (state) => {
			state.errorMutation = null;
			state.lastMutationCreditLimitExceeded = false;
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
				const isSameDetail =
					state.detailSubsidiaryId === action.meta.arg.subsidiaryId &&
					state.current?.id === action.meta.arg.documentId;
				state.detailRequestId = action.meta.requestId;
				state.detailSubsidiaryId = action.meta.arg.subsidiaryId;
				state.loadingDetail = true;
				state.errorDetail = null;
				if (!isSameDetail) state.current = null;
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
			})
			.addCase(createDeferredPayment.pending, (state, action) => {
				state.createRequestId = action.meta.requestId;
				state.creating = true;
				state.errorMutation = null;
				state.lastMutationCreditLimitExceeded = false;
			})
			.addCase(createDeferredPayment.fulfilled, (state, action) => {
				if (state.createRequestId !== action.meta.requestId) return;
				state.createRequestId = null;
				state.creating = false;
				state.current = action.payload.document;
				state.detailSubsidiaryId = action.meta.arg.subsidiaryId;
				state.lastMutationCreditLimitExceeded = action.payload.credit_limit_exceeded;
			})
			.addCase(createDeferredPayment.rejected, (state, action) => {
				if (state.createRequestId !== action.meta.requestId) return;
				state.createRequestId = null;
				state.creating = false;
				if (action.meta.aborted) return;
				state.errorMutation =
					action.payload?.message ?? 'No se pudo crear el documento de pago diferido';
			})
			.addCase(updateDeferredPayment.pending, (state, action) => {
				state.updateRequestId = action.meta.requestId;
				state.updating = true;
				state.errorMutation = null;
				state.lastMutationCreditLimitExceeded = false;
			})
			.addCase(updateDeferredPayment.fulfilled, (state, action) => {
				if (state.updateRequestId !== action.meta.requestId) return;
				state.updateRequestId = null;
				state.updating = false;
				state.current = action.payload.document;
				state.detailSubsidiaryId = action.meta.arg.subsidiaryId;
				state.lastMutationCreditLimitExceeded = action.payload.credit_limit_exceeded;
			})
			.addCase(updateDeferredPayment.rejected, (state, action) => {
				if (state.updateRequestId !== action.meta.requestId) return;
				state.updateRequestId = null;
				state.updating = false;
				if (action.meta.aborted) return;
				state.errorMutation =
					action.payload?.message ??
					'No se pudo actualizar el documento de pago diferido';
			});
	},
});

export const {
	setDeferredPaymentsFilters,
	resetDeferredPaymentsFilters,
	clearDeferredPaymentDetail,
	clearDeferredPaymentMutation,
} = deferredPaymentsSlice.actions;

export default deferredPaymentsSlice.reducer;
