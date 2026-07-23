/**
 * useReviewPhotos
 * Maneja el estado y las acciones de la galería de fotos de una revisión técnica:
 * listar, subir (con validación cliente) y eliminar. Toasts para feedback.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import technicalReviewPhotosService from '@/services/technicalReviewPhotosService';
import type { ITechnicalReviewPhoto } from '@/interface/technicalReviews.interface';
import {
	ALLOWED_PHOTO_EXTENSIONS,
	ALLOWED_PHOTO_MIMES,
	MAX_PHOTOS_PER_UPLOAD,
	MAX_PHOTO_SIZE_BYTES,
	MAX_PHOTO_SIZE_KB,
} from './gallery.constants';

interface UseReviewPhotosParams {
	subsidiaryId: number | null;
	itemId: number | null;
	/** Si false, no se cargan las fotos (p.ej. faltando contexto). */
	enabled?: boolean;
}

interface UseReviewPhotosResult {
	photos: ITechnicalReviewPhoto[];
	/**
	 * Previews locales (object URLs) por id de foto recién subida. Permiten
	 * mostrar la imagen al instante mientras el backend genera el thumbnail.
	 */
	previews: Record<number, string>;
	loading: boolean;
	uploading: boolean;
	downloading: boolean;
	deletingId: number | null;
	error: string | null;
	refresh: () => Promise<void>;
	upload: (files: File[]) => Promise<void>;
	download: () => Promise<void>;
	remove: (mediaId: number) => Promise<void>;
}

const getExtension = (name: string): string => {
	const idx = name.lastIndexOf('.');
	return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
};

/** Separa los archivos válidos de los rechazados según reglas de negocio. */
const partitionFiles = (files: File[]): { valid: File[]; rejected: string[] } => {
	const valid: File[] = [];
	const rejected: string[] = [];

	for (const file of files) {
		const ext = getExtension(file.name);
		const mime = file.type?.toLowerCase() ?? '';
		const extOk = (ALLOWED_PHOTO_EXTENSIONS as readonly string[]).includes(ext);
		const mimeOk = mime === '' || (ALLOWED_PHOTO_MIMES as readonly string[]).includes(mime);

		if (!extOk || !mimeOk) {
			rejected.push(`${file.name}: formato no permitido (jpg, jpeg, png, webp)`);
			continue;
		}
		if (file.size > MAX_PHOTO_SIZE_BYTES) {
			rejected.push(`${file.name}: supera ${MAX_PHOTO_SIZE_KB / 1024} MB`);
			continue;
		}
		valid.push(file);
	}

	return { valid, rejected };
};

const getErrorMessage = (err: unknown, fallback: string): string => {
	if (err && typeof err === 'object') {
		const response = (err as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
		const message = (err as { message?: string }).message;
		if (message) return message;
	}
	return fallback;
};

export const useReviewPhotos = ({
	subsidiaryId,
	itemId,
	enabled = true,
}: UseReviewPhotosParams): UseReviewPhotosResult => {
	const [photos, setPhotos] = useState<ITechnicalReviewPhoto[]>([]);
	const [previews, setPreviews] = useState<Record<number, string>>({});
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Evita setState tras desmontar
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	// Espejo de los previews para poder revocarlos al desmontar sin re-suscribir
	const previewsRef = useRef<Record<number, string>>({});
	useEffect(() => {
		previewsRef.current = previews;
	}, [previews]);
	useEffect(
		() => () => {
			Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
		},
		[],
	);

	const canOperate = enabled && !!subsidiaryId && !!itemId;

	const refresh = useCallback(async () => {
		if (!subsidiaryId || !itemId) return;
		setLoading(true);
		setError(null);
		try {
			const data = await technicalReviewPhotosService.list(subsidiaryId, itemId);
			if (mountedRef.current) setPhotos(data);
		} catch (err) {
			const message = getErrorMessage(err, 'No se pudieron cargar las fotos');
			if (mountedRef.current) setError(message);
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, [subsidiaryId, itemId]);

	useEffect(() => {
		if (canOperate) void refresh();
	}, [canOperate, refresh]);

	const upload = useCallback(
		async (files: File[]) => {
			if (!subsidiaryId || !itemId || files.length === 0) return;

			const { valid, rejected } = partitionFiles(files);
			rejected.forEach((msg) => toast.error(msg));

			if (valid.length === 0) return;

			let batch = valid;
			if (batch.length > MAX_PHOTOS_PER_UPLOAD) {
				toast.warning(
					`Máximo ${MAX_PHOTOS_PER_UPLOAD} fotos por carga. Se subirán las primeras ${MAX_PHOTOS_PER_UPLOAD}.`,
				);
				batch = batch.slice(0, MAX_PHOTOS_PER_UPLOAD);
			}

			setUploading(true);
			try {
				const created = await technicalReviewPhotosService.upload(
					subsidiaryId,
					itemId,
					batch,
				);
				if (mountedRef.current && created.length > 0) {
					// Preview instantáneo: asocia cada foto creada con su archivo
					// de origen (mismo orden del batch) vía object URL.
					const newPreviews: Record<number, string> = {};
					created.forEach((photo, i) => {
						const file = batch[i];
						if (file) newPreviews[photo.id] = URL.createObjectURL(file);
					});
					setPreviews((prev) => ({ ...prev, ...newPreviews }));
					setPhotos((prev) =>
						[...prev, ...created].sort((a, b) => a.sort - b.sort || a.id - b.id),
					);
				}
				toast.success(
					created.length === 1 ? 'Foto agregada.' : `${created.length} fotos agregadas.`,
				);
			} catch (err) {
				toast.error(getErrorMessage(err, 'No se pudieron subir las fotos'));
			} finally {
				if (mountedRef.current) setUploading(false);
			}
		},
		[subsidiaryId, itemId],
	);

	const remove = useCallback(
		async (mediaId: number) => {
			if (!subsidiaryId || !itemId) return;
			setDeletingId(mediaId);
			try {
				await technicalReviewPhotosService.remove(subsidiaryId, itemId, mediaId);
				if (mountedRef.current) {
					setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
					setPreviews((prev) => {
						if (!(mediaId in prev)) return prev;
						URL.revokeObjectURL(prev[mediaId]);
						const next = { ...prev };
						delete next[mediaId];
						return next;
					});
				}
				toast.success('Foto eliminada.');
			} catch (err) {
				toast.error(getErrorMessage(err, 'No se pudo eliminar la foto'));
			} finally {
				if (mountedRef.current) setDeletingId(null);
			}
		},
		[subsidiaryId, itemId],
	);

	const download = useCallback(async () => {
		if (!subsidiaryId || !itemId) return;
		setDownloading(true);
		try {
			const blob = await technicalReviewPhotosService.downloadZip(subsidiaryId, itemId);
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `revision-${itemId}-fotos.zip`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast.error(getErrorMessage(err, 'No se pudieron descargar las fotos'));
		} finally {
			if (mountedRef.current) setDownloading(false);
		}
	}, [subsidiaryId, itemId]);

	return { photos, previews, loading, uploading, downloading, deletingId, error, refresh, upload, download, remove };
};

export default useReviewPhotos;
