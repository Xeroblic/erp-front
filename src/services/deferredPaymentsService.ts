import type { AxiosRequestConfig } from 'axios';
import type {
	DeferredPaymentApiListParams,
	DeferredPaymentDeleteResponse,
	DeferredPaymentMutationApiResponse,
	DeferredPaymentsListResponse,
	IDeferredPaymentAbono,
	IDeferredPaymentCreditProfile,
	IDeferredPaymentDocument,
	IDeferredPaymentsSummary,
	CreateDeferredPaymentApiPayload,
	RegisterDeferredPaymentPayload,
	UpdateDeferredPaymentApiPayload,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import ApiService from '@/services/ApiService';

type ApiResource<T> = { data: T };
type ApiResourcePayload<T> = T | ApiResource<T>;
type CreateDocumentApiResponse = ApiResourcePayload<IDeferredPaymentDocument> & {
	credit_limit_exceeded?: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const unwrapResource = <T>(payload: ApiResourcePayload<T>): T => {
	const record = asRecord(payload);
	return record && 'data' in record ? (record.data as T) : (payload as T);
};

const API_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const toDomainDate = (value: string): string => {
	const match = API_DATE_REGEX.exec(value);
	return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const toApiDate = (value?: string): string | undefined => {
	if (!value) return undefined;
	const match = ISO_DATE_REGEX.exec(value);
	return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

const toCreateApiPayload = (
	payload: CreateDeferredPaymentApiPayload,
): CreateDeferredPaymentApiPayload => ({
	...payload,
	issue_date: toApiDate(payload.issue_date) ?? payload.issue_date,
	due_date: payload.due_date === null ? null : toApiDate(payload.due_date),
});

const toUpdateApiPayload = (
	payload: UpdateDeferredPaymentApiPayload,
): UpdateDeferredPaymentApiPayload => ({
	...payload,
	...(payload.issue_date !== undefined && { issue_date: toApiDate(payload.issue_date) }),
	...(payload.due_date !== undefined && {
		due_date: payload.due_date === null ? null : toApiDate(payload.due_date),
	}),
});

const normalizePayment = (payment: IDeferredPaymentAbono): IDeferredPaymentAbono => ({
	...payment,
	paid_at: toDomainDate(payment.paid_at),
	attachments: payment.attachments ?? [],
});

const normalizeDocument = (document: IDeferredPaymentDocument): IDeferredPaymentDocument => ({
	...document,
	issue_date: toDomainDate(document.issue_date),
	due_date: toDomainDate(document.due_date),
	assignees: document.assignees ?? [],
	items: (document.items ?? []).map((item) => ({
		...item,
		code: item.code ?? '',
		unit_price: item.unit_price ?? '0.00',
		serials: item.serials ?? [],
	})),
	payments: (document.payments ?? []).map(normalizePayment),
	attachments: document.attachments ?? [],
});

const normalizeListItem = (
	document: DeferredPaymentsListResponse['data'][number],
): DeferredPaymentsListResponse['data'][number] => ({
	...document,
	issue_date: toDomainDate(document.issue_date),
	due_date: toDomainDate(document.due_date),
});
const documentsUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/deferred-payments`;

const documentUrl = (subsidiaryId: number, documentId: number): string =>
	`${documentsUrl(subsidiaryId)}/${documentId}`;

const creditProfileUrl = (subsidiaryId: number, customerSaleId: number): string =>
	`/subsidiaries/${subsidiaryId}/customer-sales/${customerSaleId}/credit-profile`;

const requestConfig = (signal?: AbortSignal): Pick<AxiosRequestConfig, 'signal'> => ({ signal });

const getDocuments = async (
	subsidiaryId: number,
	params: DeferredPaymentApiListParams = {},
	signal?: AbortSignal,
): Promise<DeferredPaymentsListResponse> => {
	const response = await ApiService.fetchData<DeferredPaymentsListResponse>({
		url: documentsUrl(subsidiaryId),
		method: 'get',
		params: {
			...params,
			due_before: toApiDate(params.due_before),
			due_after: toApiDate(params.due_after),
		},
		cacheTTLms: 15_000,
		...requestConfig(signal),
	});
	return {
		...response.data,
		data: response.data.data.map(normalizeListItem),
	};
};

const getSummary = async (
	subsidiaryId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentsSummary> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentsSummary>>({
		url: `${documentsUrl(subsidiaryId)}/summary`,
		method: 'get',
		cacheTTLms: 30_000,
		...requestConfig(signal),
	});
	return unwrapResource(response.data);
};

const getDocument = async (
	subsidiaryId: number,
	documentId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentDocument> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentDocument>>({
		url: documentUrl(subsidiaryId, documentId),
		method: 'get',
		cacheTTLms: 15_000,
		...requestConfig(signal),
	});
	return normalizeDocument(unwrapResource(response.data));
};

const createDocument = async (
	subsidiaryId: number,
	payload: CreateDeferredPaymentApiPayload,
	signal?: AbortSignal,
): Promise<DeferredPaymentMutationApiResponse> => {
	const response = await ApiService.fetchData<
		CreateDocumentApiResponse,
		CreateDeferredPaymentApiPayload
	>({
		url: documentsUrl(subsidiaryId),
		method: 'post',
		data: toCreateApiPayload(payload),
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return {
		document: normalizeDocument(unwrapResource(response.data)),
		credit_limit_exceeded: asRecord(response.data)?.credit_limit_exceeded === true,
	};
};

const updateDocument = async (
	subsidiaryId: number,
	documentId: number,
	payload: UpdateDeferredPaymentApiPayload,
	signal?: AbortSignal,
): Promise<IDeferredPaymentDocument> => {
	const response = await ApiService.fetchData<
		ApiResourcePayload<IDeferredPaymentDocument>,
		UpdateDeferredPaymentApiPayload
	>({
		url: documentUrl(subsidiaryId, documentId),
		method: 'patch',
		data: toUpdateApiPayload(payload),
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return normalizeDocument(unwrapResource(response.data));
};

const deleteDocument = async (
	subsidiaryId: number,
	documentId: number,
	signal?: AbortSignal,
): Promise<DeferredPaymentDeleteResponse> => {
	const response = await ApiService.fetchData<DeferredPaymentDeleteResponse>({
		url: documentUrl(subsidiaryId, documentId),
		method: 'delete',
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return response.data;
};

const registerPayment = async (
	subsidiaryId: number,
	documentId: number,
	payload: RegisterDeferredPaymentPayload,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAbono> => {
	const response = await ApiService.fetchData<
		ApiResourcePayload<IDeferredPaymentAbono>,
		RegisterDeferredPaymentPayload
	>({
		url: `${documentUrl(subsidiaryId, documentId)}/payments`,
		method: 'post',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return normalizePayment(unwrapResource(response.data));
};

const deletePayment = async (
	subsidiaryId: number,
	documentId: number,
	paymentId: number,
	signal?: AbortSignal,
): Promise<DeferredPaymentDeleteResponse> => {
	const response = await ApiService.fetchData<DeferredPaymentDeleteResponse>({
		url: `${documentUrl(subsidiaryId, documentId)}/payments/${paymentId}`,
		method: 'delete',
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return response.data;
};

const markDocumentPaid = async (
	subsidiaryId: number,
	documentId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAbono> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentAbono>>({
		url: `${documentUrl(subsidiaryId, documentId)}/mark-paid`,
		method: 'post',
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return normalizePayment(unwrapResource(response.data));
};

const getCreditProfile = async (
	subsidiaryId: number,
	customerSaleId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentCreditProfile> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentCreditProfile>>({
		url: creditProfileUrl(subsidiaryId, customerSaleId),
		method: 'get',
		cacheTTLms: 30_000,
		...requestConfig(signal),
	});
	return unwrapResource(response.data);
};

const updateCreditProfile = async (
	subsidiaryId: number,
	customerSaleId: number,
	payload: UpdateDeferredPaymentCreditProfilePayload,
	signal?: AbortSignal,
): Promise<IDeferredPaymentCreditProfile> => {
	const response = await ApiService.fetchData<
		ApiResourcePayload<IDeferredPaymentCreditProfile>,
		UpdateDeferredPaymentCreditProfilePayload
	>({
		url: creditProfileUrl(subsidiaryId, customerSaleId),
		method: 'put',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(creditProfileUrl(subsidiaryId, customerSaleId));
	return unwrapResource(response.data);
};

const deferredPaymentsService = {
	getDocuments,
	getSummary,
	getDocument,
	createDocument,
	updateDocument,
	deleteDocument,
	registerPayment,
	deletePayment,
	markDocumentPaid,
	getCreditProfile,
	updateCreditProfile,
};

export default deferredPaymentsService;
