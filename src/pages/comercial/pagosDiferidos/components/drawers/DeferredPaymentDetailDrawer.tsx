import React, { useCallback, useEffect, useState } from 'react';
import type { OrganizationalContext } from '@/hooks/useContextScopedSelection';
import type {
	IDeferredPaymentAbono,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import Avatar from '@/components/Avatar';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasFooter,
	OffCanvasHeader,
} from '@/components/ui/OffCanvas';
import Progress from '@/components/ui/Progress';
import DaysUntilDueBadge from '../badges/DaysUntilDueBadge';
import DeferredStatusPill from '../badges/DeferredStatusPill';
import {
	DeferredPaymentAttachmentsSection,
	DeferredPaymentPaymentsSection,
} from '../detail/DeferredPaymentActivitySections';
import DeferredPaymentActionsFooter from '../detail/DeferredPaymentActionsFooter';
import DeferredPaymentItemsSection from '../detail/DeferredPaymentItemsSection';
import RegisterDeferredPaymentModal from '../modals/RegisterDeferredPaymentModal';
import ConfirmDeferredPaymentActionModal from '../modals/ConfirmDeferredPaymentActionModal';
import useDeferredPaymentDetail from '../../hooks/useDeferredPaymentDetail';
import { useDeferredPaymentActions } from '../../hooks/useDeferredPaymentActions';
import { DEFERRED_PAYMENT_RECEIPT_ACCEPT } from '../../types';
import {
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
	formatDeferredPaymentAmount,
	formatDeferredPaymentDate,
} from '../../utils';

