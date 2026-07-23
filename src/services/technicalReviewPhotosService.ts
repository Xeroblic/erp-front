/**
 * technicalReviewPhotosService.ts
 * Capa HTTP para la galería de fotos de una revisión técnica (por item).
 *
 * Rutas canónicas (prefijo subsidiaria):
 *   GET    /subsidiaries/{subsidiary}/technical-reviews/items/{item}/photos
 *   POST   /subsidiaries/{subsidiary}/technical-reviews/items/{item}/photos        (multipart, photos[])
 *   DELETE /subsidiaries/{subsidiary}/technical-reviews/items/{item}/photos/{media}
 */
import ApiService from './ApiService';
import type { ITechnicalReviewPhoto } from '@/interface/technicalReviews.interface';

const buildUrl = (subsidiaryId: number, itemId: number, suffix = ''): string =>
	`/subsidiaries/${subsidiaryId}/technical-reviews/items/${itemId}/photos${suffix}`;

const asRecord = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toNumber = (value: unknown, fallback = 0): number => {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

const toStringOrNull = (value: unknown): string | null =>
	typeof value === 'string' && value.length > 0 ? value : null;

/** Normaliza un item de foto, tolerando `thumb` (list) y `thumb_url` (upload). */
const normalizePhoto = (raw: unknown): ITechnicalReviewPhoto => {
	const r = asRecord(raw);
	return {
		id: toNumber(r.id),
		url: typeof r.url === 'string' ? r.url : '',
		thumb: toStringOrNull(r.thumb) ?? toStringOrNull(r.thumb_url),
		alt: toStringOrNull(r.alt),
		sort: toNumber(r.sort, 0),
		source_url: toStringOrNull(r.source_url),
		file_name: toStringOrNull(r.file_name),
	};
};

/** Extrae la colección de fotos del wrapper `{ data: [...] }` o de un arreglo plano. */
const extractCollection = (payload: unknown): ITechnicalReviewPhoto[] => {
	const root = asRecord(payload);
	const list = Array.isArray(root.data)
		? root.data
		: Array.isArray(payload)
			? (payload as unknown[])
			: [];
	return list.map(normalizePhoto).filter((p) => p.id > 0);
};

const technicalReviewPhotosService = {
	/** Lista las fotos de la galería del item. Permiso: view-technical-reviews-items */
	async list(subsidiaryId: number, itemId: number): Promise<ITechnicalReviewPhoto[]> {
		const response = await ApiService.fetchData<{ data?: unknown[] }>({
			url: buildUrl(subsidiaryId, itemId),
			method: 'get',
		});
		return extractCollection(response.data);
	},

	/**
	 * Sube 1..20 fotos (multipart/form-data). Permiso: review-technical-reviews-items.
	 * Devuelve las fotos recién creadas normalizadas.
	 */
	async upload(
		subsidiaryId: number,
		itemId: number,
		files: File[],
	): Promise<ITechnicalReviewPhoto[]> {
		const formData = new FormData();
		files.forEach((file) => formData.append('photos[]', file, file.name));

		const response = await ApiService.fetchData<{ data?: unknown[] }, FormData>({
			url: buildUrl(subsidiaryId, itemId),
			method: 'post',
			data: formData,
		});
		return extractCollection(response.data);
	},

	/** Elimina una foto de forma permanente. Permiso: review-technical-reviews-items */
	async remove(subsidiaryId: number, itemId: number, mediaId: number): Promise<void> {
		await ApiService.fetchData({
			url: buildUrl(subsidiaryId, itemId, `/${mediaId}`),
			method: 'delete',
		});
	},

	async downloadZip(subsidiaryId: number, itemId: number): Promise<Blob> {
		const response = await ApiService.fetchData<Blob>({
			url: `${buildUrl(subsidiaryId, itemId)}/download`,
			method: 'get',
			responseType: 'blob',
		});
		return response.data as Blob;
	},
};

export default technicalReviewPhotosService;
