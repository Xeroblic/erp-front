import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { listReturnState } from '@/utils/listSearchParams.util';
import useDocumentosCompra from './hooks/useDocumentosCompra';
import DocumentosCompraFilters from './components/filters/DocumentosCompraFilters';
import DocumentosCompraTable from './components/tables/DocumentosCompraTable';
import PurchaseDocumentFormModal from './components/modals/PurchaseDocumentFormModal';

/**
 * Listado de documentos de compra (card 03, sección 6 del contrato de
 * abastecimiento). La fila resumida no trae `items`, `supplier_snapshot` ni
 * `related_counts` — esos son caros y sólo viajan en el detalle
 * (`DocumentoCompraDetalle`), que también es donde vive editar, confirmar y
 * anular vía `AllowedActionsToolbar`.
 */
const DocumentosCompraView = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const {
		branchId,
		subsidiaryId,
		items,
		meta,
		loading,
		error,
		search,
		documentType,
		status,
		receptionStatus,
		supplierId,
		issuedFrom,
		issuedTo,
		documentTypeOptions,
		statusOptions,
		receptionStatusOptions,
		supplierOptions,
		supplierOptionsLoading,
		canFilterBySupplier,
		hasActiveFilters,
		setSearchValue,
		clearFilters,
		setDocumentTypeValue,
		setStatusValue,
		setReceptionStatusValue,
		setSupplierIdValue,
		setIssuedFromValue,
		setIssuedToValue,
		onPaginationChange,
		refresh,
		isCreateModalOpen,
		setIsCreateModalOpen,
	} = useDocumentosCompra();

	// La ficha recibe la query del listado para que «Volver al listado» la conserve.
	const handleView = (id: number) =>
		navigate(`/inventario/abastecimiento/documentos-compra/${id}`, {
			state: listReturnState(location.search),
		});

	return (
		<PageWrapper isProtectedRoute title='Documentos de compra'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroDocumentText'
						title='Documentos de compra'
						description='Boletas y facturas de compra con su estado de confirmación y recepción'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission='create-purchase-document'
						branchId={branchId}
						subsidiaryId={subsidiaryId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						onClick={() => setIsCreateModalOpen(true)}>
						Nuevo documento
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				<DocumentosCompraFilters
					search={search}
					onSearchChange={setSearchValue}
					documentType={documentType}
					documentTypeOptions={documentTypeOptions}
					onDocumentTypeChange={setDocumentTypeValue}
					status={status}
					statusOptions={statusOptions}
					onStatusChange={setStatusValue}
					receptionStatus={receptionStatus}
					receptionStatusOptions={receptionStatusOptions}
					onReceptionStatusChange={setReceptionStatusValue}
					supplierId={supplierId}
					supplierOptions={supplierOptions}
					supplierOptionsLoading={supplierOptionsLoading}
					canFilterBySupplier={canFilterBySupplier}
					onSupplierIdChange={setSupplierIdValue}
					issuedFrom={issuedFrom}
					onIssuedFromChange={setIssuedFromValue}
					issuedTo={issuedTo}
					onIssuedToChange={setIssuedToValue}
					onClearFilters={clearFilters}
				/>
				{error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar los documentos'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				<DocumentosCompraTable
					rows={items}
					meta={meta}
					loading={loading}
					hasError={Boolean(error)}
					hasActiveFilters={hasActiveFilters}
					onPaginationChange={onPaginationChange}
					onView={handleView}
				/>
			</Container>

			<PurchaseDocumentFormModal
				isOpen={isCreateModalOpen}
				setIsOpen={setIsCreateModalOpen}
				subsidiaryId={subsidiaryId}
				document={null}
				onSuccess={(created) => {
					// Navega a la ficha recién creada: no hace falta refrescar un
					// listado que se está abandonando.
					handleView(created.id);
				}}
			/>
		</PageWrapper>
	);
};

export default DocumentosCompraView;
