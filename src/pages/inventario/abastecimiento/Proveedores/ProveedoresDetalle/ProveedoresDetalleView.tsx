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
import ProveedorFormModal from '../components/modals/ProveedorFormModal';
import DeactivateSupplierModal from '../components/modals/DeactivateSupplierModal';
import SupplierStatusBadge from '../components/parts/SupplierStatusBadge';
import useProveedoresDetalle from './hooks/useProveedoresDetalle';
import SupplierPurchaseSummaryCard from './components/parts/SupplierPurchaseSummaryCard';

/**
 * Ficha de proveedor: los mismos campos del formulario más id, display_name,
 * is_active, timestamps, `allowed_actions` y `purchase_summary` (sección 5
 * del contrato). La botonera sale de `allowed_actions` vía
 * `AllowedActionsToolbar`, no de reglas propias de esta pantalla.
 */
const ProveedoresDetalleView = () => {
	const {
		id,
		branchId,
		subsidiaryId,
		supplier,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isDeactivateModalOpen,
		setIsDeactivateModalOpen,
		isRestoring,
		handleAction,
		handleDeactivated,
		goToSupplier,
		goToList,
		retry,
		resolveCommuneName,
	} = useProveedoresDetalle();

	return (
		<PageWrapper isProtectedRoute title={supplier?.display_name ?? 'Proveedor'}>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBuildingStorefront' />
					<span>
						Inventario / Abastecimiento / Proveedores / {supplier?.display_name ?? '…'}
					</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' icon='HeroArrowLeft' onClick={goToList}>
						Volver al listado
					</Button>
					{supplier && (
						<AllowedActionsToolbar
							allowedActions={supplier.allowed_actions}
							resource='supplier'
							onAction={handleAction}
							branchId={branchId}
							subsidiaryId={subsidiaryId}
							pendingAction={isRestoring ? 'restore' : null}
						/>
					)}
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-4'>
				{id === null && (
					<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
						El proveedor solicitado no es válido.
					</Alert>
				)}

				{loading && (
					<Card>
						<CardBody className='space-y-3'>
							{Array.from({ length: 4 }, (_, index) => (
								<div
									key={`supplier-detail-skeleton-${index}`}
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
						title='No pudimos cargar el proveedor'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={retry}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}

				{!loading && !error && supplier && (
					<>
						<Card>
							<CardHeader>
								<div className='flex items-center gap-3'>
									<CardTitle className='text-lg'>
										{supplier.display_name}
									</CardTitle>
									<SupplierStatusBadge isActive={supplier.is_active} />
								</div>
								<span className='font-mono text-sm text-zinc-500'>
									{supplier.rut}
								</span>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Razón social</p>
									<p>{supplier.company_name ?? '—'}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Nombre de contacto
									</p>
									<p>{supplier.contact_name ?? '—'}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Giro</p>
									<p>{supplier.business_activity ?? '—'}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Teléfono</p>
									<p>{supplier.phone ?? '—'}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Email</p>
									<p>{supplier.email ?? '—'}</p>
								</div>
								<div />
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Dirección de facturación
									</p>
									<p>
										{supplier.billing_address ?? '—'}
										{supplier.billing_address &&
											supplier.billing_commune_id !== null && (
												<span className='text-zinc-500'>
													{' '}
													(
													{resolveCommuneName(
														supplier.billing_commune_id,
													) ?? 'comuna'}
													)
												</span>
											)}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Dirección de despacho
									</p>
									<p>
										{supplier.shipping_address ?? '—'}
										{supplier.shipping_address &&
											supplier.shipping_commune_id !== null && (
												<span className='text-zinc-500'>
													{' '}
													(
													{resolveCommuneName(
														supplier.shipping_commune_id,
													) ?? 'comuna'}
													)
												</span>
											)}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>Creado</p>
									<p>{formatDate(supplier.created_at)}</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-500'>
										Última actualización
									</p>
									<p>{formatDate(supplier.updated_at)}</p>
								</div>
							</CardBody>
						</Card>

						<SupplierPurchaseSummaryCard summary={supplier.purchase_summary} />
					</>
				)}
			</Container>

			{supplier && (
				<>
					<ProveedorFormModal
						isOpen={isFormModalOpen}
						setIsOpen={setIsFormModalOpen}
						branchId={branchId}
						subsidiaryId={subsidiaryId}
						supplier={supplier}
						onViewSupplier={goToSupplier}
					/>
					<DeactivateSupplierModal
						isOpen={isDeactivateModalOpen}
						setIsOpen={setIsDeactivateModalOpen}
						supplier={{ id: supplier.id, display_name: supplier.display_name }}
						subsidiaryId={subsidiaryId}
						onDeactivated={handleDeactivated}
					/>
				</>
			)}
		</PageWrapper>
	);
};

export default ProveedoresDetalleView;
