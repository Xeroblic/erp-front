import type { AxiosRequestConfig } from 'axios';
import ApiService from './ApiService';
import type {
	IDocument,
	IDocumentFilters,
	IDocumentPayload,
	IDocumentAttachment,
	IDocumentTypeSummary,
} from '@/pages/documentos/types/documentos.types';

const buildUrl = (subsidiaryId: number, suffix = '') =>
	`/subsidiaries/${subsidiaryId}/documents${suffix}`;

const extractCollection = <T>(payload: any): T[] => {
	if (Array.isArray(payload?.data)) return payload.data as T[];
	if (Array.isArray(payload)) return payload as T[];
	return [];
};

const documentsService = {
	async listDocuments(subsidiaryId: number, filters: IDocumentFilters) {
		const response = await ApiService.fetchData<{ data?: IDocument[] }>({
			url: buildUrl(subsidiaryId),
			method: 'get',
			params: {
				with_type: 1,
				q: filters.search || undefined,
				document_type_id: filters.document_type_id || undefined,
				output_format: filters.output_format || undefined,
				related_module: filters.related_module || undefined,
				related_id: filters.related_id || undefined,
				is_active:
					typeof filters.is_active === 'boolean'
						? filters.is_active
							? 1
							: 0
						: undefined,
				per_page: filters.per_page || 100,
			},
		});

		const documents = extractCollection<IDocument>(response.data);
		return documents;
	},

	async getDocument(subsidiaryId: number, documentId: number) {
		const response = await ApiService.fetchData<{ data?: IDocument }>({
			url: buildUrl(subsidiaryId, `/${documentId}`),
			method: 'get',
		});
		return (response.data?.data || response.data) as IDocument;
	},

	async createDocument(subsidiaryId: number, payload: IDocumentPayload) {
		const response = await ApiService.fetchData<{ data?: IDocument }>({
			url: buildUrl(subsidiaryId),
			method: 'post',
			data: payload as unknown as Record<string, unknown>,
		});
		return (response.data?.data || response.data) as IDocument;
	},

	async updateDocument(
		subsidiaryId: number,
		documentId: number,
		payload: Partial<IDocumentPayload>,
	) {
		const response = await ApiService.fetchData<{ data?: IDocument }>({
			url: buildUrl(subsidiaryId, `/${documentId}`),
			method: 'patch',
			data: payload as unknown as Record<string, unknown>,
		});
		return (response.data?.data || response.data) as IDocument;
	},

	async deleteDocument(subsidiaryId: number, documentId: number) {
		await ApiService.fetchData({
			url: buildUrl(subsidiaryId, `/${documentId}`),
			method: 'delete',
		});
	},

	async uploadAttachments(
		subsidiaryId: number,
		documentId: number,
		files: File[] | FileList,
		collection?: string,
	) {
		const payload = new FormData();
		Array.from(files).forEach((file) => {
			payload.append('files[]', file);
		});
		if (collection) {
			payload.append('collection', collection);
		}

		const config: AxiosRequestConfig<FormData> = {
			url: buildUrl(subsidiaryId, `/${documentId}/attachments`),
			method: 'post',
			data: payload,
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		};
		const response = await ApiService.fetchData<{ data?: IDocumentAttachment[] }>(
			config as unknown as AxiosRequestConfig<Record<string, unknown>>,
		);
		return extractCollection<IDocumentAttachment>(response.data);
	},

	async deleteAttachment(subsidiaryId: number, documentId: number, attachmentId: number) {
		await ApiService.fetchData({
			url: buildUrl(subsidiaryId, `/${documentId}/attachments/${attachmentId}`),
			method: 'delete',
		});
	},

	async listDocumentTypes(isActive?: boolean) {
		const response = await ApiService.fetchData<{ data?: IDocumentTypeSummary[] }>({
			url: '/document-types',
			method: 'get',
			params: {
				is_active: typeof isActive === 'boolean' ? (isActive ? 1 : 0) : undefined,
				per_page: 200,
			},
		});
		return extractCollection<IDocumentTypeSummary>(response.data);
	},
};

export default documentsService;
