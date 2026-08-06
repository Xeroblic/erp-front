import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
	CreateDeferredPaymentApiPayload,
	CreateDeferredPaymentPayload,
	DeferredPaymentApiListParams,
	DeferredPaymentApiSummaryParams,
	DeferredPaymentMutationResponse,
	DeferredPaymentDeleteResponse,
	DeferredPaymentsFilters,
	DeferredPaymentsListResponse,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentAbono,
	IDeferredPaymentAttachment,
	IDeferredPaymentDocument,
	IDeferredPaymentListItem,
	IDeferredPaymentsSummary,
	UpdateDeferredPaymentApiPayload,
	RegisterDeferredPaymentPayload,
	UpdateDeferredPaymentPayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';

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
	recordingPayment: boolean;
	uploadingReceipt: boolean;
	voidingPaymentId: number | null;
	markingPaid: boolean;
	error: string | null;
	errorSummary: string | null;
	errorDetail: string | null;
	errorMutation: string | null;
	errorPayment: string | null;
	errorReceipt: string | null;
	errorVoid: string | null;
	errorMarkPaid: string | null;
	lastMutationCreditLimitExceeded: boolean;
	createRequestId: string | null;
	updateRequestId: string | null;
	paymentRequestId: string | null;
	receiptRequestId: string | null;
	voidRequestId: string | null;
	markPaidRequestId: string | null;
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
	recordingPayment: false,
	uploadingReceipt: false,
	voidingPaymentId: null,
	markingPaid: false,
	error: null,
	errorSummary: null,
	errorDetail: null,
	errorMutation: null,
	errorPayment: null,
	errorReceipt: null,
	errorVoid: null,
	errorMarkPaid: null,
	lastMutationCreditLimitExceeded: false,
	createRequestId: null,
	updateRequestId: null,
	paymentRequestId: null,
	receiptRequestId: null,
	voidRequestId: null,
	markPaidRequestId: null,
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

const formatAmountToApi = (amount: number | string): string => Number(amount).toFixed(2);

const mapFiltersToApiParams = (filters: DeferredPaymentsFilters): DeferredPaymentApiListParams => ({
	page: filters.page,
	per_page: filters.per_page,
	status: filters.status,
	customer_sale_id: filters.customer_sale_id,
	search: filters.search,
	due_before: filters.due_before,
	due_after: filters.due_after,
});
const mapFiltersToSummaryApiParams = (
	filters: DeferredPaymentApiSummaryParams,
): DeferredPaymentApiSummaryParams => ({
	status: filters.status,
	customer_sale_id: filters.customer_sale_id,
	search: filters.search,
	due_before: filters.due_before,
	due_after: filters.due_after,
});

const mapCreatePayloadToApi = (
	payload: CreateDeferredPaymentPayload,
): CreateDeferredPaymentApiPayload => ({
	customer_sale_id: payload.customer_sale_id,
	document_type: payload.document_type,
	document_number: payload.document_number,
	issue_date: payload.issue_date,
	due_date: payload.due_date,
	total_amount: formatAmountToApi(payload.total_amount),
	purchase_order: payload.purchase_order,
	notes: payload.notes,
	assignee_ids: payload.assignee_ids,
	items: mapItemsToApi(payload.items),
});

const mapUpdatePayloadToApi = (
	payload: UpdateDeferredPaymentPayload,
): UpdateDeferredPaymentApiPayload => {
	const { items, total_amount: totalAmount, ...fields } = payload;
	return {
		...fields,
		...(totalAmount !== undefined ? { total_amount: formatAmountToApi(totalAmount) } : {}),
		...(items
			? { items: mapItemsToApi(items) }
			: {}),
	};
};
export const fetchDeferredPaymentsSummary = createAsyncThunk<
	IDeferredPaymentsSummary,
	{ subsidiaryId: number; filters: DeferredPaymentApiSummaryParams },
	{ rejectValue: string }
>(
	'deferredPayments/fetchSummary',
	async ({ subsidiaryId, filters }, { rejectWithValue, signal }) => {
		try {
			return await deferredPaymentsService.getSummary(
				subsidiaryId,
				mapFiltersToSummaryApiParams(filters),
				signal,
			);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getErrorMessage(error, 'No se pudo cargar el resumen de pagos diferidos'),
			);
		}
	},
);

export const fetchDeferredPayments = createAsyncThunk<
	DeferredPaymentsListResponse,
	{ subsidiaryId: number; filters?: DeferredPaymentsFilters },
	{ rejectValue: string }
>('deferredPayments/fetchList', async ({ subsidiaryId, filters }, { rejectWithValue, signal }) => {
	const query = filters ?? DEFAULT_DEFERRED_PAYMENTS_FILTERS;
	try {
		return await deferredPaymentsService.getDocuments(
			subsidiaryId,
			mapFiltersToApiParams(query),
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
			return await deferredPaymentsService.updateDocument(
				subsidiaryId,
				documentId,
				mapUpdatePayloadToApi(payload),
				signal,
			);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getMutationError(error, 'No se pudo actualizar el documento de pago diferido'),
			);
		}
	},
);
export const registerDeferredPayment = createAsyncThunk<
	IDeferredPaymentAbono,
	{ subsidiaryId: number; documentId: number; payload: RegisterDeferredPaymentPayload },
	{ rejectValue: DeferredPaymentMutationError }
