// Utilities for API payload normalization and media helpers
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

export const normalizeCommunePayload = (d: any) => {
	const p: any = { ...d };
	if (p.commune !== undefined) {
		const v = p.commune?.value ?? p.commune?.id ?? p.commune;
		p.commune_id = v || v === 0 ? Number(v) : null;
		delete p.commune;
	}
	if (p.comuna !== undefined) {
		const v = p.comuna?.value ?? p.comuna?.id ?? p.comuna;
		p.commune_id = v || v === 0 ? Number(v) : null;
		delete p.comuna;
	}
	if (p.commune_id !== undefined) {
		p.commune_id = p.commune_id === '' || p.commune_id === null ? null : Number(p.commune_id);
		if (Number.isNaN(p.commune_id)) p.commune_id = null;
	}
	return p;
};

export const extractMediaUrl = (payload: any): string | null => {
	if (!payload) return null;
	const pickCandidate = (value: any): any => {
		if (!value) return null;
		if (Array.isArray(value)) return value[0] ?? null;
		if (Array.isArray(value?.data)) return value.data[0] ?? null;
		if (Array.isArray(value?.media)) return value.media[0] ?? null;
		return value;
	};
	const candidate = pickCandidate(payload);
	if (!candidate || typeof candidate !== 'object') return null;
	const possibilities = [
		candidate.url,
		candidate.original_url,
		candidate.preview_url,
		candidate.full_url,
		candidate.thumbnail_url,
		candidate.thumb,
	];
	const raw = possibilities.find((item) => typeof item === 'string' && item.length > 0) ?? null;
	return ensureAbsoluteUrl(raw);
};

export type FileValidationResult = { ok: true } | { ok: false; reason: string };

export const validateFile = (
	file: File,
	opts: { maxKB?: number; allowedMimes?: string[] } = {},
): FileValidationResult => {
	if (!file) return { ok: false, reason: 'no-file' };
	const { maxKB, allowedMimes } = opts;
	if (maxKB && file.size > maxKB * 1024) return { ok: false, reason: 'size' };
	if (allowedMimes && allowedMimes.length > 0) {
		const mime = file.type?.toLowerCase() ?? '';
		if (!allowedMimes.map((m) => m.toLowerCase()).includes(mime))
			return { ok: false, reason: 'mime' };
	}
	return { ok: true };
};

export default { normalizeCommunePayload, extractMediaUrl, validateFile };
