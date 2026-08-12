import type { AxiosRequestConfig } from 'axios';
import type {
	DeferredPaymentApiListParams,
	DeferredPaymentApiSummaryParams,
	DeferredPaymentCreditProfilesApiParams,
	DeferredPaymentCreditProfilesListResponse,
	DeferredPaymentDeleteResponse,
	DeferredPaymentMutationApiResponse,
	DeferredPaymentsListResponse,
	IDeferredPaymentAbono,
	IDeferredPaymentAttachment,
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
type DocumentMutationApiResponse = ApiResourcePayload<IDeferredPaymentDocument> & {
	credit_limit_exceeded?: boolean;
};
export interface DeferredPaymentAttachmentDownload {
	blob: Blob;
	fileName: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const unwrapResource = <T>(payload: ApiResourcePayload<T>): T => {
	const record = asRecord(payload);
	return record && 'data' in record ? (record.data as T) : (payload as T);
};

const normalizePayment = (payment: IDeferredPaymentAbono): IDeferredPaymentAbono => ({
	...payment,
	attachments: payment.attachments ?? [],
});

const normalizeDocument = (document: IDeferredPaymentDocument): IDeferredPaymentDocument => ({
	...document,
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

const documentsUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/deferred-payments`;

const documentUrl = (subsidiaryId: number, documentId: number): string =>
	`${documentsUrl(subsidiaryId)}/${documentId}`;

const creditProfileUrl = (subsidiaryId: number, customerSaleId: number): string =>
	`/subsidiaries/${subsidiaryId}/customer-sales/${customerSaleId}/credit-profile`;

const creditProfilesUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/credit-profiles`;

const invalidateCreditProfiles = (subsidiaryId: number): void => {
	ApiService.invalidateCache(creditProfilesUrl(subsidiaryId));
};

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
	params: DeferredPaymentApiSummaryParams = {},
	signal?: AbortSignal,
): Promise<IDeferredPaymentsSummary> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentsSummary>>({
		url: `${documentsUrl(subsidiaryId)}/summary`,
		method: 'get',
		params,
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
		DocumentMutationApiResponse,
		CreateDeferredPaymentApiPayload
	>({
		url: documentsUrl(subsidiaryId),
		method: 'post',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	ApiService.invalidateCache(`${documentsUrl(subsidiaryId)}/summary`);
	invalidateCreditProfiles(subsidiaryId);
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
): Promise<DeferredPaymentMutationApiResponse> => {
	const response = await ApiService.fetchData<
		DocumentMutationApiResponse,
		UpdateDeferredPaymentApiPayload
	>({
		url: documentUrl(subsidiaryId, documentId),
		method: 'patch',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	invalidateCreditProfiles(subsidiaryId);
	return {
		document: normalizeDocument(unwrapResource(response.data)),
		credit_limit_exceeded: asRecord(response.data)?.credit_limit_exceeded === true,
	};
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
	invalidateCreditProfiles(subsidiaryId);
	return response.data;
};

const registerPayment = async (
	subsidiaryId: number,
	documentId: number,
	payload: RegisterDeferredPaymentPayload,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAbono> => {
	const formData = new FormData();
	formData.append('amount', payload.amount);
	formData.append('paid_at', payload.paid_at);
	formData.append('method', payload.method);
	formData.append('notes', payload.notes ?? '');
	if (payload.receipt) formData.append('receipt', payload.receipt);
	const response = await ApiService.fetchData<
		ApiResourcePayload<IDeferredPaymentAbono>,
		FormData
	>({
		url: `${documentUrl(subsidiaryId, documentId)}/payments`,
		method: 'post',
		data: formData,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	invalidateCreditProfiles(subsidiaryId);
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
	invalidateCreditProfiles(subsidiaryId);
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
	invalidateCreditProfiles(subsidiaryId);
	return normalizePayment(unwrapResource(response.data));
};

const uploadDeferredPaymentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	paymentId: number,
	file: File,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAttachment> => {
	const payload = new FormData();
	payload.append('file', file);
	payload.append('deferred_payment_id', String(paymentId));
	const response = await ApiService.fetchData<
		ApiResourcePayload<IDeferredPaymentAttachment>,
		FormData
	>({
		url: `${documentUrl(subsidiaryId, documentId)}/attachments`,
		method: 'post',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return unwrapResource(response.data);
};

const uploadDeferredPaymentDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	file: File,
	shareWithCustomer: boolean,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAttachment> => {
	const payload = new FormData();
	payload.append('file', file);
	payload.append('share_with_customer', shareWithCustomer ? '1' : '0');
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentAttachment>, FormData>({
		url: `${documentUrl(subsidiaryId, documentId)}/attachments`,
		method: 'post',
		data: payload,
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return unwrapResource(response.data);
};

const deleteDeferredPaymentDocumentAttachment = async (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
	signal?: AbortSignal,
): Promise<void> => {
	await ApiService.fetchData({
		url: `${documentUrl(subsidiaryId, documentId)}/attachments/${attachmentId}`,
		method: 'delete',
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
};

const updateDeferredPaymentAttachmentSharing = async (
	subsidiaryId: number,
	documentId: number,
	attachmentId: number,
	shareWithCustomer: boolean,
	signal?: AbortSignal,
): Promise<IDeferredPaymentAttachment> => {
	const response = await ApiService.fetchData<ApiResourcePayload<IDeferredPaymentAttachment>, { share_with_customer: boolean }>({
		url: `${documentUrl(subsidiaryId, documentId)}/attachments/${attachmentId}/sharing`,
		method: 'patch',
		data: { share_with_customer: shareWithCustomer },
		...requestConfig(signal),
	});
	ApiService.invalidateCache(documentsUrl(subsidiaryId));
	return unwrapResource(response.data);
};

const downloadDeferredPaymentAttachment = async (
	url: string,
	signal?: AbortSignal,
): Promise<DeferredPaymentAttachmentDownload> => {
	const response = await ApiService.fetchData<Blob>({
		url,
		method: 'get',
		responseType: 'blob',
		...requestConfig(signal),
	});
	const disposition = response.headers?.['content-disposition'];
	const encodedName =
		typeof disposition === 'string'
			? disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
			: undefined;
	const quotedName =
		typeof disposition === 'string'
			? disposition.match(/filename="?([^";]+)"?/i)?.[1]
			: undefined;
	let fileName: string | null = null;
	try {
		fileName = encodedName ? decodeURIComponent(encodedName) : (quotedName ?? null);
	} catch {
		fileName = encodedName ?? quotedName ?? null;
	}
	return { blob: response.data, fileName };
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

const getCreditProfiles = async (
	subsidiaryId: number,
	params: DeferredPaymentCreditProfilesApiParams = {},
	signal?: AbortSignal,
): Promise<DeferredPaymentCreditProfilesListResponse> => {
	const response = await ApiService.fetchData<DeferredPaymentCreditProfilesListResponse>({
		url: creditProfilesUrl(subsidiaryId),
		method: 'get',
		params,
		cacheTTLms: 15_000,
		...requestConfig(signal),
	});
	return response.data;
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
	invalidateCreditProfiles(subsidiaryId);
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
	uploadDeferredPaymentAttachment,
	uploadDeferredPaymentDocumentAttachment,
	deleteDeferredPaymentDocumentAttachment,
	updateDeferredPaymentAttachmentSharing,
	downloadDeferredPaymentAttachment,
	getCreditProfile,
	getCreditProfiles,
	updateCreditProfile,
};

export default deferredPaymentsService;
