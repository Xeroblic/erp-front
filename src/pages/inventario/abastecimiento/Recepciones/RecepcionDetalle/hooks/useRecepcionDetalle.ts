import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch, useAppSelector } from '@/store';
import { STOCK_RECEIPTS_USE_TEST_SUPPLIERS } from '@/services/procurement/stockReceipts.service';
import {
	clearStockReceiptCurrent,
	fetchStockReceiptDetail,
	postStockReceiptThunk,
	retryStockReceiptThunk,
	selectStockReceiptCurrent,
	selectStockReceiptCurrentEtag,
	selectStockReceiptCurrentError,
	selectStockReceiptCurrentLoading,
} from '@/store/slices/procurement/stockReceiptsSlice';
import { readListReturnSearch } from '@/utils/listSearchParams.util';
import {
	purchaseDocumentDetailLink,
	supplierDetailLink,
	type IPageLink,
} from '@/config/procurementLinks';
import type { IStockReceipt, TProcurementAllowedAction } from '@/interface/procurement.interface';
import { inventarioBodegaLink } from '@/pages/inventario/Inventario/types';
import useReceiptActor from '../../hooks/useReceiptActor';

/**
 * «Ver en inventario» de una recepción ingresada: la ficha de su bodega.
 * Inventario muestra la sucursal activa, así que sólo se ofrece cuando la
 * recepción es de esa sucursal; si no, la bodega no aparecería allí.
 */
export const receiptInventoryLink = (
	receipt: IStockReceipt | null,
	branchId: number | null,
): IPageLink | null =>
	receipt?.status === 'posted' && branchId !== null && receipt.branch_id === branchId
		? inventarioBodegaLink(receipt.warehouse.id)
		: null;

/** Cada cuánto se vuelve a pedir el detalle mientras está `queued` (polling). */
const POLLING_INTERVAL_MS = 1500;

/**
 * Ficha de recepción (sección 7 del contrato). A diferencia del listado, acá
 * viajan `items`, `reason`, `processing` y el `ETag` — la única pantalla del
 * módulo que los necesita, porque editar exige `If-Match` con el `ETag` de
 * esta misma carga.
 *
 * El polling es el corazón de esta card: mientras `current.status ===
 * 'queued'`, un intervalo vuelve a pedir el detalle hasta que el worker
 * simulado del mock resuelva a `posted` o `failed`. Se limpia al desmontar,
 * al cambiar de recepción y en cuanto el estado deja de ser `queued` — nunca
 * sigue pidiendo de más.
 */
