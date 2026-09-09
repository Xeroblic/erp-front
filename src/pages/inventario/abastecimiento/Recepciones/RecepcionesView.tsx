import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import ProtectedButton from '@/components/ui/ProtectedButton';
import useAuthorization from '@/hooks/useAuthorization';
import useRecepciones from './hooks/useRecepciones';
import RecepcionesFilters from './components/filters/RecepcionesFilters';
import RecepcionesTable from './components/tables/RecepcionesTable';
import RecepcionFormModal from './components/modals/RecepcionFormModal';

/**
 * Listado de recepciones físicas (card 05, sección 7 del contrato de
 * abastecimiento). La fila resumida no trae `items`, `reason` ni
 * `processing` — esos son caros y sólo viajan en el detalle
 * (`RecepcionDetalle`), que también es donde vive editar, publicar,
 * reintentar, anular y revertir vía `AllowedActionsToolbar`.
 *
 * `?purchase_document_id=` abre el alta «con documento» ya seleccionado:
 * es el destino de `create_receipt` desde la ficha de un documento de
 * compra confirmado (`DocumentoCompraDetalle`).
 */
const RecepcionesView = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		branchId,
		subsidiaryId,
		visibleBranches,
		items,
		meta,
		loading,
		error,
		search,
		status,
		warehouseId,
		receivedFrom,
		receivedTo,
		statusOptions,
		hasActiveFilters,
		setSearchValue,
		clearFilters,
		setStatusValue,
		setWarehouseIdValue,
		setReceivedFromValue,
		setReceivedToValue,
		onPaginationChange,
		refresh,
	} = useRecepciones();

	const { authorize } = useAuthorization();
	/**
	 * Mismo permiso + scope que exige `useRecepcionForm` al enviar (hallazgo
	 * 4): la ruta sólo pide `view-product`, así que el alta necesita su propio
	 * guard — no basta con ocultar el botón «Nueva recepción», porque
	 * `?purchase_document_id=` puede abrir el mismo formulario por URL directa
	 * sin pasar por ese botón.
	 */
	const canWriteReceipts = authorize({
		permission: 'edit-product',
		scope: 'access',
		branchId,
		subsidiaryId,
	});

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const preselectedDocumentId = searchParams.get('purchase_document_id');

	const handleView = (id: number) => navigate(`/inventario/abastecimiento/recepciones/${id}`);

	const handleCloseCreateModal = (open: boolean) => {
		setIsCreateModalOpen(open);
		if (!open && preselectedDocumentId) {
			searchParams.delete('purchase_document_id');
			setSearchParams(searchParams, { replace: true });
		}
	};

	useEffect(() => {
		if (preselectedDocumentId && canWriteReceipts) setIsCreateModalOpen(true);
	}, [preselectedDocumentId, canWriteReceipts]);

	/**
	 * Revalida al vuelo (hallazgo 4): si se pierde `edit-product` o el scope
	 * de la filial/sucursal mientras el formulario está abierto — cambio de
	 * contexto, permisos que se refrescan — lo cierra. Corre también al
	 * montar sin query param: sin autorización y sin nada que abrir, no pasa
	 * de un `setState` en falso.
	 */
	useEffect(() => {
		if (!canWriteReceipts) handleCloseCreateModal(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canWriteReceipts]);

	return (
		<PageWrapper isProtectedRoute title='Recepciones'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroInboxArrowDown' />
					<span>Inventario / Abastecimiento / Recepciones</span>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission='edit-product'
						branchId={branchId}
						subsidiaryId={subsidiaryId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						onClick={() => handleCloseCreateModal(true)}>
						Nueva recepción
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				<RecepcionesFilters
					search={search}
					onSearchChange={setSearchValue}
					status={status}
					statusOptions={statusOptions}
					onStatusChange={setStatusValue}
					warehouseId={warehouseId}
					onWarehouseIdChange={setWarehouseIdValue}
					receivedFrom={receivedFrom}
					onReceivedFromChange={setReceivedFromValue}
					receivedTo={receivedTo}
					onReceivedToChange={setReceivedToValue}
					onClearFilters={clearFilters}
				/>
				{error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar las recepciones'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				<RecepcionesTable
					rows={items}
					meta={meta}
					loading={loading}
					hasError={Boolean(error)}
					hasActiveFilters={hasActiveFilters}
					onPaginationChange={onPaginationChange}
					onView={handleView}
				/>
			</Container>

			<RecepcionFormModal
				isOpen={isCreateModalOpen}
				setIsOpen={handleCloseCreateModal}
				subsidiaryId={subsidiaryId}
				branchId={branchId}
				authorizedBranchIds={visibleBranches.map((branch) => branch.id)}
				receipt={null}
				initialDocumentId={
					preselectedDocumentId ? Number(preselectedDocumentId) : undefined
				}
				onSuccess={(created) => {
					// Navega a la ficha recién creada: no hace falta refrescar un
					// listado que se está abandonando.
					handleView(created.id);
				}}
			/>
		</PageWrapper>
	);
};

export default RecepcionesView;
