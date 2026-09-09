import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import ProtectedButton from '@/components/ui/ProtectedButton';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import { formatDate, formatFileSize } from '@/utils/format.utils';
import {
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT,
	PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES,
} from '@/interface/procurement.interface';
import type {
	IPurchaseDocumentAttachment,
	TPurchaseDocumentAttachmentMimeType,
	TPurchaseDocumentStatus,
} from '@/interface/procurement.interface';
import useDocumentAttachments from '../../hooks/useDocumentAttachments';
import type { IPendingAttachmentUpload } from '../../hooks/useDocumentAttachments';

/**
 * Adjuntos privados del documento de compra (subsección de la sección 6):
 * zona de subida con límites visibles, lista, descarga autenticada y baja.
 * **Sin URL pública en ningún punto** — ni esta tarjeta ni el hook que la
 * alimenta construyen ni guardan una, la descarga siempre pasa por
 * `downloadAttachment`.
 *
 * Reglas de estado (sección 6): se sube en `draft`/`confirmed`, nunca en
 * `cancelled`; se elimina sólo en `draft`. Los adjuntos no son requisito para
 * confirmar, así que esta tarjeta nunca bloquea `AllowedActionsToolbar`.
 */

export interface IDocumentAttachmentsCardHandle {
	/** Abre el selector de archivos. Usado por el botón «Adjuntar» de la botonera. */
	openFilePicker: () => void;
}

interface IDocumentAttachmentsCardProps {
	documentId: number;
	documentStatus: TPurchaseDocumentStatus;
	subsidiaryId: number | null;
	branchId: number | null;
	/** Se llama tras subir/eliminar, para que el padre recargue el documento. */
	onChanged: () => void;
}

const MAX_SIZE_MB = PURCHASE_DOCUMENT_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024);

const MIME_TYPE_LABELS: Record<TPurchaseDocumentAttachmentMimeType, string> = {
	'application/pdf': 'PDF',
	'image/jpeg': 'JPG',
	'image/png': 'PNG',
};

interface IAttachmentRowProps {
	attachment: IPurchaseDocumentAttachment;
	canDelete: boolean;
	branchId: number | null;
	subsidiaryId: number | null;
	isDownloading: boolean;
	isDeleting: boolean;
	disabled: boolean;
	onDownload: () => void;
	onDelete: () => void;
}

const AttachmentRow: React.FC<IAttachmentRowProps> = ({
	attachment,
	canDelete,
	branchId,
	subsidiaryId,
	isDownloading,
	isDeleting,
	disabled,
	onDownload,
	onDelete,
}) => (
	<div className='flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700'>
		<Icon icon='HeroPaperClip' className='text-zinc-500' />
		<div className='min-w-0 grow'>
			<p className='truncate text-sm font-semibold' title={attachment.file_name}>
				{attachment.file_name}
			</p>
			<p className='text-xs text-zinc-500'>
				{MIME_TYPE_LABELS[attachment.mime_type] ?? attachment.mime_type} ·{' '}
				{formatFileSize(attachment.size)} · {formatDate(attachment.created_at)}
			</p>
		</div>
		<Button
			type='button'
			variant='outline'
			size='sm'
			icon='HeroArrowDownTray'
			aria-label={`Descargar ${attachment.file_name}`}
			isLoading={isDownloading}
			isDisable={disabled}
			onClick={onDownload}>
			Descargar
		</Button>
		{canDelete && (
			<ProtectedButton
				permission='edit-purchase-document'
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				scope='access'
				type='button'
				variant='outline'
				color='red'
				size='sm'
				icon='HeroTrash'
				aria-label={`Eliminar ${attachment.file_name}`}
				isLoading={isDeleting}
				isDisable={disabled}
				onClick={onDelete}
			/>
		)}
	</div>
);

interface IPendingUploadRowProps {
	item: IPendingAttachmentUpload;
	onRetry: () => void;
	onDismiss: () => void;
}

/**
 * Una fila por archivo en curso o fallido — nunca uno agregado en un solo
 * mensaje de tanda: cada archivo conserva su propio estado y su propia
 * `Idempotency-Key`, así que reintentar uno no reintenta los demás.
 */
const PendingUploadRow: React.FC<IPendingUploadRowProps> = ({ item, onRetry, onDismiss }) => (
	<div className='flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600'>
		<Icon
			icon={item.status === 'error' ? 'HeroExclamationTriangle' : 'HeroArrowUpTray'}
			className={item.status === 'error' ? 'text-red-500' : 'text-zinc-500'}
		/>
		<div className='min-w-0 grow'>
			<p className='truncate text-sm font-semibold' title={item.file.name}>
				{item.file.name}
			</p>
			<p className='text-xs text-zinc-500'>
				{item.status === 'uploading' && 'Subiendo…'}
				{item.status === 'pending' && 'En espera…'}
				{item.status === 'error' && (item.errorMessage ?? 'No se pudo subir.')}
			</p>
		</div>
		{item.status === 'error' && (
			<>
				<Button type='button' variant='outline' size='sm' onClick={onRetry}>
					Reintentar
				</Button>
				<Button type='button' variant='outline' color='red' size='sm' onClick={onDismiss}>
					Descartar
				</Button>
			</>
		)}
	</div>
);

