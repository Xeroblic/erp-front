import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { AllowedActionsToolbar } from '@/components/procurement';
import { formatDate } from '@/utils/format.utils';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import {
	listPurchaseDocumentInitialStockAllocations,
	listPurchaseDocumentStockReceipts,
} from '@/services/procurement/purchaseDocuments.service';
import DocumentTypeBadge from '../components/parts/DocumentTypeBadge';
import DocumentStatusBadge from '../components/parts/DocumentStatusBadge';
import ReceptionStatusBadge from '../components/parts/ReceptionStatusBadge';
import PurchaseDocumentLinesTable from '../components/parts/PurchaseDocumentLinesTable';
import DocumentoCompraFormModal from '../components/modals/DocumentoCompraFormModal';
import ConfirmDocumentoCompraModal from '../components/modals/ConfirmDocumentoCompraModal';
import CancelDocumentoCompraModal from '../components/modals/CancelDocumentoCompraModal';
import RelatedCountsCard from './components/parts/RelatedCountsCard';
import RelatedListCard from './components/parts/RelatedListCard';
import useDocumentoCompraDetalle from './hooks/useDocumentoCompraDetalle';

/**
 * Ficha de documento de compra: lista + `supplier_snapshot`, `notes`,
 * `items` con cobertura, `related_counts` y las fechas de confirmación/
 * anulación (sección 6 del contrato). La botonera sale de `allowed_actions`
 * vía `AllowedActionsToolbar`, no de reglas propias de esta pantalla.
 */
const DocumentoCompraDetalleView = () => {
	const {
		id,
		branchId,
		subsidiaryId,
		document,
		etag,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isConfirmModalOpen,
		setIsConfirmModalOpen,
		isCancelModalOpen,
		setIsCancelModalOpen,
		handleAction,
		goToList,
		retry,
	} = useDocumentoCompraDetalle();

	return (
		<PageWrapper isProtectedRoute title={document?.document_number ?? 'Documento de compra'}>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroDocumentText' />
					<span>
						Inventario / Abastecimiento / Documentos de compra /{' '}
						{document?.document_number ?? '…'}
					</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' icon='HeroArrowLeft' onClick={goToList}>
						Volver al listado
					</Button>
					{document && (
						<AllowedActionsToolbar
							allowedActions={document.allowed_actions}
							resource='purchase_document'
							onAction={handleAction}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
						/>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-4'>
				{id === null && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						El documento solicitado no es válido.
					</Alert>
				)}

				{loading && (
					<Card>
						<CardBody className='space-y-3'>
							{Array.from({ length: 4 }, (_, index) => (
								<div
									key={`document-detail-skeleton-${index}`}
									className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700'
								/>
							))}
						</CardBody>
					</Card>
				)}

				{!loading && error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar el documento'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={retry}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}

				{!loading && !error && document && (
					<>
						{document.status === 'cancelled' && document.cancellation_reason && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroXCircle'
								title='Documento anulado'>
								{document.cancellation_reason}
							</Alert>
						)}

						<Card>
							<CardHeader>
								<div className='flex flex-wrap items-center gap-3'>
									<CardTitle className='text-lg'>
										{document.document_number}
									</CardTitle>
									<DocumentTypeBadge documentType={document.document_type} />
									<DocumentStatusBadge status={document.status} />
									<ReceptionStatusBadge
										receptionStatus={document.reception_status}
									/>
								</div>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Proveedor</p>
									{document.supplier ? (
										<p>
											{document.supplier.display_name}{' '}
											<span className='font-mono text-xs text-zinc-500'>
												({document.supplier.rut})
											</span>
										</p>
									) : (
										<p className='text-zinc-400'>Sin proveedor</p>
									)}
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Fecha de emisión
									</p>
									<p>{formatDate(document.issue_date)}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Total informativo
									</p>
									<p>
										{formatDecimalAmount(
											document.total_amount,
											document.currency_code,
										) ?? '—'}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Confirmado</p>
									<p>
										{document.confirmed_at
											? formatDate(document.confirmed_at)
											: '—'}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Anulado</p>
									<p>
										{document.cancelled_at
											? formatDate(document.cancelled_at)
											: '—'}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Creado</p>
									<p>{formatDate(document.created_at)}</p>
								</div>
								{document.notes && (
									<div className='sm:col-span-2 lg:col-span-3'>
										<p className='text-xs uppercase text-zinc-500'>Notas</p>
										<p>{document.notes}</p>
									</div>
								)}
							</CardBody>
						</Card>

						{document.supplier_snapshot && (
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>
										Proveedor al momento de confirmar
									</CardTitle>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
									<div>
										<p className='text-xs uppercase text-zinc-500'>
											Razón social
										</p>
										<p>{document.supplier_snapshot.company_name ?? '—'}</p>
									</div>
									<div>
										<p className='text-xs uppercase text-zinc-500'>Giro</p>
										<p>{document.supplier_snapshot.business_activity ?? '—'}</p>
									</div>
									<div>
										<p className='text-xs uppercase text-zinc-500'>
											Dirección de facturación
										</p>
										<p>{document.supplier_snapshot.billing_address ?? '—'}</p>
									</div>
									<div>
										<p className='text-xs uppercase text-zinc-500'>
											Dirección de despacho
										</p>
										<p>{document.supplier_snapshot.shipping_address ?? '—'}</p>
									</div>
								</CardBody>
							</Card>
						)}

						<PurchaseDocumentLinesTable
							lines={document.items}
							hasCoverage={document.status === 'confirmed'}
						/>

						<RelatedCountsCard relatedCounts={document.related_counts} />

						<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
							<RelatedListCard
								title='Recepciones'
								emptyLabel='Sin recepciones registradas todavía.'
								subsidiaryId={subsidiaryId}
								documentId={document.id}
								fetcher={listPurchaseDocumentStockReceipts}
							/>
							<RelatedListCard
								title='Asignaciones de stock inicial'
								emptyLabel='Sin asignaciones de stock inicial todavía.'
								subsidiaryId={subsidiaryId}
								documentId={document.id}
								fetcher={listPurchaseDocumentInitialStockAllocations}
							/>
						</div>
					</>
				)}
			</Container>

			{document && document.status === 'draft' && (
				<DocumentoCompraFormModal
					isOpen={isFormModalOpen}
					setIsOpen={setIsFormModalOpen}
					subsidiaryId={subsidiaryId}
					document={document}
					etag={etag}
					onSuccess={retry}
					onStaleVersion={retry}
				/>
			)}

			{document && (
				<>
					<ConfirmDocumentoCompraModal
						isOpen={isConfirmModalOpen}
						setIsOpen={setIsConfirmModalOpen}
						document={document}
						subsidiaryId={subsidiaryId}
						onConfirmed={retry}
					/>
					<CancelDocumentoCompraModal
						isOpen={isCancelModalOpen}
						setIsOpen={setIsCancelModalOpen}
						document={document}
						subsidiaryId={subsidiaryId}
						onCancelled={retry}
					/>
				</>
			)}
		</PageWrapper>
	);
};

export default DocumentoCompraDetalleView;
