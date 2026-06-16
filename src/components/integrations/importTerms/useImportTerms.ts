/**
 * Hook de ciclo de vida para la importación de términos (categorías/marcas)
 * desde WooCommerce.
 *
 *   #1 lanza el job (`runImportTerms`) → obtiene `batch_id`
 *   #2 hace polling del progreso (`pollImportTermsStatus`) cada ~2 s
 *
 * Maneja la anti-concurrencia (no se puede relanzar mientras un lote corre),
 * deriva el progreso y limpia el intervalo al desmontar / cerrar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	runImportTerms,
	pollImportTermsStatus,
	clearImportStatus,
} from '@/store/slices/integrations/woocommerceProductsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { WooTaxonomy } from '@/types/integrations.types';

const POLL_INTERVAL_MS = 2000;

export type ImportTermsPhase = 'idle' | 'launching' | 'polling' | 'finished' | 'failed';

interface UseImportTermsOptions {
	/** Se invoca cuando el lote termina con éxito (p. ej. para refrescar la lista). */
	onCompleted?: () => void;
}

interface UseImportTermsResult {
	phase: ImportTermsPhase;
	/** true mientras se lanza o se hace polling (bloquea relanzar). */
	isRunning: boolean;
	/** Progreso 0-100 derivado del estado del lote. */
	progress: number;
	processed: number;
	total: number;
	error: string | null;
	/** ¿Hay contexto de subsidiaria para poder importar? */
	canImport: boolean;
	subsidiaryId: number | null;
	launch: (taxonomies: WooTaxonomy[]) => Promise<void>;
	reset: () => void;
}

export const useImportTerms = (options: UseImportTermsOptions = {}): UseImportTermsResult => {
	const { onCompleted } = options;
	const dispatch = useAppDispatch();
	const { subsidiaryId, branchId } = useCurrentBranch();

	const importStatus = useAppSelector((state) => state.woocommerceProducts.importStatus);
	const error = useAppSelector((state) => state.woocommerceProducts.error);

	const [phase, setPhase] = useState<ImportTermsPhase>('idle');
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	// Evita closures obsoletos del callback dentro del polling.
	const onCompletedRef = useRef(onCompleted);
	onCompletedRef.current = onCompleted;

	const stopPolling = useCallback(() => {
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	// Limpieza al desmontar.
	useEffect(() => () => stopPolling(), [stopPolling]);

	const startPolling = useCallback(
		(batchId: string) => {
			if (!subsidiaryId) return;
			stopPolling();

			const tick = async () => {
				try {
					const status = await dispatch(
						pollImportTermsStatus({ subsidiaryId, params: { batch_id: batchId } }),
					).unwrap();

					// Laravel marca el batch como `cancelled` cuando un job lanza
					// una excepción (allowFailures=false), así que lo tratamos como fallo.
					const hasFailures = status.failed_jobs > 0 || status.cancelled;
					const noneProcessed = status.processed_jobs === 0;

					if ((status.cancelled || status.finished) && hasFailures && noneProcessed) {
						stopPolling();
						setPhase('failed');
						toast.error(
							'La importación falló: el proceso del servidor terminó con error. Revisa los logs del backend (jobs fallidos).',
						);
					} else if (status.finished || status.cancelled) {
						stopPolling();
						setPhase('finished');
						toast.success(
							hasFailures
								? 'Importación completada con algunos errores'
								: 'Importación de términos completada',
						);
						onCompletedRef.current?.();
					}
				} catch {
					// Errores transitorios de red: el siguiente tick reintenta.
				}
			};

			void tick();
			intervalRef.current = setInterval(() => {
				void tick();
			}, POLL_INTERVAL_MS);
		},
		[dispatch, stopPolling, subsidiaryId],
	);

	const launch = useCallback(
		async (taxonomies: WooTaxonomy[]) => {
			if (!subsidiaryId) {
				toast.error('No hay una subsidiaria activa para importar');
				return;
			}
			if (taxonomies.length === 0) {
				toast.error('Selecciona al menos una taxonomía a importar');
				return;
			}

			setPhase('launching');
			try {
				const response = await dispatch(
					runImportTerms({
						subsidiaryId,
						payload: { taxonomies, branch_id: branchId ?? undefined },
					}),
				).unwrap();

				const batchId = response.batch_id ?? null;
				if (!batchId) {
					// El backend no devolvió lote: no podemos hacer polling.
					setPhase('finished');
					toast.info('Importación encolada. Se procesará en segundo plano.');
					onCompletedRef.current?.();
					return;
				}

				setPhase('polling');
				startPolling(batchId);
			} catch (launchError) {
				setPhase('failed');
				toast.error(
					typeof launchError === 'string'
						? launchError
						: 'No se pudo iniciar la importación de términos',
				);
			}
		},
		[branchId, dispatch, startPolling, subsidiaryId],
	);

	const reset = useCallback(() => {
		stopPolling();
		setPhase('idle');
		dispatch(clearImportStatus());
	}, [dispatch, stopPolling]);

	const total = importStatus?.total_jobs ?? 0;
	const processed = importStatus?.processed_jobs ?? 0;
	const progress =
		importStatus?.progress ??
		(total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0);

	return {
		phase,
		isRunning: phase === 'launching' || phase === 'polling',
		progress,
		processed,
		total,
		error,
		canImport: subsidiaryId !== null,
		subsidiaryId,
		launch,
		reset,
	};
};