const DocumentAttachmentsCard = forwardRef<
	IDocumentAttachmentsCardHandle,
	IDocumentAttachmentsCardProps
>(({ documentId, documentStatus, subsidiaryId, branchId, onChanged }, ref) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	// Sección 6: «se puede subir en draft y en confirmed, nunca en cancelled;
	// eliminar sólo en draft».
	const canUpload = documentStatus !== 'cancelled';
	const canDelete = documentStatus === 'draft';

	const {
		attachments,
		meta,
		page,
		onPageChange,
		loading,
		listError,
		uploadError,
		clearUploadError,
		uploadQueue,
		isUploading,
		deletingId,
		downloadingId,
		isQuotaReached,
		addFiles,
		retryUpload,
		retryAllFailedUploads,
		dismissUpload,
		removeAttachment,
		downloadAttachment,
	} = useDocumentAttachments({ subsidiaryId, documentId, canUpload, canDelete, onChanged });

	const failedUploadsCount = uploadQueue.filter((item) => item.status === 'error').length;

	useImperativeHandle(ref, () => ({
		openFilePicker: () => fileInputRef.current?.click(),
	}));

	const pagination: PaginationState = {
		pageIndex: Math.max(0, page - 1),
		pageSize: meta?.per_page ?? PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: () => undefined,
		setPageIndex: (updater: Updater<number>) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onPageChange(Math.max(1, pageIndex + 1));
		},
		getCanPreviousPage: () => page > 1,
		previousPage: () => onPageChange(Math.max(1, page - 1)),
		getPageCount: () => meta?.last_page ?? 1,
		getCanNextPage: () => Boolean(meta && page < meta.last_page),
		nextPage: () => onPageChange(page + 1),
	};

	const uploadDisabled = !canUpload || isUploading || isQuotaReached;
	const rowActionsDisabled = isUploading || deletingId !== null || downloadingId !== null;

	return (
		<Card>
			<CardHeader>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<CardTitle className='text-lg'>Adjuntos</CardTitle>
					{meta && (
						<span className='text-sm text-zinc-500'>
							{meta.total} de {PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT}
						</span>
					)}
				</div>
			</CardHeader>
			<CardBody className='space-y-3'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>
						PDF, JPG o PNG. Máximo {MAX_SIZE_MB} MB por archivo y{' '}
						{PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT} archivos por documento. No son
						requisito para confirmar el documento.
						{!canUpload && ' El documento anulado no admite adjuntos.'}
						{canUpload &&
							isQuotaReached &&
							' Ya se alcanzó el máximo de archivos para este documento.'}
					</p>
					{canUpload && (
						<ProtectedButton
							permission='edit-purchase-document'
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							scope='access'
							type='button'
							variant='outline'
							icon='HeroArrowUpTray'
							isDisable={uploadDisabled}
							isLoading={isUploading}
							onClick={() => fileInputRef.current?.click()}>
							Adjuntar archivo
						</ProtectedButton>
					)}
					<Input
						ref={fileInputRef}
						name='purchase-document-attachments'
						aria-label='Seleccionar archivos adjuntos'
						type='file'
						multiple
						accept='.pdf,.jpg,.jpeg,.png'
						className='hidden'
						disabled={uploadDisabled}
						onChange={(event) => {
							void addFiles(event.currentTarget.files);
							event.currentTarget.value = '';
						}}
					/>
				</div>

				{uploadError && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{uploadError}</span>
							<Button
								type='button'
								size='sm'
								variant='outline'
								onClick={clearUploadError}>
								Cerrar
							</Button>
						</div>
					</Alert>
				)}

				{uploadQueue.length > 0 && (
					<div className='space-y-2'>
						{failedUploadsCount > 1 && (
							<div className='flex justify-end'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={retryAllFailedUploads}>
									Reintentar todos ({failedUploadsCount})
								</Button>
							</div>
						)}
						{uploadQueue.map((item) => (
							<PendingUploadRow
								key={item.localId}
								item={item}
								onRetry={() => retryUpload(item.localId)}
								onDismiss={() => dismissUpload(item.localId)}
							/>
						))}
					</div>
				)}

				{loading && (
					<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
				)}

				{!loading && listError && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						{listError}
					</Alert>
				)}

				{!loading &&
					!listError &&
					attachments.map((attachment) => (
						<AttachmentRow
							key={attachment.id}
							attachment={attachment}
							canDelete={canDelete}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							isDownloading={downloadingId === attachment.id}
							isDeleting={deletingId === attachment.id}
							disabled={
								rowActionsDisabled &&
								downloadingId !== attachment.id &&
								deletingId !== attachment.id
							}
							onDownload={() => downloadAttachment(attachment)}
							onDelete={() => removeAttachment(attachment)}
						/>
					))}

				{!loading && !listError && attachments.length === 0 && (
					<p className='rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700'>
						Sin adjuntos todavía.
					</p>
				)}
			</CardBody>
			{meta && !listError && meta.total > 0 && (
				<TableCardFooterTemplateV2 table={table} isDisabled={loading} />
			)}
		</Card>
	);
});

DocumentAttachmentsCard.displayName = 'DocumentAttachmentsCard';

export default DocumentAttachmentsCard;
