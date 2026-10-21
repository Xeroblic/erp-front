import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import { hasCollectionEmail } from '../utils';

interface UseCustomerCollectionEmailParams {
	customerSaleId: number | null;
	subsidiaryId: number | null;
}

interface CollectionEmailState {
	identity: string;
	hasEmail: boolean;
}

/**
 * Resuelve si el cliente tiene correo de cobranza consultando su perfil de crédito: el
 * documento de pago diferido no lo trae. Un error de carga no se informa como "sin correo",
 * porque la advertencia sólo debe aparecer cuando se sabe que falta.
 */
const useCustomerCollectionEmail = ({
	customerSaleId,
	subsidiaryId,
}: UseCustomerCollectionEmailParams) => {
	const identity =
		customerSaleId === null || subsidiaryId === null
			? null
			: `${subsidiaryId}:${customerSaleId}`;
	const [state, setState] = useState<CollectionEmailState | null>(null);
	const requestIdRef = useRef(0);
	const controllerRef = useRef<AbortController | null>(null);

	const reload = useCallback(async () => {
		controllerRef.current?.abort();
		controllerRef.current = null;
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		if (identity === null || customerSaleId === null || subsidiaryId === null) return;

		const controller = new AbortController();
		controllerRef.current = controller;
		try {
			const profile = await deferredPaymentsService.getCreditProfile(
				subsidiaryId,
				customerSaleId,
				controller.signal,
			);
			if (requestId !== requestIdRef.current) return;
			setState({ identity, hasEmail: hasCollectionEmail(profile.collection_email) });
		} catch {
			if (requestId !== requestIdRef.current) return;
			setState(null);
		} finally {
			if (requestId === requestIdRef.current) controllerRef.current = null;
		}
	}, [customerSaleId, identity, subsidiaryId]);

	useEffect(() => {
		reload().catch(() => undefined);
		return () => {
			controllerRef.current?.abort();
			controllerRef.current = null;
			requestIdRef.current += 1;
		};
	}, [reload]);

	const isMissing = state !== null && state.identity === identity && !state.hasEmail;

	return useMemo(() => ({ isMissing, reload }), [isMissing, reload]);
};

export default useCustomerCollectionEmail;
