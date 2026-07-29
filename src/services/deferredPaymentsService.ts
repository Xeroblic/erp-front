import type { AxiosRequestConfig } from 'axios';
import type {
	DeferredPaymentApiListParams,
	DeferredPaymentDeleteResponse,
	DeferredPaymentMutationApiResponse,
	DeferredPaymentsListResponse,
	IDeferredPaymentAbono,
	IDeferredPaymentCreditProfile,
	IDeferredPaymentDocument,
	IDeferredPaymentsApiSummary,
	CreateDeferredPaymentApiPayload,
	RegisterDeferredPaymentPayload,
	UpdateDeferredPaymentApiPayload,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import ApiService from '@/services/ApiService';

type ApiResource<T> = { data: T };
type ApiResourcePayload<T> = T | ApiResource<T>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const unwrapResource = <T>(payload: ApiResourcePayload<T>): T => {
	const record = asRecord(payload);
	return record && 'data' in record ? (record.data as T) : (payload as T);
};

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
		params,
		cacheTTLms: 15_000,
		...requestConfig(signal),
	});
	return response.data;
};

const getSummary = async (
	subsidiaryId: number,
	signal?: AbortSignal,
): Promise<IDeferredPaymentsApiSummary> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentsApiSummary>>({
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
	return unwrapResource(response.data);
};

const createDocument = async (
	subsidiaryId: number,
	payload: CreateDeferredPaymentApiPayload,
	signal?: AbortSignal,
): Promise<DeferredPaymentMutationApiResponse> => {
	const response = await ApiService.fetchData<
		ApiResourcePayload<DeferredPaymentMutationApiResponse>,
		CreateDeferredPaymentApiPayload
	>({
		url: documentsUrl(subsidiaryId),
		method: 'post',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return unwrapResource(response.data);
};

const updateDocument = async (
	subsidiaryId: number,
	documentId: number,
	payload: UpdateDeferredPaymentApiPayload,
	signal?: AbortSignal,
): Promise<DeferredPaymentMutationApiResponse> => {
	const response = await ApiService.fetchData<
		ApiResourcePayload<DeferredPaymentMutationApiResponse>,
		UpdateDeferredPaymentApiPayload
	>({
		url: documentUrl(subsidiaryId, documentId),
		method: 'patch',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return unwrapResource(response.data);
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
	return unwrapResource(response.data);
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
	return unwrapResource(response.data);
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
