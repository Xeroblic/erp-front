import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import type {
	DeferredPaymentMethod,
	IDeferredPaymentAbono,
	IDeferredPaymentAttachment,
} from '@/interface/deferredPayments.interface';
import { formatFileSize } from '@/utils/format.utils';
import { formatDeferredPaymentAmount, formatDeferredPaymentDate } from '../../utils';

const PAYMENT_METHOD_LABELS: Record<DeferredPaymentMethod, string> = {
	transfer: 'Transferencia',
	deposit: 'Depósito',
	check: 'Cheque',
	cash: 'Efectivo',
	other: 'Otro',
};

const AttachmentLink: React.FC<{ attachment: IDeferredPaymentAttachment }> = ({ attachment }) => (
	<a
		href={attachment.url}
		target='_blank'
		rel='noreferrer'
		className='flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-800'>
		<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800'>
			<Icon icon='HeroPaperClip' className='text-zinc-600 dark:text-zinc-300' />
		</span>
		<span className='min-w-0 grow'>
			<span className='block truncate text-sm font-semibold' title={attachment.file_name}>
				{attachment.file_name}
			</span>
			<span className='block text-xs text-zinc-500'>{formatFileSize(attachment.size)}</span>
		</span>
		<Icon icon='HeroArrowDownTray' className='shrink-0 text-zinc-500' />
	</a>
);

export const DeferredPaymentPaymentsSection: React.FC<{
	payments: IDeferredPaymentAbono[];
}> = ({ payments }) => (
	<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
		<CardBody className='space-y-4 p-5'>
			<div>
				<p className='font-semibold'>Abonos registrados</p>
				<p className='text-sm text-zinc-500'>
					Pagos que han reducido el saldo del documento.
				</p>
			</div>
			{payments.map((payment) => (
				<div
					key={payment.id}
					className='space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950'>
					<div className='flex flex-wrap items-start justify-between gap-3'>
						<div>
							<p className='text-xl font-bold text-emerald-700 dark:text-emerald-400'>
								{formatDeferredPaymentAmount(payment.amount)}
							</p>
							<p className='text-sm text-zinc-500'>
								{PAYMENT_METHOD_LABELS[payment.method]}
							</p>
						</div>
						<p className='rounded-full bg-zinc-200 px-3 py-1 text-sm font-semibold dark:bg-zinc-800'>
							{formatDeferredPaymentDate(payment.paid_at)}
						</p>
					</div>
					{payment.notes ? (
						<p className='text-sm text-zinc-600 dark:text-zinc-300'>
							<span className='font-semibold text-zinc-700 dark:text-zinc-200'>
								Nota:{' '}
							</span>
							{payment.notes}
						</p>
					) : (
						<p className='text-sm text-zinc-500'>Sin nota</p>
					)}
					{payment.attachments.length > 0 && (
						<div className='grid gap-2'>
							{payment.attachments.map((attachment) => (
								<AttachmentLink key={attachment.id} attachment={attachment} />
							))}
						</div>
					)}
				</div>
			))}
			{payments.length === 0 && (
				<p className='rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700'>
					Aún no se han registrado abonos.
				</p>
			)}
		</CardBody>
	</Card>
);

export const DeferredPaymentAttachmentsSection: React.FC<{
	attachments: IDeferredPaymentAttachment[];
}> = ({ attachments }) => (
	<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
		<CardBody className='space-y-4 p-5'>
			<div>
				<p className='font-semibold'>Adjuntos del documento</p>
				<p className='text-sm text-zinc-500'>Archivos asociados a la cuenta por cobrar.</p>
			</div>
			<div className='grid gap-2'>
				{attachments.map((attachment) => (
					<AttachmentLink key={attachment.id} attachment={attachment} />
				))}
			</div>
			{attachments.length === 0 && (
				<p className='text-sm text-zinc-500'>No hay archivos adjuntos.</p>
			)}
		</CardBody>
	</Card>
);
