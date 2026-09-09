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
 * Adjuntos privados del detalle de documento de compra (subsección de la
 * sección 6). A diferencia de `useRelatedDocumentList` (recepciones y
 * asignaciones, siempre vacías en este mock) éste sí muta: sube, descarga y
 * elimina. Estado local del componente, no del store global — el mismo
 * criterio que `useDeferredPaymentAttachments` en pagos diferidos: los
 * adjuntos sólo importan mientras esta ficha está abierta.
 *
 * Cada subida/baja exitosa cambia `related_counts.attachments` **del
 * documento**, que vive en `purchaseDocumentsSlice`, no acá — por eso
 * `onChanged` avisa al padre para que recargue el documento completo en vez
 * de que este hook intente sincronizar dos stores a mano.
 *
 * **Propiedad de contexto (ZF-12):** el router reutiliza esta misma instancia
 * del hook al navegar de un documento a otro. Una subida que sigue en curso
 * cuando el usuario ya cambió de documento no puede refrescar ni avisar al
 * padre con el contexto viejo — eso reabriría/recargaría el documento
 * abandonado en vez del que se está mirando ahora. `generationRef` marca de
 * qué contexto (`subsidiaryId` + `documentId`) es cada operación en curso;
 * cualquier callback que resuelva después de un cambio de contexto se
 * descarta en silencio.
 */

const PER_PAGE = PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT;

const ALLOWED_MIME_TYPES: readonly string[] = PURCHASE_DOCUMENT_ATTACHMENT_ALLOWED_MIME_TYPES;

/**
 * Los límites se muestran **antes** de intentar subir (criterio de
 * aceptación de la card): un archivo de tipo o tamaño inválido se rechaza
 * acá, en español, sin llegar a golpear el servicio mock.
 */
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
 * Un archivo aceptado por la validación de cliente, camino al servicio.
 * `idempotencyKey` se genera **una sola vez** por archivo, al aceptarlo — un
 * reintento reenvía la misma clave con el mismo archivo, nunca una nueva:
 * regenerarla en cada intento le quita a la `Idempotency-Key` su propósito
 * (ante un timeout con resultado incierto, reintentar con clave nueva puede
 * duplicar la subida en el backend real que este mock simula).
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
	/** `true` en `draft`/`confirmed`. En `cancelled` no se ofrece subir. */
	canUpload: boolean;
	/** `true` sólo en `draft`. */
	canDelete: boolean;
	/** Avisa al padre tras una escritura exitosa, para recargar el documento. */
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
	/** Rechazos de la validación de cliente (tipo/tamaño/cupo), previos a tocar el servicio. */
	const [validationError, setValidationError] = useState<string | null>(null);
	const [uploadQueue, setUploadQueue] = useState<IPendingAttachmentUpload[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [downloadingId, setDownloadingId] = useState<number | null>(null);
	// Incrementarlo fuerza el efecto de carga aunque `page` no cambie: sin
	// esto, subir un archivo estando ya en la página 1 dejaba `setPage(1)`
	// como no-op — React descarta un `setState` con el mismo valor — y la
	// lista nunca se refrescaba con el adjunto recién subido.
	const [reloadToken, setReloadToken] = useState(0);

	// Espejo síncrono de `uploadQueue`: el bucle de subida necesita leer el
	// siguiente pendiente apenas se agrega uno nuevo, sin esperar al próximo
	// render — un `useState` closured se quedaría con la foto de cuando se
	// creó el bucle.
	const queueRef = useRef<IPendingAttachmentUpload[]>([]);
	const setQueue = useCallback(
		(updater: (previous: IPendingAttachmentUpload[]) => IPendingAttachmentUpload[]) => {
			queueRef.current = updater(queueRef.current);
			setUploadQueue(queueRef.current);
		},
		[],
	);

	// Generación del contexto actual (`subsidiaryId` + `documentId`). Cada
	// operación en curso captura la suya al iniciar; si no coincide con ésta
	// al terminar, el documento mostrado ya cambió y la operación se descarta
	// sin tocar estado ni avisar al padre.
	const generationRef = useRef(0);

	// Guarda de reentrancia del bucle de subida. Deliberadamente un ref, no el
	// estado `isUploading`: dos llamadas a `addFiles`/`retryUpload` separadas
	// por un solo tick (sin que React haya vuelto a renderizar entre medio)
	// leerían el mismo `isUploading` cerrado en `false`, dejando correr dos
	// bucles a la vez sobre la misma cola.
	const isProcessingRef = useRef(false);

	// Documento nuevo: ni la página, ni el error del anterior, ni su cola de
	// subidas en curso tienen sentido acá.
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
		// `reloadToken` no participa de la petición: sólo fuerza esta re-ejecución.
	}, [subsidiaryId, documentId, page, reloadToken]);

	const refetch = useCallback(() => {
		setPage(1);
		setReloadToken((token) => token + 1);
	}, []);

	const totalCount = meta?.total ?? attachments.length;
	// Los archivos ya en cola (pendientes o subiendo) también consumen cupo:
	// sin restarlos, dos tandas seguidas antes de que la primera termine
	// podrían aceptar juntas más de los 10 archivos permitidos.
	const queuedCount = uploadQueue.filter((item) => item.status !== 'error').length;
	const remainingQuota = Math.max(
		0,
		PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT - totalCount - queuedCount,
	);
	const isQuotaReached = remainingQuota === 0;

	/**
	 * Procesa los pendientes de la cola, uno por uno y en orden — igual que
	 * antes, para no leer el cupo del store mock desactualizado entre dos
	 * archivos de la misma tanda. A diferencia de la versión anterior, un
	 * archivo que falla ya **no aborta el resto de la tanda**: queda marcado
	 * `error` (con su mismo archivo y clave, listo para reintentar) y el
	 * bucle sigue con el siguiente pendiente.
	 */
	const runUploadQueue = useCallback(
		async (opSubsidiaryId: number, opDocumentId: number) => {
			const generation = generationRef.current;
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;
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
				isProcessingRef.current = false;
				setIsUploading(false);
			}

			// Corre también si algún archivo de la tanda falló: los anteriores
			// que sí se subieron ya están de verdad en el store mock, así que la
			// lista y el conteo del documento se refrescan igual — dejarlos sin
			// refrescar escondería adjuntos que sí existen.
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

	/**
	 * Reintenta un archivo que quedó en `error`, con el **mismo** archivo y la
	 * **misma** `Idempotency-Key` que su intento original — nunca una clave
	 * nueva: si el primer intento sí llegó a escribir en el backend real (el
	 * cliente sólo vio el timeout, no la respuesta), la misma clave hace que
	 * el reintento devuelva ese mismo resultado en vez de duplicar el adjunto.
	 */
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

	/** Descarta un archivo fallido de la cola sin reintentarlo. */
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
				toast.error(
					resolveProcurementError(error, 'No se pudo eliminar el adjunto.').message,
				);
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
				const { blob, fileName } = await downloadPurchaseDocumentAttachment(
					subsidiaryId,
					documentId,
					attachment.id,
				);
				// La descarga en sí no depende del contexto que sigue visible —
				// dispararla igual no corrompe nada — pero el toast de error sí
				// hablaría de un documento que el usuario ya no está mirando.
				triggerBrowserDownload(blob, fileName);
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
