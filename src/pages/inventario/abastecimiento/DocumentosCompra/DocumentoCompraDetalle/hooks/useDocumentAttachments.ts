import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
	deletePurchaseDocumentAttachment,
	downloadPurchaseDocumentAttachment,
	listPurchaseDocumentAttachments,
	uploadPurchaseDocumentAttachment,
} from '@/services/procurement/purchaseDocumentAttachments.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import { createIdempotencyKey } from '@/utils/procurementWrite.util';
import {
	PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES,
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT,
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES,
} from '@/interface/procurement.interface';
import type {
	IApiPaginationMeta,
	IPurchaseDocumentAttachment,
} from '@/interface/procurement.interface';

/**
 * Adjuntos privados del detalle de documento de compra. Estado local: sólo
 * importan mientras la ficha está abierta.
 *
 * Cada escritura exitosa cambia `related_counts.attachments` del documento,
 * que vive en `purchaseDocumentsSlice`: `onChanged` avisa al padre para que
 * lo recargue en vez de sincronizar dos stores a mano.
 *
 * El router reutiliza esta instancia al navegar entre documentos, así que cada
 * operación captura la generación de su contexto (`subsidiaryId` +
 * `documentId`) y se descarta en silencio si resuelve después de un cambio.
 */

const PER_PAGE = PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT;
const NOT_FOUND_STATUS = 404;

const ALLOWED_MIME_TYPES: readonly string[] = PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES;

const getClientFileError = (file: File): string | null => {
	if (!ALLOWED_MIME_TYPES.includes(file.type)) return `${file.name}: debe ser PDF, JPG o PNG.`;
	if (file.size > PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES)
		return `${file.name}: supera los 10 MB permitidos por archivo.`;
	return null;
};

const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = objectUrl;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

export type TAttachmentUploadStatus = 'pending' | 'uploading' | 'error';

/**
 * `idempotencyKey` se genera una sola vez por archivo: ante un timeout con
 * resultado incierto, reintentar con una clave nueva podría duplicar la subida.
 */
export interface IPendingAttachmentUpload {
	localId: string;
	file: File;
	idempotencyKey: string;
	status: TAttachmentUploadStatus;
	errorMessage: string | null;
}

interface IUseDocumentAttachmentsArgs {
	subsidiaryId: number | null;
	documentId: number | null;
	canUpload: boolean;
	canDelete: boolean;
	onChanged: () => void;
}