interface DeferredPaymentDetailDrawerProps {
	documentId: number | null;
	selectionContext: OrganizationalContext | null;
	onClose: () => void;
	onEdit: (document: IDeferredPaymentDocument) => void;
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
	selectionContext,
	onClose,
	onEdit,
}) => {
	const { document, loading, error, actions, branch, hasDataContext } =
		useDeferredPaymentDetail(documentId, selectionContext);
	const [isRegisterOpen, setIsRegisterOpen] = useState(false);
	const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
	const [isDiscardMarkPaidReceiptOpen, setIsDiscardMarkPaidReceiptOpen] = useState(false);
	const [closeAfterDiscardingReceipt, setCloseAfterDiscardingReceipt] = useState(false);
	const [paymentToVoid, setPaymentToVoid] = useState<IDeferredPaymentAbono | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	useEffect(() => {
		setIsRegisterOpen(false);
		setIsMarkPaidOpen(false);
		setIsDiscardMarkPaidReceiptOpen(false);
		setCloseAfterDiscardingReceipt(false);
		setPaymentToVoid(null);
		setIsDeleteOpen(false);
	}, [branch.branchId, branch.subsidiaryId, documentId]);
	const paymentActions = useDeferredPaymentActions(document, branch.subsidiaryId, () =>
		setIsRegisterOpen(false),
	);
	const openDiscardMarkPaidReceiptConfirmation = useCallback((closeDrawer = false) => {
		setCloseAfterDiscardingReceipt(closeDrawer);
		setIsDiscardMarkPaidReceiptOpen(true);
	}, []);
	const hasOpenActionModal =
		isRegisterOpen ||
		isMarkPaidOpen ||
		isDiscardMarkPaidReceiptOpen ||
		isDeleteOpen ||
		paymentToVoid !== null;
	const handleDrawerOpenChange: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
		(nextState) => {
			const shouldOpen =
				typeof nextState === 'function' ? nextState(documentId !== null) : nextState;
			if (!shouldOpen && !hasOpenActionModal) {
				if (paymentActions.state.pendingMarkPaidReceipt) {
					openDiscardMarkPaidReceiptConfirmation(true);
					return;
				}
				onClose();
			}
		},
		[
			documentId,
			hasOpenActionModal,
			onClose,
			openDiscardMarkPaidReceiptConfirmation,
			paymentActions.state.pendingMarkPaidReceipt,
		],
	);
	const discardMarkPaidReceipt = useCallback(() => {
		paymentActions.actions.dismissMarkPaidReceipt();
		setIsDiscardMarkPaidReceiptOpen(false);
		if (closeAfterDiscardingReceipt) onClose();
		setCloseAfterDiscardingReceipt(false);
	}, [closeAfterDiscardingReceipt, onClose, paymentActions.actions]);
	const total = Number(document?.total_amount ?? 0);
	const paid = Number(document?.paid_amount ?? 0);
	const progress = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
	const progressLabel = `${Math.round(progress)}%`;
	const customerDisplayName = document
		? document.customer.billing_company ||
			document.customer.contact_name ||
			'Cliente sin nombre'
		: undefined;

	return (
		<>
			<OffCanvas
				isOpen={documentId !== null}
				setIsOpen={handleDrawerOpenChange}
				dialogClassName='!max-w-2xl'
				contentClassName='!bg-white dark:!bg-zinc-900'>
				<OffCanvasHeader className='border-b border-zinc-200 px-6 pb-5 dark:border-zinc-800'>
					<div className='min-w-0'>
						<p className='truncate text-lg font-semibold'>
							{document?.document_number ?? 'Detalle del documento'}
						</p>
						<p className='truncate text-sm font-normal text-zinc-500'>
							{customerDisplayName ?? `Documento ID #${documentId ?? ''}`}
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
							Seleccioná nuevamente el contexto comercial para consultar este
							documento.
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
													{customerDisplayName}
												</p>
												<p className='text-sm text-zinc-600 dark:text-zinc-300'>
													RUT {document.customer.rut}
												</p>
											</div>
										</div>
										<div className='flex flex-col items-center gap-2 sm:items-end'>
											<DeferredStatusPill status={document.status} />
											<DaysUntilDueBadge
												daysUntilDue={
													document.status === 'paid'
														? null
														: document.days_until_due
												}
												isOverdue={document.is_overdue}
											/>
										</div>
									</div>
									<div className='grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700 sm:grid-cols-3'>
										<div>
											<p className='text-zinc-500'>N° de documento</p>
											<p className='font-semibold tabular-nums'>
												{document.document_number}
											</p>
										</div>
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
											<p className='text-sm text-zinc-500'>
												Fecha de emisión
											</p>
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
							<Card className='border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'>
								<CardBody className='space-y-2 p-5'>
									<p className='font-semibold'>Nota del documento</p>
									<p className='whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300'>
										{document.notes ?? 'Sin observaciones registradas.'}
									</p>
								</CardBody>
							</Card>
							<DeferredPaymentItemsSection items={document.items} />
							<DeferredPaymentPaymentsSection
								payments={document.payments}
								branchId={branch.branchId}
								subsidiaryId={branch.subsidiaryId}
								voidingPaymentId={paymentActions.state.voidingPaymentId}
								onVoid={(payment) => {
									paymentActions.actions.clearMutationErrors();
									setPaymentToVoid(payment);
								}}
							/>
							<DeferredPaymentAttachmentsSection attachments={document.attachments} />
							{paymentActions.state.pendingMarkPaidReceipt && (
								<Alert
									color='amber'
									variant='outline'
									icon='HeroExclamationTriangle'
									title='Documento pagado, comprobante pendiente'>
									<div className='space-y-3'>
										<p>
											El documento ya fue cerrado. Puedes reintentar el
											comprobante o descartar este aviso para continuar sin
											adjuntarlo.
										</p>
										{paymentActions.state.errorReceipt && (
											<Alert
												color='red'
												variant='outline'
												icon='HeroExclamationTriangle'
												title='No se pudo subir el comprobante'>
												{paymentActions.state.errorReceipt}
											</Alert>
										)}
										<div className='flex flex-wrap gap-2'>
											<Button
												size='sm'
												variant='solid'
												color='amber'
												isLoading={paymentActions.state.uploadingReceipt}
												isDisable={paymentActions.state.uploadingReceipt}
												onClick={() => {
													paymentActions.actions
														.retryMarkPaidReceipt()
														.catch(() => undefined);
												}}>
												Reintentar comprobante
											</Button>
											<Button
												size='sm'
												variant='outline'
												isDisable={paymentActions.state.uploadingReceipt}
												onClick={() =>
													openDiscardMarkPaidReceiptConfirmation()
												}>
												Descartar comprobante
											</Button>
										</div>
									</div>
								</Alert>
							)}
						</>
					)}
				</OffCanvasBody>
				<OffCanvasFooter
					className={
						document && !error
							? 'border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900'
							: 'hidden'
					}>
					{document && !error ? (
						<DeferredPaymentActionsFooter
							branchId={branch.branchId}
							subsidiaryId={branch.subsidiaryId}
							status={document.status}
							outstandingAmount={Number(document.outstanding_amount)}
							busy={paymentActions.state.busy}
							onRegisterPayment={() => {
								paymentActions.actions.clearMutationErrors();
								setIsRegisterOpen(true);
							}}
							onMarkPaid={() => {
								paymentActions.actions.clearMutationErrors();
								setIsMarkPaidOpen(true);
							}}
							onEdit={() => onEdit(document)}
							onDelete={() => {
								paymentActions.actions.clearMutationErrors();
								setIsDeleteOpen(true);
							}}
						/>
					) : (
						<span />
					)}
				</OffCanvasFooter>
			</OffCanvas>
			{document && isRegisterOpen && (
				<RegisterDeferredPaymentModal
					key={document.id}
					isOpen={isRegisterOpen}
					setIsOpen={setIsRegisterOpen}
					formik={paymentActions.formik}
					busy={paymentActions.state.recordingPayment}
					error={paymentActions.state.error}
				/>
			)}
			{document && isMarkPaidOpen && (
				<ConfirmDeferredPaymentActionModal
					key={document.id}
					isOpen
					setIsOpen={(nextState) => {
						const shouldOpen =
							typeof nextState === 'function' ? nextState(isMarkPaidOpen) : nextState;
						if (!shouldOpen) {
							setIsMarkPaidOpen(false);
							paymentActions.actions.resetMarkPaidReceipt();
						}
					}}
					title='Marcar documento como pagado'
					confirmLabel='Marcar pagada'
					busy={paymentActions.state.markingPaid || paymentActions.state.uploadingReceipt}
					error={paymentActions.state.errorMarkPaid ?? paymentActions.state.errorReceipt}
					isConfirmDisabled={paymentActions.state.markPaidReceiptError !== null}
					onConfirm={() => {
						paymentActions.actions
							.markPaid()
							.then((ok) => {
								if (ok) {
									setIsMarkPaidOpen(false);
									paymentActions.actions.resetMarkPaidReceipt();
								}
							})
							.catch(() => undefined);
					}}
					description={
						<>
							<p>
								Saldo restante:{' '}
								<strong>
									{formatDeferredPaymentAmount(document.outstanding_amount)}
								</strong>
								.
							</p>
							<p>
								Esta acción cerrará el documento y detendrá los recordatorios de
								cobranza.
							</p>
							<div>
								<Label htmlFor='mark_paid_receipt'>Comprobante (opcional)</Label>
								<Input
									id='mark_paid_receipt'
									name='mark_paid_receipt'
									type='file'
									accept={DEFERRED_PAYMENT_RECEIPT_ACCEPT}
									isValid={!paymentActions.state.markPaidReceiptError}
									isTouched={paymentActions.state.markPaidReceiptTouched}
									invalidFeedback={
										paymentActions.state.markPaidReceiptError ?? undefined
									}
									onChange={(event) => {
										paymentActions.actions
											.setMarkPaidReceipt(
												event.currentTarget.files?.[0] ?? null,
											)
											.catch(() => undefined);
									}}
								/>
								<p className='mt-1 text-xs text-zinc-500'>
									PDF, JPG, PNG, WEBP, XLS o XLSX; máximo 10 MB.
								</p>
								{paymentActions.state.markPaidReceiptTouched &&
									paymentActions.state.markPaidReceiptError && (
										<p className='mt-1 text-sm text-red-600'>
											{paymentActions.state.markPaidReceiptError}
										</p>
									)}
							</div>
						</>
					}
				/>
			)}
			{document && isDiscardMarkPaidReceiptOpen && (
				<ConfirmDeferredPaymentActionModal
					isOpen
					setIsOpen={(nextState) => {
						const shouldOpen =
							typeof nextState === 'function'
								? nextState(isDiscardMarkPaidReceiptOpen)
								: nextState;
						if (!shouldOpen) {
							setIsDiscardMarkPaidReceiptOpen(false);
							setCloseAfterDiscardingReceipt(false);
						}
					}}
					title='Descartar comprobante pendiente'
					confirmLabel='Descartar comprobante'
					color='red'
					busy={false}
					onConfirm={discardMarkPaidReceipt}
					description={
						<p>
							El documento ya está pagado. Si descartas el comprobante, no quedará
							adjunto y no podrás reintentarlo más tarde.
						</p>
					}
				/>
			)}
			{document && isDeleteOpen && (
				<ConfirmDeferredPaymentActionModal
					key={`delete-${document.id}`}
					isOpen
					setIsOpen={(nextState) => {
						const shouldOpen =
							typeof nextState === 'function' ? nextState(isDeleteOpen) : nextState;
						if (!shouldOpen) {
							setIsDeleteOpen(false);
							paymentActions.actions.clearMutationErrors();
						}
					}}
					title='Eliminar documento'
					confirmLabel='Eliminar documento'
					color='red'
					busy={paymentActions.state.deletingDocumentId === document.id}
					error={paymentActions.state.errorDelete}
					onConfirm={() => {
						paymentActions.actions
							.deleteDocument()
							.then((ok) => {
								if (ok) {
									setIsDeleteOpen(false);
									onClose();
								}
							})
							.catch(() => undefined);
					}}
					description={
						<>
							<p>
								Se eliminará el documento{' '}
								<strong>{document.document_number}</strong> por{' '}
								<strong>
									{formatDeferredPaymentAmount(document.total_amount)}
								</strong>
								. Esta acción no se puede deshacer.
							</p>
							{document.payments.length > 0 && (
								<Alert
									color='amber'
									variant='outline'
									icon='HeroExclamationTriangle'
									title='El documento tiene abonos registrados'>
									Los documentos con abonos no se pueden eliminar. Anulá primero
									los {document.payments.length} abono(s) registrado(s).
								</Alert>
							)}
						</>
					}
				/>
			)}
			{document && paymentToVoid && (
				<ConfirmDeferredPaymentActionModal
					isOpen
					setIsOpen={(open) => {
						if (!open) setPaymentToVoid(null);
					}}
					title='Anular abono'
					confirmLabel='Anular abono'
					color='red'
					busy={paymentActions.state.voidingPaymentId === paymentToVoid.id}
					error={paymentActions.state.errorVoid}
					onConfirm={() =>
						paymentActions.actions.voidPayment(paymentToVoid).then((ok) => {
							if (ok) setPaymentToVoid(null);
						})
					}
					description={
						<>
							<p>
								Monto:{' '}
								<strong>{formatDeferredPaymentAmount(paymentToVoid.amount)}</strong>
							</p>
							<p>
								Fecha:{' '}
								<strong>
									{paymentToVoid.paid_at
										? formatDeferredPaymentDate(paymentToVoid.paid_at)
										: 'Sin especificar'}
								</strong>
							</p>
							<p>
								Se recalcularán el saldo y el estado; esto puede reactivar los
								recordatorios.
							</p>
						</>
					}
				/>
			)}
		</>
	);
};

export default DeferredPaymentDetailDrawer;
