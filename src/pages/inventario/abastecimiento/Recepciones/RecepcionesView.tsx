import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import { ProcurementMockNotice } from '@/components/procurement';
import ProtectedButton from '@/components/ui/ProtectedButton';
import useAuthorization from '@/hooks/useAuthorization';
import { listReturnState } from '@/utils/listSearchParams.util';
import useRecepciones from './hooks/useRecepciones';
import RecepcionesFilters from './components/filters/RecepcionesFilters';
import RecepcionesTable from './components/tables/RecepcionesTable';
import StockReceiptFormModal from './components/modals/StockReceiptFormModal';

interface IDeniedCreateRequest {
	documentId: string;
	/** Filial en la que se pidió; `null` si el perfil todavía no la había resuelto. */
	subsidiaryId: number | null;
}

/**
 * Listado de recepciones físicas (sección 7 del contrato de abastecimiento).
 * La fila resumida no trae `items`, `reason` ni `processing` — esos son caros
 * y sólo viajan en el detalle (`RecepcionDetalle`), que también es donde vive
 * editar, publicar, reintentar, anular y revertir vía `AllowedActionsToolbar`.
 *
 * `?purchase_document_id=` abre el alta «con documento» ya seleccionado:
 * es el destino de `create_receipt` desde la ficha de un documento de
 * compra confirmado (`DocumentoCompraDetalle`).
 */
const RecepcionesView = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const {
		branchId,
		subsidiaryId,
		authorizedBranchIds,
		items,
		meta,
		loading,
		error,
		search,
		status,
		warehouseId,
		warehouseOptions,
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
	 * Mismo permiso + scope que exige `useStockReceiptForm` al enviar: la ruta
	 * sólo pide `view-product`, así que el alta necesita su propio guard — no basta con ocultar el botón «Nueva recepción», porque
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
	/**
	 * Alta pedida por `?purchase_document_id=` sin poder registrar recepciones.
	 * Vive en estado porque el parámetro se limpia en el acto; cada intento la
	 * vuelve a fijar aunque el aviso se haya cerrado. Si el permiso llega después
	 * con el aviso abierto, abre el alta pedida.
	 *
	 * El ID del documento sólo vale en la filial donde se pidió: los IDs se
	 * repiten entre filiales y el formulario consulta y escribe bajo la filial
	 * vigente. Por eso la intención se descarta al cambiar de filial y, mientras
	 * tanto, sólo cuenta si es de la filial vigente. Pedida con la filial aún sin
	 * resolver (perfil cargando), se adopta la primera que llegue.
	 */
	const [deniedRequest, setDeniedRequest] = useState<IDeniedCreateRequest | null>(null);
	const deniedDocumentId =
		deniedRequest !== null &&
		(deniedRequest.subsidiaryId === null || deniedRequest.subsidiaryId === subsidiaryId)
			? deniedRequest.documentId
			: null;
	const showDeniedCreateNotice = deniedDocumentId !== null && !canWriteReceipts;

	const preselectedDocumentId = searchParams.get('purchase_document_id');
	const requestedDocumentId = preselectedDocumentId ?? deniedDocumentId;

	/**
	 * La ficha recibe la query del listado para que «Volver al listado» la
	 * conserve, sin `purchase_document_id`: volver no debe reabrir el alta
	 * desde la que se acaba de crear la recepción.
	 */
	const handleView = (id: number) => {
		const listParams = new URLSearchParams(location.search);
		listParams.delete('purchase_document_id');
		const listSearch = listParams.toString();
		navigate(`/inventario/abastecimiento/recepciones/${id}`, {
			state: listReturnState(listSearch ? `?${listSearch}` : ''),
		});
	};

	// Quita sólo `purchase_document_id`: los filtros del listado comparten la query.
	const handleCloseCreateModal = (open: boolean) => {
		setIsCreateModalOpen(open);
		if (!open) setDeniedRequest(null);
		if (!open && preselectedDocumentId) {
			setSearchParams(
				(previous) => {
					const next = new URLSearchParams(previous);
					next.delete('purchase_document_id');
					return next;
				},
				{ replace: true },
			);
		}
	};

	useEffect(() => {
		if (deniedRequest === null || deniedRequest.subsidiaryId === subsidiaryId) return;
		if (deniedRequest.subsidiaryId === null) {
			setDeniedRequest({ ...deniedRequest, subsidiaryId });
			return;
		}
		// Si la intención ya había abierto el alta, ese formulario también es de la otra filial.
		if (isCreateModalOpen) handleCloseCreateModal(false);
		setDeniedRequest(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subsidiaryId]);

	useEffect(() => {
		if (!preselectedDocumentId) return;
		if (canWriteReceipts) {
			setIsCreateModalOpen(true);
			return;
		}
		// Sin permiso no se abre el alta: se avisa y se quita el parámetro para
		// que recargar o volver no repita el intento.
		handleCloseCreateModal(false);
		setDeniedRequest({ documentId: preselectedDocumentId, subsidiaryId });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preselectedDocumentId, canWriteReceipts]);

	useEffect(() => {
		if (canWriteReceipts && deniedDocumentId !== null) setIsCreateModalOpen(true);
	}, [canWriteReceipts, deniedDocumentId]);

	/**
	 * Revalida al vuelo: si se pierde `edit-product` o el scope de la
	 * filial/sucursal con el formulario abierto, lo cierra. Sólo con el
	 * formulario abierto: al montar sin permiso no debe descartar el aviso.
	 */
	useEffect(() => {
		if (!canWriteReceipts && isCreateModalOpen) handleCloseCreateModal(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canWriteReceipts, isCreateModalOpen]);

	return (
		<PageWrapper isProtectedRoute title='Recepciones'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroInboxArrowDown'
						title='Recepciones'
						description='Ingresos físicos de mercadería, con o sin documento de compra'
					/>
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
				<ProcurementMockNotice />
				{showDeniedCreateNotice && (
					<Alert
						color='blue'
						variant='outline'
						icon='HeroLockClosed'
						title='No se abrió el registro de recepción'
						role='status'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>
								No tienes permiso para registrar recepciones en esta sucursal.
							</span>
							<Button
								size='sm'
								variant='outline'
								icon='HeroXMark'
								aria-label='Cerrar aviso'
								onClick={() => setDeniedRequest(null)}
							/>
						</div>
					</Alert>
				)}
				<RecepcionesFilters
					search={search}
					onSearchChange={setSearchValue}
					status={status}
					statusOptions={statusOptions}
					onStatusChange={setStatusValue}
					warehouseId={warehouseId}
					warehouseOptions={warehouseOptions}
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

			<StockReceiptFormModal
				isOpen={isCreateModalOpen}
				setIsOpen={handleCloseCreateModal}
				subsidiaryId={subsidiaryId}
				branchId={branchId}
				authorizedBranchIds={authorizedBranchIds}
				receipt={null}
				initialDocumentId={requestedDocumentId ? Number(requestedDocumentId) : undefined}
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