const useRecepcionDetalle = () => {
	const { recepcionId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const actor = useReceiptActor();

	const receipt = useAppSelector(selectStockReceiptCurrent);
	const etag = useAppSelector(selectStockReceiptCurrentEtag);
	const loading = useAppSelector(selectStockReceiptCurrentLoading);
	const error = useAppSelector(selectStockReceiptCurrentError);

	const parsedId = Number(recepcionId);
	const id = recepcionId !== undefined && Number.isFinite(parsedId) ? parsedId : null;

	useEffect(() => {
		if (id === null) return undefined;
		void dispatch(fetchStockReceiptDetail({ subsidiaryId, id }));
		return () => {
			dispatch(clearStockReceiptCurrent());
		};
	}, [dispatch, subsidiaryId, id]);

	useEffect(() => {
		if (id === null || receipt?.status !== 'queued') return undefined;

		const interval = setInterval(() => {
			void dispatch(fetchStockReceiptDetail({ subsidiaryId, id }));
		}, POLLING_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [dispatch, subsidiaryId, id, receipt?.status]);

	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
	const [isLinkDocumentModalOpen, setIsLinkDocumentModalOpen] = useState(false);

	/**
	 * Cierra los overlays **durante el render**, no en un efecto posterior
	 * (hallazgo 3): un `useEffect` corre después de pintar, así que el primer
	 * render tras cambiar de recepción/filial alcanzaba a mostrar el modal
	 * abierto todavía con el `receipt`/`etag` viejos antes de que el efecto lo
	 * cerrara. Ajustar estado en el cuerpo del componente cuando cambia una
	 * prop de identidad es un patrón soportado por React: si el valor difiere
	 * del último render, React descarta ese render y vuelve a renderizar con
	 * el estado ya corregido antes de pintar — nunca llega a verse el frame
	 * intermedio.
	 */
	const resourceKey = `${subsidiaryId ?? 'null'}:${id ?? 'null'}`;
	const lastResourceKeyRef = useRef(resourceKey);
	if (lastResourceKeyRef.current !== resourceKey) {
		lastResourceKeyRef.current = resourceKey;
		if (isFormModalOpen) setIsFormModalOpen(false);
		if (isCancelModalOpen) setIsCancelModalOpen(false);
		if (isReverseModalOpen) setIsReverseModalOpen(false);
		if (isLinkDocumentModalOpen) setIsLinkDocumentModalOpen(false);
	}

	// Si se llegó desde el listado, vuelve a él con los mismos filtros y página.
	const listSearch = readListReturnSearch(location.state);
	const goToList = useCallback(
		() => navigate(`/inventario/abastecimiento/recepciones${listSearch}`),
		[navigate, listSearch],
	);

	const retryFetch = useCallback(() => {
		if (id === null) return;
		void dispatch(fetchStockReceiptDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	const postWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo ingresar la recepción al stock.',
	});
	const retryWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo reintentar el ingreso al stock.',
	});

	/**
	 * El error se muestra desde `onError`, no releyendo `postWrite.error`
	 * después del `await` (hallazgo 7): `postWrite` acá es el objeto del
	 * render en que se creó este `handlePost` — un cierre cerrado antes de
	 * que la escritura terminara —, así que su `.error` nunca refleja el
	 * fallo que esa misma llamada acaba de producir. `onError` entrega el
	 * resuelto en el mismo `catch` que lo fija, sin ese desfase.
	 */
	const handlePost = useCallback(async () => {
		if (id === null || !actor) return;
		const result = await postWrite.submit(
			(headers) =>
				dispatch(
					postStockReceiptThunk({
						subsidiaryId,
						id,
						actor,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			{ onError: (writeError) => toast.error(writeError.message) },
		);
		if (result) toast.success('Ingresando al stock. Esta pantalla se actualiza sola.');
	}, [id, actor, postWrite, dispatch, subsidiaryId]);

	const handleRetry = useCallback(async () => {
		if (id === null || !actor) return;
		const result = await retryWrite.submit(
			(headers) =>
				dispatch(
					retryStockReceiptThunk({
						subsidiaryId,
						id,
						actor,
						headers: { idempotencyKey: headers['Idempotency-Key'] },
					}),
				).unwrap(),
			{ onError: (writeError) => toast.error(writeError.message) },
		);
		if (result)
			toast.success('Reintentando el ingreso al stock. Esta pantalla se actualiza sola.');
	}, [id, actor, retryWrite, dispatch, subsidiaryId]);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update') setIsFormModalOpen(true);
			else if (action === 'cancel') setIsCancelModalOpen(true);
			else if (action === 'reverse') setIsReverseModalOpen(true);
			else if (action === 'link_purchase_document') setIsLinkDocumentModalOpen(true);
			else if (action === 'post') void handlePost();
			else if (action === 'retry') void handleRetry();
		},
		[handlePost, handleRetry],
	);

	/**
	 * Destinos de las referencias cruzadas de la ficha. Mientras Recepciones
	 * sea simulada, su proveedor y su documento salen de la semilla de prueba
	 * (`STOCK_RECEIPTS_USE_TEST_SUPPLIERS`), pero las fichas de Proveedores y
	 * Documentos de compra leen la API real: el mismo id no existe allí, o es
	 * otro registro. Hasta que Recepciones tenga backend se dejan como texto.
	 */
	const links = useMemo<{ supplier: IPageLink | null; document: IPageLink | null }>(() => {
		if (STOCK_RECEIPTS_USE_TEST_SUPPLIERS || !receipt)
			return { supplier: null, document: null };
		return {
			supplier: receipt.supplier ? supplierDetailLink(receipt.supplier.id) : null,
			document: receipt.purchase_document
				? purchaseDocumentDetailLink(receipt.purchase_document.id)
				: null,
		};
	}, [receipt]);

	const inventoryLink = useMemo(
		() => receiptInventoryLink(receipt, branchId),
		[receipt, branchId],
	);

	return {
		id,
		branchId,
		subsidiaryId,
		visibleBranches,
		receipt,
		links,
		inventoryLink,
		etag,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isCancelModalOpen,
		setIsCancelModalOpen,
		isReverseModalOpen,
		setIsReverseModalOpen,
		isLinkDocumentModalOpen,
		setIsLinkDocumentModalOpen,
		handleAction,
		goToList,
		retry: retryFetch,
		isPosting: postWrite.isSubmitting,
		isRetrying: retryWrite.isSubmitting,
	};
};

export default useRecepcionDetalle;
