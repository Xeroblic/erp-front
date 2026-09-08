import { useCallback, useEffect, useState } from 'react';
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
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [downloadingId, setDownloadingId] = useState<number | null>(null);
	// Incrementarlo fuerza el efecto de carga aunque `page` no cambie: sin
	// esto, subir un archivo estando ya en la página 1 dejaba `setPage(1)`
	// como no-op — React descarta un `setState` con el mismo valor — y la
	// lista nunca se refrescaba con el adjunto recién subido.
	const [reloadToken, setReloadToken] = useState(0);

	// Documento nuevo: ni la página ni el error del anterior tienen sentido acá.
	useEffect(() => {
		setPage(1);
		setAttachments([]);
		setMeta(null);
		setListError(null);
		setUploadError(null);
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
	const remainingQuota = Math.max(0, PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT - totalCount);
	const isQuotaReached = remainingQuota === 0;

	const addFiles = useCallback(
		async (fileList: FileList | null) => {
			if (!fileList || fileList.length === 0) return;
			if (subsidiaryId === null || documentId === null || !canUpload) return;

			const files = Array.from(fileList);
			const rejected = files
				.map((file) => getClientFileError(file))
				.filter((message): message is string => message !== null);
			const accepted = files.filter((file) => getClientFileError(file) === null);

			const overQuota = accepted.slice(remainingQuota);
			const toUpload = accepted.slice(0, remainingQuota);
			const messages = [...rejected];
			if (overQuota.length > 0) {
				messages.push(
					`No hay cupo para ${overQuota.length} archivo(s) más: el documento admite hasta ${PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT} adjuntos.`,
				);
			}
			setUploadError(messages.length > 0 ? messages.join(' ') : null);
			if (toUpload.length === 0) return;

			setIsUploading(true);
			try {
				// Secuencial a propósito: cada subida valida el cupo vigente contra
				// el store mock, que un `Promise.all` en paralelo podría leer
				// desactualizado entre dos archivos de la misma tanda. `reduce`
				// encadena las promesas sin `for`/`for-of` (restringidos en esta
				// guía de estilo) ni perder el orden de subida.
				await toUpload.reduce(
					(previous, file) =>
						previous.then(() =>
							uploadPurchaseDocumentAttachment(subsidiaryId, documentId, file, {
								idempotencyKey: createIdempotencyKey(),
							}).then(() => undefined),
						),
					Promise.resolve(),
				);
			} catch (error) {
				setUploadError(
					resolveProcurementError(error, 'No se pudo subir el adjunto.').message,
				);
			} finally {
				// Corre también si la tanda falló a mitad de camino: los archivos
				// anteriores al que falló ya se subieron de verdad en el store mock,
				// así que la lista y el conteo del documento se refrescan aunque la
				// tanda completa no haya terminado en éxito — dejarlos sin refrescar
				// escondería adjuntos que sí existen.
				refetch();
				onChanged();
				setIsUploading(false);
			}
		},
		[subsidiaryId, documentId, canUpload, remainingQuota, refetch, onChanged],
	);

	const removeAttachment = useCallback(
		async (attachment: IPurchaseDocumentAttachment) => {
			if (subsidiaryId === null || documentId === null || !canDelete) return;

			setDeletingId(attachment.id);
			setListError(null);
			try {
				await deletePurchaseDocumentAttachment(subsidiaryId, documentId, attachment.id, {
					idempotencyKey: createIdempotencyKey(),
				});
				refetch();
				onChanged();
			} catch (error) {
				toast.error(
					resolveProcurementError(error, 'No se pudo eliminar el adjunto.').message,
				);
			} finally {
				setDeletingId(null);
			}
		},
		[subsidiaryId, documentId, canDelete, refetch, onChanged],
	);

	const downloadAttachment = useCallback(
		async (attachment: IPurchaseDocumentAttachment) => {
			if (subsidiaryId === null || documentId === null) return;

			setDownloadingId(attachment.id);
			try {
				const { blob, fileName } = await downloadPurchaseDocumentAttachment(
					subsidiaryId,
					documentId,
					attachment.id,
				);
				triggerBrowserDownload(blob, fileName);
			} catch (error) {
				toast.error(
					resolveProcurementError(error, 'No se pudo descargar el adjunto.').message,
				);
			} finally {
				setDownloadingId(null);
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
		uploadError,
		clearUploadError: () => setUploadError(null),
		isUploading,
		deletingId,
		downloadingId,
		remainingQuota,
		isQuotaReached,
		addFiles,
		removeAttachment,
		downloadAttachment,
	};
};

export default useDocumentAttachments;