>(
	'deferredPayments/registerPayment',
	async ({ subsidiaryId, documentId, payload }, { rejectWithValue, signal }) => {
		try {
			return await deferredPaymentsService.registerPayment(
				subsidiaryId,
				documentId,
				payload,
				signal,
			);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(getMutationError(error, 'No se pudo registrar el abono'));
		}
	},
);

export const uploadDeferredPaymentReceipt = createAsyncThunk<
	IDeferredPaymentAttachment,
	{ subsidiaryId: number; documentId: number; paymentId: number; file: File },
	{ rejectValue: DeferredPaymentMutationError }
>(
	'deferredPayments/uploadReceipt',
	async ({ subsidiaryId, documentId, paymentId, file }, { rejectWithValue, signal }) => {
		try {
			return await deferredPaymentsService.uploadDeferredPaymentAttachment(
				subsidiaryId,
				documentId,
				paymentId,
				file,
				signal,
			);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(getMutationError(error, 'No se pudo subir el comprobante'));
		}
	},
);

export const voidDeferredPayment = createAsyncThunk<
	DeferredPaymentDeleteResponse,
	{ subsidiaryId: number; documentId: number; paymentId: number },
	{ rejectValue: DeferredPaymentMutationError }
>(
	'deferredPayments/voidPayment',
	async ({ subsidiaryId, documentId, paymentId }, { rejectWithValue, signal }) => {
		try {
			return await deferredPaymentsService.deletePayment(
				subsidiaryId,
				documentId,
				paymentId,
				signal,
			);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(getMutationError(error, 'No se pudo anular el abono'));
		}
	},
);

export const markDeferredPaymentPaid = createAsyncThunk<
	IDeferredPaymentAbono,
	{ subsidiaryId: number; documentId: number },
	{ rejectValue: DeferredPaymentMutationError }
>(
	'deferredPayments/markPaid',
	async ({ subsidiaryId, documentId }, { rejectWithValue, signal }) => {
		try {
			return await deferredPaymentsService.markDocumentPaid(subsidiaryId, documentId, signal);
		} catch (error) {
			if (signal.aborted) throw error;
			return rejectWithValue(
				getMutationError(error, 'No se pudo marcar el documento como pagado'),
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
			state.errorPayment = null;
			state.errorReceipt = null;
			state.errorVoid = null;
			state.errorMarkPaid = null;
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
		builder
			.addCase(registerDeferredPayment.pending, (state, action) => {
				state.paymentRequestId = action.meta.requestId;
				state.recordingPayment = true;
				state.errorPayment = null;
			})
			.addCase(registerDeferredPayment.fulfilled, (state, action) => {
				if (state.paymentRequestId !== action.meta.requestId) return;
				state.paymentRequestId = null;
				state.recordingPayment = false;
			})
			.addCase(registerDeferredPayment.rejected, (state, action) => {
				if (state.paymentRequestId !== action.meta.requestId) return;
				state.paymentRequestId = null;
				state.recordingPayment = false;
				if (!action.meta.aborted)
					state.errorPayment = action.payload?.message ?? 'No se pudo registrar el abono';
			})
			.addCase(uploadDeferredPaymentReceipt.pending, (state, action) => {
				state.receiptRequestId = action.meta.requestId;
				state.uploadingReceipt = true;
				state.errorReceipt = null;
			})
			.addCase(uploadDeferredPaymentReceipt.fulfilled, (state, action) => {
				if (state.receiptRequestId !== action.meta.requestId) return;
				state.receiptRequestId = null;
				state.uploadingReceipt = false;
			})
			.addCase(uploadDeferredPaymentReceipt.rejected, (state, action) => {
				if (state.receiptRequestId !== action.meta.requestId) return;
				state.receiptRequestId = null;
				state.uploadingReceipt = false;
				if (!action.meta.aborted)
					state.errorReceipt =
						action.payload?.message ?? 'No se pudo subir el comprobante';
			})
			.addCase(voidDeferredPayment.pending, (state, action) => {
				state.voidRequestId = action.meta.requestId;
				state.voidingPaymentId = action.meta.arg.paymentId;
				state.errorVoid = null;
			})
			.addCase(voidDeferredPayment.fulfilled, (state, action) => {
				if (state.voidRequestId !== action.meta.requestId) return;
				state.voidRequestId = null;
				state.voidingPaymentId = null;
			})
			.addCase(voidDeferredPayment.rejected, (state, action) => {
				if (state.voidRequestId !== action.meta.requestId) return;
				state.voidRequestId = null;
				state.voidingPaymentId = null;
				if (!action.meta.aborted)
					state.errorVoid = action.payload?.message ?? 'No se pudo anular el abono';
			})
			.addCase(markDeferredPaymentPaid.pending, (state, action) => {
				state.markPaidRequestId = action.meta.requestId;
				state.markingPaid = true;
				state.errorMarkPaid = null;
			})
			.addCase(markDeferredPaymentPaid.fulfilled, (state, action) => {
				if (state.markPaidRequestId !== action.meta.requestId) return;
				state.markPaidRequestId = null;
				state.markingPaid = false;
			})
			.addCase(markDeferredPaymentPaid.rejected, (state, action) => {
				if (state.markPaidRequestId !== action.meta.requestId) return;
				state.markPaidRequestId = null;
				state.markingPaid = false;
				if (!action.meta.aborted)
					state.errorMarkPaid =
						action.payload?.message ?? 'No se pudo marcar el documento como pagado';
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
