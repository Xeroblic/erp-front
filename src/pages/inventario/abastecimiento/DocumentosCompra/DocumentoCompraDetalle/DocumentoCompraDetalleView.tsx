import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import { AllowedActionsToolbar } from '@/components/procurement';
import { formatDate } from '@/utils/format.utils';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import DocumentTypeBadge from '../components/parts/DocumentTypeBadge';
import DocumentStatusBadge from '../components/parts/DocumentStatusBadge';
import ReceptionStatusBadge from '../components/parts/ReceptionStatusBadge';
import PurchaseDocumentLinesTable from '../components/parts/PurchaseDocumentLinesTable';
import PurchaseDocumentFormModal from '../components/modals/PurchaseDocumentFormModal';
import ConfirmPurchaseDocumentModal from '../components/modals/ConfirmPurchaseDocumentModal';
import CancelPurchaseDocumentModal from '../components/modals/CancelPurchaseDocumentModal';
import DocumentAttachmentsCard from './components/parts/DocumentAttachmentsCard';
import RelatedCountsCard from './components/parts/RelatedCountsCard';
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
		allowedActions,
		isReceiptDeferred,
		attachmentsCardRef,
		handleAction,
		goToList,
		retry,
	} = useDocumentoCompraDetalle();

	return (
		<PageWrapper isProtectedRoute title={document?.document_number ?? 'Documento de compra'}>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroDocumentText'
						title='Documentos de compra'
						description='Líneas, adjuntos y recepciones asociadas al documento'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' icon='HeroArrowLeft' onClick={goToList}>
						Volver al listado
					</Button>
					{document && (
						<AllowedActionsToolbar
							allowedActions={allowedActions}
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

				{/*
				 * Sólo la carga inicial (sin `document` todavía) muestra el
				 * esqueleto. Un `retry` posterior (tras subir/eliminar un
				 * adjunto, confirmar, etc.) vuelve a poner `loading` en `true`
				 * con el documento previo aún en memoria — si el esqueleto
				 * reemplazara el contenido también en ese caso, desmontaría y
				 * volvería a montar `DocumentAttachmentsCard`, perdiendo el
				 * estado de su propio hook (cola de subidas, error de
				 * validación) en cada refresco. Mismo criterio que
				 * `DeferredPaymentDetailDrawer`.
				 */}
				{loading && !document && (
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

				{!error && document && (
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

						{/*
						 * El backend ofrece `create_receipt`, pero el hook la retira
						 * porque Recepciones sigue sobre datos simulados. Se explica
						 * en vez de mostrar un botón deshabilitado.
						 */}
						{isReceiptDeferred && (
							<Alert
								color='blue'
								variant='outline'
								icon='HeroInformationCircle'
								title='Recepción aún no disponible'>
								Recepciones todavía trabaja con datos de prueba, así que este
								documento no puede ingresar al stock desde aquí. Su recepción se
								habilitará cuando el sistema publique las recepciones de mercadería.
							</Alert>
						)}

						<Card>
							<CardHeader>
								<div className='flex items-center gap-3'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm'>
										<Icon
											icon='HeroDocumentText'
											size='text-2xl'
											color='white'
										/>
									</div>
									<div>
										<CardTitle className='text-lg'>
											Documento de compra
										</CardTitle>
										<p className='font-mono text-sm text-zinc-500 dark:text-zinc-400'>
											N° {document.document_number}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
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
											Total informativo (con IVA)
										</p>
										<p>
											{formatDecimalAmount(
												document.total_amount,
												document.currency_code,
											) ?? '—'}
										</p>
									</div>
									<div>
										<p className='text-xs uppercase text-zinc-500'>
											Confirmado
										</p>
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
								</div>

								{/*
								 * `supplier_snapshot` es la ficha histórica del proveedor al
								 * confirmar (distinta de `document.supplier`, vigente): se
								 * muestra como un bloque secundario de la misma card, no
								 * como una segunda card "Proveedor" — eso duplicaba el
								 * título y hacía parecer que era el mismo dato dos veces.
								 */}
								{document.supplier_snapshot && (
									<div className='rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700'>
										<p className='mb-2 text-xs uppercase text-zinc-500'>
											Datos del proveedor registrados al confirmar
										</p>
										<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
											<div>
												<p className='text-xs text-zinc-500'>
													Razón social
												</p>
												<p className='text-sm'>
													{document.supplier_snapshot.company_name ?? '—'}
												</p>
											</div>
											<div>
												<p className='text-xs text-zinc-500'>Giro</p>
												<p className='text-sm'>
													{document.supplier_snapshot.business_activity ??
														'—'}
												</p>
											</div>
											<div>
												<p className='text-xs text-zinc-500'>
													Dirección de facturación
												</p>
												<p className='text-sm'>
													{document.supplier_snapshot.billing_address ??
														'—'}
												</p>
											</div>
											<div>
												<p className='text-xs text-zinc-500'>
													Dirección de despacho
												</p>
												<p className='text-sm'>
													{document.supplier_snapshot.shipping_address ??
														'—'}
												</p>
											</div>
										</div>
									</div>
								)}
							</CardBody>
							<CardFooter>
								{/*
								 * Un único hijo dentro de `CardFooter`: su `justify-between`
								 * reparte hijos directos, así que con las tres píldoras
								 * sueltas como hijos quedaban una en cada extremo. Agrupadas
								 * en este `div` quedan juntas, una al lado de la otra.
								 */}
								<div className='flex flex-wrap items-center gap-2'>
									<DocumentTypeBadge documentType={document.document_type} fit />
									<DocumentStatusBadge status={document.status} fit />
									{/*
									 * `reception_status` es `null` en `draft`/`cancelled`: la
									 * tabla lo pinta como píldora «—» a propósito, para que
									 * las tres variantes de esa columna midan lo mismo. Acá no
									 * hay columna que alinear, así que una píldora vacía sólo
									 * era ruido — se omite en vez de mostrarla.
									 */}
									{document.reception_status !== null && (
										<ReceptionStatusBadge
											receptionStatus={document.reception_status}
											fit
										/>
									)}
								</div>
							</CardFooter>
						</Card>

						<PurchaseDocumentLinesTable
							lines={document.items}
							hasCoverage={document.status === 'confirmed'}
						/>

						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Relacionados</CardTitle>
							</CardHeader>
							<CardBody className='space-y-3'>
								<RelatedCountsCard relatedCounts={document.related_counts} />
								{/*
								 * Los conteos son reales; el detalle de cada recepción o
								 * asignación todavía no: esos módulos siguen sin backend y
								 * sus datos simulados usan otros ids de documento.
								 */}
								<p className='text-sm text-zinc-500 dark:text-zinc-400'>
									El detalle de recepciones y asignaciones de stock inicial estará
									disponible cuando se habiliten las recepciones de mercadería.
								</p>
							</CardBody>
						</Card>

						<DocumentAttachmentsCard
							ref={attachmentsCardRef}
							documentId={document.id}
							documentStatus={document.status}
							subsidiaryId={subsidiaryId}
							branchId={branchId}
							onChanged={retry}
						/>
					</>
				)}
			</Container>

			{document && document.status === 'draft' && (
				<PurchaseDocumentFormModal
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
					<ConfirmPurchaseDocumentModal
						isOpen={isConfirmModalOpen}
						setIsOpen={setIsConfirmModalOpen}
						document={document}
						subsidiaryId={subsidiaryId}
						onConfirmed={retry}
					/>
					<CancelPurchaseDocumentModal
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
