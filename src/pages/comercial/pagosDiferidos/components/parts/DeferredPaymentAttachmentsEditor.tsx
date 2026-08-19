import React, { useRef } from 'react';
import Checkbox from '@/components/form/Checkbox';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Input from '@/components/form/Input';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import type { IDeferredPaymentAttachment } from '@/interface/deferredPayments.interface';
import { formatFileSize } from '@/utils/format.utils';
import type { PendingDeferredPaymentAttachment } from '../../hooks/useDeferredPaymentAttachments';

interface Props {
	attachments: IDeferredPaymentAttachment[];
	pending: PendingDeferredPaymentAttachment[];
	error: string | null;
	isUploading: boolean;
	busyAttachmentId: number | null;
	branchId: number | null;
	subsidiaryId: number | null;
	disabled?: boolean;
	/** Muestra ayuda estable sobre adjuntar archivos. No habilita el drop. */
	showDragAndDropHint?: boolean;
	onAddFiles: (files: FileList | null) => void;
	onRemovePending: (id: string) => void;
	onSetPendingSharing: (id: string, value: boolean) => void;
	onDelete: (id: number) => void;
	onUpdateSharing: (attachment: IDeferredPaymentAttachment, value: boolean) => void;
	onRetry?: () => void;
	onDiscard?: () => void;
}

const AttachmentRow: React.FC<{
	attachment: IDeferredPaymentAttachment;
	busy: boolean;
	disabled: boolean;
	branchId: number | null;
	subsidiaryId: number | null;
	onDelete: () => void;
	onUpdateSharing: (value: boolean) => void;
}> = ({ attachment, busy, disabled, branchId, subsidiaryId, onDelete, onUpdateSharing }) => (
	<div className='flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700'>
		<Icon icon='HeroPaperClip' className='text-zinc-500' />
		<div className='min-w-0 grow'>
			<p className='truncate text-sm font-semibold' title={attachment.file_name}>
				{attachment.file_name}
			</p>
			<p className='text-xs text-zinc-500'>
				{formatFileSize(attachment.size)} ·{' '}
				{attachment.share_with_customer ? 'Se envía al cliente' : 'Uso interno'}
			</p>
		</div>
		<PermissionGuard
			permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
			branchId={branchId}
			subsidiaryId={subsidiaryId}
			scope='access'>
			<Checkbox
				id={`share-attachment-${attachment.id}`}
				variant='switch'
				dimension='sm'
				checked={attachment.share_with_customer}
				disabled={busy || disabled}
				label='Compartir con el cliente'
				onChange={(event) => onUpdateSharing(event.target.checked)}
			/>
		</PermissionGuard>
		<ProtectedButton
			permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
			branchId={branchId}
			subsidiaryId={subsidiaryId}
			scope='access'
			type='button'
			variant='outline'
			color='red'
			size='sm'
			icon='HeroTrash'
			aria-label={`Eliminar ${attachment.file_name}`}
			isLoading={busy}
			isDisable={busy || disabled}
			onClick={onDelete}
		/>
	</div>
);

const DeferredPaymentAttachmentsEditor: React.FC<Props> = (props) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<p className='font-semibold'>Adjuntos del documento</p>
					<p className='text-sm text-zinc-500'>
						PDF, imágenes o planillas de hasta 10 MB.
						{props.showDragAndDropHint
							? ' Puedes adjuntarlos desde el botón o arrastrarlos al formulario cuando esté disponible.'
							: ''}{' '}
						Los comprobantes de abono no se administran aquí.
					</p>
				</div>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
					branchId={props.branchId}
					subsidiaryId={props.subsidiaryId}
					scope='access'
					type='button'
					variant='outline'
					icon='HeroPlus'
					isDisable={
						props.disabled || props.isUploading || props.busyAttachmentId !== null
					}
					onClick={() => fileInputRef.current?.click()}>
					Agregar archivos
				</ProtectedButton>
				<Input
					ref={fileInputRef}
					name='deferred-payment-attachments'
					aria-label='Seleccionar archivos adjuntos'
					type='file'
					multiple
					accept='.pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx'
					className='hidden'
					disabled={
						props.disabled || props.isUploading || props.busyAttachmentId !== null
					}
					onChange={(event) => {
						props.onAddFiles(event.currentTarget.files);
						event.currentTarget.value = '';
					}}
				/>
			</div>
			{props.error && (
				<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
					<div className='flex flex-wrap items-center gap-3'>
						<span>{props.error}</span>
						{props.onRetry && (
							<Button
								type='button'
								color='red'
								variant='outline'
								isLoading={props.isUploading}
								onClick={props.onRetry}>
								Reintentar carga
							</Button>
						)}
						{props.onDiscard && (
							<Button type='button' variant='outline' onClick={props.onDiscard}>
								Descartar archivos pendientes y cerrar
							</Button>
						)}
					</div>
				</Alert>
			)}
			{props.pending.map((item) => (
				<div
					key={item.id}
					className='flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700'>
					<Icon icon='HeroArrowUpTray' className='text-blue-500' />
					<div className='min-w-0 grow'>
						<p className='truncate text-sm font-semibold'>{item.file.name}</p>
						<p className='text-xs text-zinc-500'>
							Pendiente de carga · {formatFileSize(item.file.size)}
						</p>
					</div>
					<Checkbox
						id={`pending-share-${item.id}`}
						variant='switch'
						dimension='sm'
						checked={item.shareWithCustomer}
						disabled={
							props.disabled || props.isUploading || props.busyAttachmentId !== null
						}
						label='Compartir con el cliente'
						onChange={(event) =>
							props.onSetPendingSharing(item.id, event.target.checked)
						}
					/>
					<Button
						type='button'
						variant='outline'
						color='red'
						size='sm'
						icon='HeroTrash'
						aria-label={`Quitar ${item.file.name}`}
						isDisable={
							props.disabled || props.isUploading || props.busyAttachmentId !== null
						}
						onClick={() => props.onRemovePending(item.id)}
					/>
				</div>
			))}
			{props.attachments.map((attachment) => (
				<AttachmentRow
					key={attachment.id}
					attachment={attachment}
					busy={props.isUploading || props.busyAttachmentId !== null}
					disabled={props.disabled === true}
					branchId={props.branchId}
					subsidiaryId={props.subsidiaryId}
					onDelete={() => props.onDelete(attachment.id)}
					onUpdateSharing={(value) => props.onUpdateSharing(attachment, value)}
				/>
			))}
			{props.attachments.length === 0 && props.pending.length === 0 && (
				<p className='rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700'>
					Aún no hay adjuntos para este documento.
				</p>
			)}
		</div>
	);
};

export default DeferredPaymentAttachmentsEditor;
