import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearPurchaseDocumentCurrent,
	fetchPurchaseDocumentDetail,
	selectPurchaseDocumentCurrent,
	selectPurchaseDocumentCurrentDocumentId,
	selectPurchaseDocumentCurrentEtag,
	selectPurchaseDocumentCurrentError,
	selectPurchaseDocumentCurrentLoading,
	selectPurchaseDocumentCurrentSubsidiaryId,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import INVENTORY_RECEIPTS_USE_MOCKS from '@/config/inventoryReceipts.config';
import { supplierDetailLink } from '@/config/procurementLinks';
import { readListReturnSearch } from '@/utils/listSearchParams.util';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';
import type { IDocumentAttachmentsCardHandle } from '../components/parts/DocumentAttachmentsCard';

type TDocumentModal = 'update' | 'confirm' | 'cancel';

/** Modal abierto y el contexto (filial y documento) en que se abrió. */
interface IOpenModal {
	modal: TDocumentModal;
	subsidiaryId: number | null;
	id: number | null;
}
const useDocumentoCompraDetalle = () => {
	const { documentoId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();

	const storedDocument = useAppSelector(selectPurchaseDocumentCurrent);
	const storedEtag = useAppSelector(selectPurchaseDocumentCurrentEtag);
	const storedLoading = useAppSelector(selectPurchaseDocumentCurrentLoading);
	const storedError = useAppSelector(selectPurchaseDocumentCurrentError);
	const ownerSubsidiaryId = useAppSelector(selectPurchaseDocumentCurrentSubsidiaryId);
	const ownerDocumentId = useAppSelector(selectPurchaseDocumentCurrentDocumentId);

	const parsedId = Number(documentoId);
	const id = documentoId !== undefined && Number.isFinite(parsedId) ? parsedId : null;

	/**
	 * La ficha del store es la de la última carga que resolvió; la nueva recién
	 * sale en el efecto y la limpieza del contexto anterior también ocurre
	 * después del render. Hasta que llegue, lo de otra filial u otro documento
	 * no se muestra: la vista queda en carga.
	 */
	const isCurrentForContext = ownerSubsidiaryId === subsidiaryId && ownerDocumentId === id;
	const document = isCurrentForContext ? storedDocument : null;
	const etag = isCurrentForContext ? storedEtag : null;
	const error = isCurrentForContext ? storedError : null;
	const loading = storedLoading || (id !== null && !isCurrentForContext);

	useEffect(() => {
		if (id === null) return undefined;
		void dispatch(fetchPurchaseDocumentDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearPurchaseDocumentCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	/**
	 * Cada modal queda atado a la filial y al documento en que se abrió. El
	 * router reutiliza esta instancia al pasar de un documento a otro, y la
	 * filial puede cambiar con un modal abierto: en ambos casos el modal se
	 * cierra desde el primer render, en vez de dejar su acción apuntando al
	 * documento o a la filial nuevos.
	 */
	const [openModal, setOpenModal] = useState<IOpenModal | null>(null);
	const activeModal =
		openModal !== null && openModal.subsidiaryId === subsidiaryId && openModal.id === id
			? openModal.modal
			: null;
	// Fuera de su contexto se descarta, para que volver a él no lo reabra.
	if (openModal !== null && activeModal === null) setOpenModal(null);
	const setModalOpen = useCallback(
		(modal: TDocumentModal, open: boolean) =>
			setOpenModal(open ? { modal, subsidiaryId, id } : null),
		[subsidiaryId, id],
	);
	const setIsFormModalOpen = useCallback(
		(open: boolean) => setModalOpen('update', open),
		[setModalOpen],
	);
	const setIsConfirmModalOpen = useCallback(
		(open: boolean) => setModalOpen('confirm', open),
		[setModalOpen],
	);
	const setIsCancelModalOpen = useCallback(
		(open: boolean) => setModalOpen('cancel', open),
		[setModalOpen],
	);

	// Si se llegó desde el listado, vuelve a él con los mismos filtros y página.
	const listSearch = readListReturnSearch(location.state);
	const goToList = useCallback(
		() => navigate(`/inventario/abastecimiento/documentos-compra${listSearch}`),
		[navigate, listSearch],
	);

	const retry = useCallback(() => {
		if (id === null) return;
		void dispatch(fetchPurchaseDocumentDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	/**
	 * El botón «Adjuntar» de `AllowedActionsToolbar` no abre un modal propio:
	 * `DocumentAttachmentsCard` ya vive siempre visible en el detalle, así que
	 * la acción sólo enfoca su selector de archivos vía este ref.
	 */
	const attachmentsCardRef = useRef<IDocumentAttachmentsCardHandle>(null);

	/**
	 * Con Recepciones en datos simulados, `create_receipt` se retira aunque el
	 * backend la ofrezca: el doble sólo reconoce los documentos de su semilla.
	 * La vista lo avisa con `isReceiptDeferred`.
	 */
	const allowedActions = useMemo(
		() =>
			(document?.allowed_actions ?? []).filter(
				(action) => !INVENTORY_RECEIPTS_USE_MOCKS || action !== 'create_receipt',
			),
		[document],
	);
	const isReceiptDeferred =
		INVENTORY_RECEIPTS_USE_MOCKS &&
		(document?.allowed_actions ?? []).includes('create_receipt');

	/** Documento y proveedor salen de la API real: su ficha siempre existe. */
	const supplierLink = useMemo(
		() => (document?.supplier ? supplierDetailLink(document.supplier.id) : null),
		[document],
	);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update' || action === 'confirm' || action === 'cancel')
				setModalOpen(action, true);
			else if (action === 'add_attachment') attachmentsCardRef.current?.openFilePicker();
			// El listado de Recepciones abre el alta con este documento elegido.
			else if (action === 'create_receipt' && id !== null)
				navigate(`/inventario/abastecimiento/recepciones?purchase_document_id=${id}`);
		},
		[setModalOpen, id, navigate],
	);

	return {
		id,
		branchId,
		subsidiaryId,
		document,
		etag,
		loading,
		error,
		isFormModalOpen: activeModal === 'update',
		setIsFormModalOpen,
		isConfirmModalOpen: activeModal === 'confirm',
		setIsConfirmModalOpen,
		isCancelModalOpen: activeModal === 'cancel',
		setIsCancelModalOpen,
		allowedActions,
		isReceiptDeferred,
		supplierLink,
		attachmentsCardRef,
		handleAction,
		goToList,
		retry,
	};
};

export default useDocumentoCompraDetalle;
