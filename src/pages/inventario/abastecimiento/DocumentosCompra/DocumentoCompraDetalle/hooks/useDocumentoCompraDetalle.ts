import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearPurchaseDocumentCurrent,
	fetchPurchaseDocumentDetail,
	selectPurchaseDocumentCurrent,
	selectPurchaseDocumentCurrentEtag,
	selectPurchaseDocumentCurrentError,
	selectPurchaseDocumentCurrentLoading,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';

/**
 * Ficha de documento de compra (sección 6 del contrato). A diferencia del
 * listado, acá viajan `items`, `supplier_snapshot`, `related_counts` y el
 * `ETag` — la única pantalla del módulo que los necesita, porque editar
 * exige `If-Match` con el `ETag` de esta misma carga.
 */
const useDocumentoCompraDetalle = () => {
	const { documentoId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();

	const document = useAppSelector(selectPurchaseDocumentCurrent);
	const etag = useAppSelector(selectPurchaseDocumentCurrentEtag);
	const loading = useAppSelector(selectPurchaseDocumentCurrentLoading);
	const error = useAppSelector(selectPurchaseDocumentCurrentError);

	const parsedId = Number(documentoId);
	const id = documentoId !== undefined && Number.isFinite(parsedId) ? parsedId : null;

	useEffect(() => {
		if (id === null) return undefined;
		void dispatch(fetchPurchaseDocumentDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearPurchaseDocumentCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

	/**
	 * El router reutiliza esta instancia del componente al navegar de un
	 * documento a otro (mismo `:documentoId` en la ruta): sin esto, un modal
	 * abierto para el documento anterior seguiría abierto — y su acción
	 * seguiría apuntando al documento nuevo que acaba de cargar `current`.
	 */
	useEffect(() => {
		setIsFormModalOpen(false);
		setIsConfirmModalOpen(false);
		setIsCancelModalOpen(false);
	}, [id, subsidiaryId]);

	const goToList = useCallback(
		() => navigate('/inventario/abastecimiento/documentos-compra'),
		[navigate],
	);

	const retry = useCallback(() => {
		if (id === null) return;
		void dispatch(fetchPurchaseDocumentDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback((action: TProcurementAllowedAction) => {
		if (action === 'update') setIsFormModalOpen(true);
		else if (action === 'confirm') setIsConfirmModalOpen(true);
		else if (action === 'cancel') setIsCancelModalOpen(true);
	}, []);

	return {
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
	};
};

export default useDocumentoCompraDetalle;
