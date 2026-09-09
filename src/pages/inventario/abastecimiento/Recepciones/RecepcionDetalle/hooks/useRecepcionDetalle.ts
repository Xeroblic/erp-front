import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch, useAppSelector } from '@/store';
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
import type {
	IProcurementActorCompact,
	TProcurementAllowedAction,
} from '@/interface/procurement.interface';

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
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const authUser = useAppSelector((state) => state.auth.user);

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
	}

	const goToList = useCallback(
		() => navigate('/inventario/abastecimiento/recepciones'),
		[navigate],
	);

	const retryFetch = useCallback(() => {
		if (id === null) return;
		void dispatch(fetchStockReceiptDetail({ subsidiaryId, id }));
	}, [dispatch, subsidiaryId, id]);

	/** «Quien solicitó contabilizar», nunca un worker anónimo (sección 7). */
	const actor = useMemo<IProcurementActorCompact | null>(() => {
		if (!authUser) return null;
		const name = [authUser.first_name, authUser.last_name].filter(Boolean).join(' ').trim();
		return { id: authUser.id, name: name || authUser.email };
	}, [authUser]);

	const postWrite = useIdempotentWrite({ fallbackMessage: 'No se pudo publicar la recepción.' });
	const retryWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo reintentar la recepción.',
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
		if (result) toast.success('Recepción enviada a publicar. Sigue el estado en la pantalla.');
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
		if (result) toast.success('Recepción reencolada. Sigue el estado en la pantalla.');
	}, [id, actor, retryWrite, dispatch, subsidiaryId]);

	/** Traduce el click de `AllowedActionsToolbar` a la interacción de esta pantalla. */
	const handleAction = useCallback(
		(action: TProcurementAllowedAction) => {
			if (action === 'update') setIsFormModalOpen(true);
			else if (action === 'cancel') setIsCancelModalOpen(true);
			else if (action === 'reverse') setIsReverseModalOpen(true);
			else if (action === 'post') void handlePost();
			else if (action === 'retry') void handleRetry();
		},
		[handlePost, handleRetry],
	);

	return {
		id,
		branchId,
		subsidiaryId,
		visibleBranches,
		receipt,
		etag,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isCancelModalOpen,
		setIsCancelModalOpen,
		isReverseModalOpen,
		setIsReverseModalOpen,
		handleAction,
		goToList,
		retry: retryFetch,
		isPosting: postWrite.isSubmitting,
		isRetrying: retryWrite.isSubmitting,
	};
};

export default useRecepcionDetalle;
