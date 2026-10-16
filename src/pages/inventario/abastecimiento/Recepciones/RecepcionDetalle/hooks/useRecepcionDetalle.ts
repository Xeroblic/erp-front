import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import usePollingWhile from '@/hooks/usePollingWhile';
import { useSubsidiaryRolloutStage } from '@/hooks/useSubsidiaryRolloutStage';
import { useAppDispatch, useAppSelector } from '@/store';
import INVENTORY_RECEIPTS_USE_MOCKS from '@/config/inventoryReceipts.config';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
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
import type {
	IStockReceipt,
	TProcurementAllowedAction,
	TStockReceiptEnteredLocation,
} from '@/interface/procurement.interface';
import { inventarioBodegaLink } from '@/pages/inventario/Inventario/types';
import useReceiptActor from '../../hooks/useReceiptActor';

/**
 * Inventario y Recepciones leen la misma fuente (las dos simuladas o las dos
 * reales). Si no, la ubicación de Inventario no mostraría lo recibido.
 */
const INVENTORY_SHARES_RECEIPTS_SOURCE = INVENTORY_RECEIPTS_USE_MOCKS === INVENTORY_STOCK_USE_MOCKS;

/**
 * Dónde está o estará el stock de la recepción. Contabilizada o revertida, lo
 * dice el backend en `entered_location`: lo decidió la etapa de la filial al
 * contabilizar, no la de hoy. Antes se anticipa con `entersWarehouse`: la
 * etapa 2 ingresa a la bodega de la recepción; la 1, a «Sin ubicación».
 * `null` si ingresó pero la respuesta no dice dónde: no se afirma ninguna
 * ubicación.
 */
export const resolveReceiptStockLocation = (
	receipt: IStockReceipt,
	entersWarehouse: boolean,
): TStockReceiptEnteredLocation | null => {
	if (receipt.status === 'posted' || receipt.status === 'reversed')
		return receipt.entered_location ?? null;
	return entersWarehouse
		? { scope: 'warehouse', warehouse: receipt.warehouse }
		: { scope: 'unlocated', warehouse: null };
};

/**
 * «Ver en inventario» de una recepción ingresada: la ubicación donde entró su
 * stock según `entered_location` — su bodega, o «Sin ubicación». Inventario
 * muestra la sucursal activa, así que sólo se ofrece cuando la recepción es de
 * esa sucursal; si no, lo recibido no aparecería allí.
 */
export const receiptInventoryLink = (
	receipt: IStockReceipt | null,
	branchId: number | null,
	sharesInventorySource = INVENTORY_SHARES_RECEIPTS_SOURCE,
): IPageLink | null => {
	if (receipt?.status !== 'posted' || branchId === null || receipt.branch_id !== branchId)
		return null;
	const enteredLocation = receipt.entered_location ?? null;
	if (!sharesInventorySource || enteredLocation === null) return null;
	return inventarioBodegaLink(
		enteredLocation.scope === 'unlocated' ? null : enteredLocation.warehouse.id,
	);
};

/**
 * Ficha de recepción (sección 7 del contrato). A diferencia del listado, acá
 * viajan `items`, `reason`, `processing` y el `ETag` — la única pantalla del
 * módulo que los necesita, porque editar exige `If-Match` con el `ETag` de
 * esta misma carga.
 *
 * El polling es el corazón de esta card: mientras `current.status ===
 * 'queued'`, `usePollingWhile` vuelve a pedir el detalle con espera creciente
 * (1,5 s → … → 15 s) hasta que el worker resuelva a `posted` o `failed`. A los
 * 2 minutos se rinde y la card ofrece «Actualizar»; con la pestaña oculta no
 * consulta. Se limpia al desmontar, al cambiar de recepción o de filial y en
 * cuanto el estado deja de ser `queued` — nunca sigue pidiendo de más.
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

	/** Recurso que se está mirando: al cambiar, se reinicia todo lo que dependía del anterior. */
	const resourceKey = `${subsidiaryId ?? 'null'}:${id ?? 'null'}`;

	const pollDetail = useCallback(
		() => (id === null ? undefined : dispatch(fetchStockReceiptDetail({ subsidiaryId, id }))),
		[dispatch, subsidiaryId, id],
	);
	const { isExhausted: isPollingStalled, resume: resumePolling } = usePollingWhile({
		active: id !== null && receipt?.status === 'queued',
		poll: pollDetail,
		resetKey: resourceKey,
	});

	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
	const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
	const [isLinkDocumentModalOpen, setIsLinkDocumentModalOpen] = useState(false);

	/**
	 * Cierra los overlays **durante el render**, no en un efecto: un
	 * `useEffect` corre después de pintar, y el primer render tras cambiar de
	 * recepción/filial mostraría el modal abierto con el `receipt`/`etag`
	 * viejos. Ajustar estado en el cuerpo cuando cambia una prop de identidad
	 * hace que React descarte ese render y repinte con el estado corregido.
	 */
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
	 * después del `await`: `postWrite` acá es el objeto del
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
	 * Destinos de las referencias cruzadas de la ficha. Con datos simulados, su
	 * proveedor y su documento salen de la semilla de prueba
	 * (`STOCK_RECEIPTS_USE_TEST_SUPPLIERS`), pero las fichas de Proveedores y
	 * Documentos de compra leen la API real: el mismo id no existe allí, o es
	 * otro registro. En ese caso se dejan como texto.
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

	/**
	 * Antes de contabilizar, la etapa de la filial anticipa dónde ingresará el
	 * stock. El doble ingresa siempre a la bodega de la recepción.
	 */
	const { isMultiLocation } = useSubsidiaryRolloutStage(receipt?.subsidiary_id ?? subsidiaryId);
	const stockLocation = useMemo(
		() =>
			receipt
				? resolveReceiptStockLocation(
						receipt,
						INVENTORY_RECEIPTS_USE_MOCKS || isMultiLocation,
					)
				: null,
		[receipt, isMultiLocation],
	);

	return {
		id,
		branchId,
		subsidiaryId,
		visibleBranches,
		receipt,
		links,
		inventoryLink,
		stockLocation,
		isPollingStalled,
		resumePolling,
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
