import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
	IDeferredPaymentAttachment,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xls', 'xlsx']);

export interface PendingDeferredPaymentAttachment {
	id: string;
	file: File;
	shareWithCustomer: boolean;
}

const getFileError = (file: File): string | null => {
	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	if (!ALLOWED_EXTENSIONS.has(extension))
		return 'El archivo debe ser PDF, JPG, JPEG, PNG, WEBP, XLS o XLSX.';
	if (file.size > MAX_FILE_SIZE) return 'Cada archivo puede pesar como máximo 10 MB.';
	return null;
};

export const useDeferredPaymentAttachments = ({
	isOpen,
	subsidiaryId,
	document,
}: {
	isOpen: boolean;
	subsidiaryId: number | null;
	document: IDeferredPaymentDocument | null;
}) => {
	const [attachments, setAttachments] = useState<IDeferredPaymentAttachment[]>(
		document?.attachments ?? [],
	);
	const [pending, setPending] = useState<PendingDeferredPaymentAttachment[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [busyAttachmentId, setBusyAttachmentId] = useState<number | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const contextRef = useRef({ subsidiaryId, documentId: document?.id ?? null, isOpen });
	contextRef.current = { subsidiaryId, documentId: document?.id ?? null, isOpen };
	const requestIdRef = useRef(0);
	const controllersRef = useRef<AbortController[]>([]);
	const operationInFlightRef = useRef(false);
	const isCurrentRequest = useCallback(
		(
			requestId: number,
			requestSubsidiaryId: number,
			requestDocumentId: number,
			allowUnboundDocument = false,
		) =>
			requestId === requestIdRef.current &&
			contextRef.current.isOpen &&
			contextRef.current.subsidiaryId === requestSubsidiaryId &&
			(contextRef.current.documentId === requestDocumentId ||
				(allowUnboundDocument && contextRef.current.documentId === null)),
		[],
	);

	useEffect(() => {
		setAttachments(document?.attachments ?? []);
		setError(null);
	}, [document?.id]);
	useEffect(() => {
		requestIdRef.current += 1;
		controllersRef.current.forEach((controller) => controller.abort());
		controllersRef.current = [];
		operationInFlightRef.current = false;
		if (!isOpen || subsidiaryId === null || document === null) {
			setPending([]);
			setAttachments([]);
		}
		setError(null);
		setIsUploading(false);
		setBusyAttachmentId(null);
	}, [document?.id, isOpen, subsidiaryId]);

	const addFiles = useCallback((files: FileList | null) => {
		if (!files) return;
		const selected = Array.from(files);
		const invalid = selected
			.map(getFileError)
			.find((message): message is string => message !== null);
		if (invalid) {
			setError(invalid);
			return;
		}
		setError(null);
		setPending((current) => [
			...current,
			...selected.map((file) => ({
				id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
				file,
				shareWithCustomer: true,
			})),
		]);
	}, []);
	const removePending = useCallback(
		(id: string) => setPending((current) => current.filter((item) => item.id !== id)),
		[],
	);
	const setPendingSharing = useCallback(
		(id: string, shareWithCustomer: boolean) =>
			setPending((current) =>
				current.map((item) => (item.id === id ? { ...item, shareWithCustomer } : item)),
			),
		[],
	);

	const uploadPending = useCallback(
		async (savedDocument: IDeferredPaymentDocument): Promise<boolean> => {
			if (subsidiaryId === null || pending.length === 0) return true;
			if (operationInFlightRef.current) return false;
			const allowUnboundDocument = document === null;
			const requestId = requestIdRef.current + 1;
			const requestDocumentId = savedDocument.id;
			requestIdRef.current = requestId;
			operationInFlightRef.current = true;
			const remaining = [...pending];
			setIsUploading(true);
			setError(null);
			try {
				while (remaining.length > 0) {
					const item = remaining[0];
					const controller = new AbortController();
					controllersRef.current.push(controller);
					const attachment =
						await deferredPaymentsService.uploadDeferredPaymentDocumentAttachment(
							subsidiaryId,
							savedDocument.id,
							item.file,
							item.shareWithCustomer,
							controller.signal,
						);
					if (
						!isCurrentRequest(
							requestId,
							subsidiaryId,
							requestDocumentId,
							allowUnboundDocument,
						)
					)
						return false;
					setAttachments((current) => [...current, attachment]);
					remaining.shift();
					setPending([...remaining]);
				}
				return true;
			} catch (uploadError: unknown) {
				if (
					isCurrentRequest(
						requestId,
						subsidiaryId,
						requestDocumentId,
						allowUnboundDocument,
					)
				)
					setError(
						getDeferredPaymentErrorMessage(uploadError, 'No se pudo subir el adjunto'),
					);
				return false;
			} finally {
				if (
					isCurrentRequest(
						requestId,
						subsidiaryId,
						requestDocumentId,
						allowUnboundDocument,
					)
				)
					setIsUploading(false);
				if (requestId === requestIdRef.current) operationInFlightRef.current = false;
			}
		},
		[document, isCurrentRequest, pending, subsidiaryId],
	);

	const deleteAttachment = useCallback(
		async (attachmentId: number) => {
			if (subsidiaryId === null || document === null || operationInFlightRef.current)
				return false;
			const requestId = requestIdRef.current + 1;
			const requestDocumentId = document.id;
			requestIdRef.current = requestId;
			operationInFlightRef.current = true;
			const controller = new AbortController();
			controllersRef.current.push(controller);
			setBusyAttachmentId(attachmentId);
			setError(null);
			try {
				await deferredPaymentsService.deleteDeferredPaymentDocumentAttachment(
					subsidiaryId,
					document.id,
					attachmentId,
					controller.signal,
				);
				if (!isCurrentRequest(requestId, subsidiaryId, requestDocumentId)) return false;
				setAttachments((current) =>
					current.filter((attachment) => attachment.id !== attachmentId),
				);
				return true;
			} catch (deleteError: unknown) {
				if (!isCurrentRequest(requestId, subsidiaryId, requestDocumentId)) return false;
				setError(
					getDeferredPaymentErrorMessage(deleteError, 'No se pudo eliminar el adjunto'),
				);
				return false;
			} finally {
				if (isCurrentRequest(requestId, subsidiaryId, requestDocumentId))
					setBusyAttachmentId((current) => (current === attachmentId ? null : current));
				if (requestId === requestIdRef.current) operationInFlightRef.current = false;
			}
		},
		[document, isCurrentRequest, subsidiaryId],
	);

	const updateSharing = useCallback(
		async (attachment: IDeferredPaymentAttachment, shareWithCustomer: boolean) => {
			if (subsidiaryId === null || document === null || operationInFlightRef.current)
				return false;
			const requestId = requestIdRef.current + 1;
			const requestDocumentId = document.id;
			requestIdRef.current = requestId;
			operationInFlightRef.current = true;
			const controller = new AbortController();
			controllersRef.current.push(controller);
			setBusyAttachmentId(attachment.id);
			setError(null);
			try {
				const updated =
					await deferredPaymentsService.updateDeferredPaymentAttachmentSharing(
						subsidiaryId,
						document.id,
						attachment.id,
						shareWithCustomer,
						controller.signal,
					);
				if (!isCurrentRequest(requestId, subsidiaryId, requestDocumentId)) return false;
				setAttachments((current) =>
					current.map((item) => (item.id === updated.id ? updated : item)),
				);
				return true;
			} catch (sharingError: unknown) {
				if (!isCurrentRequest(requestId, subsidiaryId, requestDocumentId)) return false;
				setError(
					getDeferredPaymentErrorMessage(
						sharingError,
						'No se pudo actualizar la compartición del adjunto',
					),
				);
				return false;
			} finally {
				if (isCurrentRequest(requestId, subsidiaryId, requestDocumentId))
					setBusyAttachmentId((current) => (current === attachment.id ? null : current));
				if (requestId === requestIdRef.current) operationInFlightRef.current = false;
			}
		},
		[document, isCurrentRequest, subsidiaryId],
	);

	return useMemo(
		() => ({
			attachments,
			pending,
			error,
			isUploading,
			busyAttachmentId,
			addFiles,
			removePending,
			setPendingSharing,
			uploadPending,
			deleteAttachment,
			updateSharing,
		}),
		[
			addFiles,
			attachments,
			busyAttachmentId,
			deleteAttachment,
			error,
			isUploading,
			pending,
			removePending,
			setPendingSharing,
			updateSharing,
			uploadPending,
		],
	);
};