const useDocumentAttachments = ({
	subsidiaryId,
	documentId,
	canUpload,
	canDelete,
	onChanged,
}: IUseDocumentAttachmentsArgs) => {
	const [attachments, setAttachments] = useState<IPurchaseDocumentAttachment[]>([]);
	const [meta, setMeta] = useState<IApiPaginationMeta | null>(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [listError, setListError] = useState<string | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [uploadQueue, setUploadQueue] = useState<IPendingAttachmentUpload[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [downloadingId, setDownloadingId] = useState<number | null>(null);
	// Fuerza la recarga aunque `page` ya sea 1: `setPage(1)` sería un no-op.
	const [reloadToken, setReloadToken] = useState(0);

	// Espejo síncrono de `uploadQueue`: el bucle lee los pendientes agregados
	// después de arrancar, que su closure de estado no vería.
	const queueRef = useRef<IPendingAttachmentUpload[]>([]);
	const setQueue = useCallback(
		(updater: (previous: IPendingAttachmentUpload[]) => IPendingAttachmentUpload[]) => {
			queueRef.current = updater(queueRef.current);
			setUploadQueue(queueRef.current);
		},
		[],
	);

	const generationRef = useRef(0);

	// Generación dueña del bucle de subida en curso, o `null` si no corre
	// ninguno. Es un ref y no `isUploading` porque dos llamadas en el mismo
	// tick leerían el mismo estado cerrado y arrancarían dos bucles. Guarda la
	// generación, no un booleano: el bucle de un documento abandonado sigue
	// esperando su petición y no debe bloquear la cola del documento actual.
	const processingGenerationRef = useRef<number | null>(null);

	useEffect(() => {
		generationRef.current += 1;
		queueRef.current = [];
		setUploadQueue([]);
		setPage(1);
		setAttachments([]);
		setMeta(null);
		setListError(null);
		setValidationError(null);
		setIsUploading(false);
		setDeletingId(null);
		setDownloadingId(null);
	}, [subsidiaryId, documentId]);

	useEffect(() => {
		if (subsidiaryId === null || documentId === null) return undefined;

		let cancelled = false;
		setLoading(true);
		setListError(null);
		listPurchaseDocumentAttachments(subsidiaryId, documentId, { page, per_page: PER_PAGE })
			.then((response) => {
				if (cancelled) return;
				setAttachments(response.data);
				setMeta(response.meta);
			})
			.catch(() => {
				if (!cancelled) setListError('No se pudieron cargar los adjuntos.');
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, documentId, page, reloadToken]);

	const refetch = useCallback(() => {
		setPage(1);
		setReloadToken((token) => token + 1);
	}, []);

	const totalCount = meta?.total ?? attachments.length;
	// La cola también consume cupo: si no, dos tandas seguidas podrían superar el máximo.
	const queuedCount = uploadQueue.filter((item) => item.status !== 'error').length;
	const remainingQuota = Math.max(
		0,
		PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT - totalCount - queuedCount,
	);
	const isQuotaReached = remainingQuota === 0;

	/**
	 * Sube los pendientes uno por uno, para no competir por el cupo del backend
	 * dentro de la misma tanda. Un fallo deja el archivo en `error`, listo para
	 * reintentar, y el bucle sigue con el siguiente.
	 */
	const runUploadQueue = useCallback(
		async (opSubsidiaryId: number, opDocumentId: number) => {
			const generation = generationRef.current;
			if (processingGenerationRef.current === generation) return;
			processingGenerationRef.current = generation;
			setIsUploading(true);
			let hadSuccess = false;
			try {
				for (;;) {
					if (generationRef.current !== generation) return;
					const next = queueRef.current.find((item) => item.status === 'pending');
					if (!next) break;

					setQueue((previous) =>
						previous.map((item) =>
							item.localId === next.localId ? { ...item, status: 'uploading' } : item,
						),
					);

					try {
						// eslint-disable-next-line no-await-in-loop -- secuencial a propósito: ver comentario del bucle.
						await uploadPurchaseDocumentAttachment(
							opSubsidiaryId,
							opDocumentId,
							next.file,
							{
								idempotencyKey: next.idempotencyKey,
							},
						);
						if (generationRef.current !== generation) return;
						hadSuccess = true;
						setQueue((previous) =>
							previous.filter((item) => item.localId !== next.localId),
						);
					} catch (error) {
						if (generationRef.current !== generation) return;
						const { message } = resolveProcurementError(
							error,
							'No se pudo subir el adjunto.',
						);
						setQueue((previous) =>
							previous.map((item) =>
								item.localId === next.localId
									? { ...item, status: 'error', errorMessage: message }
									: item,
							),
						);
					}
				}
			} finally {
				if (processingGenerationRef.current === generation) {
					processingGenerationRef.current = null;
					setIsUploading(false);
				}
			}

			// También con fallos en la tanda: lo que sí se subió ya existe en el backend.
			if (hadSuccess && generationRef.current === generation) {
				refetch();
				onChanged();
			}
		},
		[setQueue, refetch, onChanged],
	);

	const addFiles = useCallback(
		async (fileList: FileList | null) => {
			if (!fileList || fileList.length === 0) return;
			if (subsidiaryId === null || documentId === null || !canUpload) return;
			const opSubsidiaryId = subsidiaryId;
			const opDocumentId = documentId;

			const files = Array.from(fileList);
			const rejected = files
				.map((file) => getClientFileError(file))
				.filter((message): message is string => message !== null);
			const accepted = files.filter((file) => getClientFileError(file) === null);

			const overQuota = accepted.slice(remainingQuota);
			const toQueue = accepted.slice(0, remainingQuota);
			const messages = [...rejected];
			if (overQuota.length > 0) {
				messages.push(
					`No hay cupo para ${overQuota.length} archivo(s) más: el documento admite hasta ${PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT} adjuntos.`,
				);
			}
			setValidationError(messages.length > 0 ? messages.join(' ') : null);
			if (toQueue.length === 0) return;

			const newItems: IPendingAttachmentUpload[] = toQueue.map((file) => ({
				localId: createIdempotencyKey(),
				file,
				idempotencyKey: createIdempotencyKey(),
				status: 'pending',
				errorMessage: null,
			}));
			setQueue((previous) => [...previous, ...newItems]);
			await runUploadQueue(opSubsidiaryId, opDocumentId);
		},
		[subsidiaryId, documentId, canUpload, remainingQuota, setQueue, runUploadQueue],
	);

	/** Reintenta con la misma `Idempotency-Key` del intento original. */
	const retryUpload = useCallback(
		(localId: string) => {
			if (subsidiaryId === null || documentId === null) return;
			const opSubsidiaryId = subsidiaryId;
			const opDocumentId = documentId;
			const target = queueRef.current.find((item) => item.localId === localId);
			if (!target || target.status !== 'error') return;

			setQueue((previous) =>
				previous.map((item) =>
					item.localId === localId
						? { ...item, status: 'pending', errorMessage: null }
						: item,
				),
			);
			void runUploadQueue(opSubsidiaryId, opDocumentId);
		},
		[subsidiaryId, documentId, setQueue, runUploadQueue],
	);

	const retryAllFailedUploads = useCallback(() => {
		if (subsidiaryId === null || documentId === null) return;
		const opSubsidiaryId = subsidiaryId;
		const opDocumentId = documentId;
		const hasFailed = queueRef.current.some((item) => item.status === 'error');
		if (!hasFailed) return;

		setQueue((previous) =>
			previous.map((item) =>
				item.status === 'error' ? { ...item, status: 'pending', errorMessage: null } : item,
			),
		);
		void runUploadQueue(opSubsidiaryId, opDocumentId);
	}, [subsidiaryId, documentId, setQueue, runUploadQueue]);

	const dismissUpload = useCallback(
		(localId: string) => {
			setQueue((previous) => previous.filter((item) => item.localId !== localId));
		},
		[setQueue],
	);

	const removeAttachment = useCallback(
		async (attachment: IPurchaseDocumentAttachment) => {
			if (subsidiaryId === null || documentId === null || !canDelete) return;
			const generation = generationRef.current;

			setDeletingId(attachment.id);
			setListError(null);
			try {
				await deletePurchaseDocumentAttachment(subsidiaryId, documentId, attachment.id, {
					idempotencyKey: createIdempotencyKey(),
				});
				if (generationRef.current !== generation) return;
				refetch();
				onChanged();
			} catch (error) {
				if (generationRef.current !== generation) return;
				const resolved = resolveProcurementError(error, 'No se pudo eliminar el adjunto.');
				// 404: ya lo borró un intento cuya respuesta se perdió, u otra
				// persona. Se reconcilia igual que tras borrarlo.
				if (resolved.status === NOT_FOUND_STATUS) {
					toast.info('El adjunto ya se había eliminado.');
					refetch();
					onChanged();
					return;
				}
				toast.error(resolved.message);
			} finally {
				if (generationRef.current === generation) setDeletingId(null);
			}
		},
		[subsidiaryId, documentId, canDelete, refetch, onChanged],
	);

	const downloadAttachment = useCallback(
		async (attachment: IPurchaseDocumentAttachment) => {
			if (subsidiaryId === null || documentId === null) return;
			const generation = generationRef.current;

			setDownloadingId(attachment.id);
			try {
				const { blob } = await downloadPurchaseDocumentAttachment(
					subsidiaryId,
					documentId,
					attachment.id,
				);
				// La descarga no depende del contexto visible; sólo el toast de error
				// se descarta tras un cambio. El nombre sale de la fila porque el
				// navegador puede no leer `Content-Disposition`.
				triggerBrowserDownload(blob, attachment.file_name);
			} catch (error) {
				if (generationRef.current === generation) {
					toast.error(
						resolveProcurementError(error, 'No se pudo descargar el adjunto.').message,
					);
				}
			} finally {
				if (generationRef.current === generation) setDownloadingId(null);
			}
		},
		[subsidiaryId, documentId],
	);

	return {
		attachments,
		meta,
		page,
		onPageChange: setPage,
		loading,
		listError,
		uploadError: validationError,
		clearUploadError: () => setValidationError(null),
		uploadQueue,
		isUploading,
		deletingId,
		downloadingId,
		remainingQuota,
		isQuotaReached,
		addFiles,
		retryUpload,
		retryAllFailedUploads,
		dismissUpload,
		removeAttachment,
		downloadAttachment,
	};
};

export default useDocumentAttachments;
