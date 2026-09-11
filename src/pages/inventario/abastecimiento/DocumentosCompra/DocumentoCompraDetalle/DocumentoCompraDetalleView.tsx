import React from 'react';
import { Link } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { AllowedActionsToolbar } from '@/components/procurement';
import { formatDate } from '@/utils/format.utils';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';
import { listInitialStockAllocationsForPurchaseDocument } from '@/services/procurement/inventoryStock.service';
import { listStockReceiptsForPurchaseDocument } from '@/services/procurement/stockReceipts.service';
import type {
	IInventoryDocumentAllocation,
	IStockReceiptListRow,
	TStockReceiptStatus,
} from '@/interface/procurement.interface';
import type { TColors } from '@/types/colors.type';
import DocumentTypeBadge from '../components/parts/DocumentTypeBadge';
import DocumentStatusBadge from '../components/parts/DocumentStatusBadge';
import ReceptionStatusBadge from '../components/parts/ReceptionStatusBadge';
import PurchaseDocumentLinesTable from '../components/parts/PurchaseDocumentLinesTable';
import DocumentoCompraFormModal from '../components/modals/DocumentoCompraFormModal';
import ConfirmDocumentoCompraModal from '../components/modals/ConfirmDocumentoCompraModal';
import CancelDocumentoCompraModal from '../components/modals/CancelDocumentoCompraModal';
import DocumentAttachmentsCard from './components/parts/DocumentAttachmentsCard';
import RelatedCountsCard from './components/parts/RelatedCountsCard';
import RelatedListCard from './components/parts/RelatedListCard';
import useDocumentoCompraDetalle from './hooks/useDocumentoCompraDetalle';

/**
 * Colores de estado de recepción para la fila del resumen (hallazgo 9): sin
 * importar el badge propio de `Recepciones` — cada página del módulo maneja
 * su propia presentación, y esta lista sólo necesita distinguir de un
 * vistazo `posted`/`failed` del resto.
 */
const STOCK_RECEIPT_STATUS_COLOR: Record<TStockReceiptStatus, TColors> = {
	draft: 'zinc',
	queued: 'blue',
	posted: 'emerald',
	failed: 'red',
	reversed: 'amber',
	cancelled: 'zinc',
};

const STOCK_RECEIPT_STATUS_LABEL: Record<TStockReceiptStatus, string> = {
	draft: 'Borrador',
	queued: 'Procesando',
	posted: 'Contabilizada',
	failed: 'Con error',
	reversed: 'Revertida',
	cancelled: 'Anulada',
};

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
		attachmentsCardRef,
		handleAction,
		goToList,
		retry,
	} = useDocumentoCompraDetalle();

	/**
	 * Fila de resumen de recepción (hallazgo 9): navega a la ficha completa
	 * sólo con `view-product` — el permiso de lectura de recepciones
	 * (sección 15), no `view-purchase-document` (el de esta pantalla), que es
	 * un permiso distinto. Sin ese permiso, la fila queda sin enlace en vez
	 * de ofrecer una navegación que el destino igual rechazaría.
	 */
	const renderStockReceiptRow = (row: IStockReceiptListRow): React.ReactNode => (
		<div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
			<div className='flex items-center gap-2'>
				<Badge color={STOCK_RECEIPT_STATUS_COLOR[row.status]} variant='solid'>
					{STOCK_RECEIPT_STATUS_LABEL[row.status]}
				</Badge>
				<span>{row.warehouse.name}</span>
				<span className='text-zinc-500'>
					· {row.total_quantity} u. · {formatDate(row.received_on)}
				</span>
			</div>
			<PermissionGuard
				permission='view-product'
				branchId={row.branch_id}
				subsidiaryId={subsidiaryId}
				scope='visible'>
				<Link
					to={`/inventario/abastecimiento/recepciones/${row.id}`}
					className='text-blue-600 hover:underline dark:text-blue-400'>
					Ver recepción #{row.id}
				</Link>
			</PermissionGuard>
		</div>
	);

	/**
	 * Fila de asignación de stock inicial (card 07, sección 8): documental,
	 * `physical_stock_delta` siempre `0` — el texto lo dice explícitamente para
	 * que esta lista nunca se confunda con «ingresó mercadería».
	 */
	const renderInitialStockAllocationRow = (
		row: IInventoryDocumentAllocation,
	): React.ReactNode => (
		<div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
			<div className='flex items-center gap-2'>
				<Badge color='blue' variant='solid'>
					Sin movimiento físico
				</Badge>
				<span>{row.quantity} u. documentadas</span>
				<span className='text-zinc-500'>· {formatDate(row.created_at)}</span>
			</div>
			<span className='text-xs text-zinc-500'>
				Origin #{row.original_origin_id} → #{row.documented_origin_id} · quedan{' '}
				{row.remaining_undocumented_quantity} sin documento
			</span>
		</div>
	);

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
							<CardBody>
								<RelatedCountsCard relatedCounts={document.related_counts} />
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

						<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
							<RelatedListCard<IStockReceiptListRow>
								title='Recepciones'
								emptyLabel='Sin recepciones registradas todavía.'
								subsidiaryId={subsidiaryId}
								documentId={document.id}
								fetcher={listStockReceiptsForPurchaseDocument}
								renderRow={renderStockReceiptRow}
							/>
							<RelatedListCard<IInventoryDocumentAllocation>
								title='Asignaciones de stock inicial'
								emptyLabel='Sin asignaciones de stock inicial todavía.'
								subsidiaryId={subsidiaryId}
								documentId={document.id}
								fetcher={listInitialStockAllocationsForPurchaseDocument}
								renderRow={renderInitialStockAllocationRow}
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
