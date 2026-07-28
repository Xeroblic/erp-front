import React from 'react';
import Avatar from '@/components/Avatar';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import OffCanvas, { OffCanvasBody, OffCanvasHeader } from '@/components/ui/OffCanvas';
import Progress from '@/components/ui/Progress';
import DeferredStatusPill from '../badges/DeferredStatusPill';
import DeferredPaymentItemsSection from '../detail/DeferredPaymentItemsSection';
import useDeferredPaymentDetail from '../../hooks/useDeferredPaymentDetail';
import {
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
	formatDeferredPaymentAmount,
	formatDeferredPaymentDate,
} from '../../utils';

interface DeferredPaymentDetailDrawerProps {
	documentId: number | null;
	onClose: () => void;
}

const DetailSkeleton = () => (
	<div className='animate-pulse space-y-4' aria-label='Cargando detalle del documento'>
		<div className='h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
		<div className='grid grid-cols-3 gap-3'>
			{[1, 2, 3].map((item) => (
				<div key={item} className='h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
			))}
		</div>
		<div className='h-36 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
	</div>
);

const AmountCard = ({
	label,
	value,
	className = '',
}: {
	label: string;
	value: string;
	className?: string;
}) => (
	<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
		<CardBody className='p-4 text-center'>
			<p className='text-sm text-zinc-500'>{label}</p>
			<p className={`mt-1 text-lg font-bold ${className}`}>{value}</p>
		</CardBody>
	</Card>
);

const DeferredPaymentDetailDrawer: React.FC<DeferredPaymentDetailDrawerProps> = ({
	documentId,
	onClose,
}) => {
	const { document, loading, error, actions, hasDataContext } =
		useDeferredPaymentDetail(documentId);
	const total = Number(document?.total_amount ?? 0);
	const paid = Number(document?.paid_amount ?? 0);
	const progress = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
	const progressLabel = `${Math.round(progress)}%`;

	return (
		<OffCanvas
			isOpen={documentId !== null}
			setIsOpen={onClose}
			dialogClassName='!max-w-2xl'
			contentClassName='!bg-white dark:!bg-zinc-900'>
			<OffCanvasHeader className='border-b border-zinc-200 px-6 pb-5 dark:border-zinc-800'>
				<div className='min-w-0'>
					<p className='truncate text-lg font-semibold'>
						{document?.document_number ?? 'Detalle del documento'}
					</p>
					<p className='truncate text-sm font-normal text-zinc-500'>
						{document?.customer.billing_company ?? `Documento ID #${documentId ?? ''}`}
					</p>
				</div>
			</OffCanvasHeader>
			<OffCanvasBody className='space-y-4 bg-white px-4 py-5 dark:bg-zinc-900 sm:px-6'>
				{!hasDataContext && (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroBuildingStorefront'
						title='No se pudo resolver la subsidiaria'>
						Seleccioná nuevamente el contexto comercial para consultar este documento.
					</Alert>
				)}
				{hasDataContext && loading && !document && <DetailSkeleton />}
				{hasDataContext && error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar el documento'>
						<div className='space-y-3'>
							<p>{error}</p>
							<Button size='sm' variant='outline' onClick={actions.refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				{hasDataContext && document && !error && (
					<>
						<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
							<CardBody className='space-y-5 p-5'>
								<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
									<div className='flex min-w-0 items-start gap-3'>
										<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white'>
											<Icon
												icon='HeroDocumentText'
												color='white'
												size='text-2xl'
											/>
										</div>
										<div className='min-w-0'>
											<p className='text-sm text-zinc-500'>Cliente</p>
											<p className='truncate text-lg font-semibold'>
												{document.customer.billing_company}
											</p>
											<p className='text-sm text-zinc-600 dark:text-zinc-300'>
												RUT {document.customer.rut}
											</p>
										</div>
									</div>
									<DeferredStatusPill status={document.status} />
								</div>
								<div className='grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700'>
									<div>
										<p className='text-zinc-500'>Tipo de documento</p>
										<p className='font-semibold'>
											{
												DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS[
													document.document_type
												]
											}
										</p>
									</div>
									<div>
										<p className='text-zinc-500'>Orden de compra</p>
										<p className='font-semibold'>
											{document.purchase_order ?? 'Sin OC'}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
						<Card className='border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
							<CardBody className='p-5 text-center'>
								<p className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
									Saldo pendiente
								</p>
								<p className='mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100'>
									{formatDeferredPaymentAmount(document.outstanding_amount)}
								</p>
								<p className='mt-1 text-sm text-blue-700 dark:text-blue-300'>
									Monto que todavía debe pagar el cliente
								</p>
							</CardBody>
						</Card>
						<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
							<AmountCard
								label='Total documento'
								value={formatDeferredPaymentAmount(document.total_amount)}
							/>
							<AmountCard
								label='Total abonado'
								value={formatDeferredPaymentAmount(document.paid_amount)}
								className='text-emerald-700 dark:text-emerald-400'
							/>
							<AmountCard label='Avance del pago' value={progressLabel} />
						</div>
						<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
							<CardBody className='space-y-4 p-5'>
								<div>
									<div className='mb-2 flex justify-between gap-3 text-sm'>
										<p className='font-semibold'>Progreso del pago</p>
										<p className='text-zinc-500'>{progressLabel} pagado</p>
									</div>
									<Progress
										value={progress}
										color='emerald'
										colorIntensity='600'
										className='h-3'
									/>
								</div>
								<div className='grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700'>
									<div>
										<p className='text-sm text-zinc-500'>Fecha de emisión</p>
										<p className='font-semibold'>
											{formatDeferredPaymentDate(document.issue_date)}
										</p>
									</div>
									<div>
										<p className='text-sm text-zinc-500'>
											Fecha de vencimiento
										</p>
										<p className='font-semibold'>
											{formatDeferredPaymentDate(document.due_date)}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
						<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
							<CardBody className='space-y-4 p-5'>
								<div>
									<p className='font-semibold'>Responsables de cobranza</p>
									<p className='text-sm text-zinc-500'>
										Reciben los recordatorios de cobranza junto al equipo de
										cobranza.
									</p>
								</div>
								<div className='flex flex-wrap gap-3'>
									{document.assignees.map((assignee) => (
										<div
											key={assignee.id}
											className='flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950'>
											<Avatar
												src={assignee.avatar_url ?? undefined}
												name={assignee.name}
												className='h-10 w-10'
											/>
											<div className='min-w-0'>
												<p className='truncate text-sm font-semibold'>
													{assignee.name}
												</p>
												<p className='truncate text-xs text-zinc-500'>
													{assignee.email}
												</p>
											</div>
										</div>
									))}
									{document.assignees.length === 0 && (
										<p className='text-sm text-zinc-500'>
											No hay responsables asignados.
										</p>
									)}
								</div>
							</CardBody>
						</Card>
						<DeferredPaymentItemsSection items={document.items} />
					</>
				)}
			</OffCanvasBody>
		</OffCanvas>
	);
};

export default DeferredPaymentDetailDrawer;
