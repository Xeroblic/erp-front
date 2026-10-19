import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import type {
	IReplenishmentCandidatesPage,
	IReplenishmentCandidatesParams,
	TReplenishmentStatusCounts,
} from '@/interface/inventoryReports.interface';
import listReplenishmentCandidates from '@/services/procurement/replenishment.service';
import { REPLENISHMENT_STATUSES } from '@/services/reports/inventoryReports.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type {
	IInventoryReportContext,
	IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';
import type { IReportPage } from '@/pages/reportes/inventory-reports/utils';

/** Tope de `search` en el backend: más largo es 422. */
const SEARCH_MAX_LENGTH = 100;

/** Filtros de la URL → parámetros de la petición. Los vacíos no viajan. */
export const replenishmentParamsOf = (
	busqueda: string,
	{ reposicion, page, perPage }: Pick<IInventoryReportFilters, 'reposicion' | 'page' | 'perPage'>,
): IReplenishmentCandidatesParams => {
	const search = busqueda.trim().slice(0, SEARCH_MAX_LENGTH);
	return {
		...(search ? { search } : {}),
		...(reposicion ? { recommendation_status: reposicion } : {}),
		page,
		per_page: perPage,
	};
};

/** Por qué no se pudo leer. Los mensajes de Laravel para 403 llegan en inglés. */
export const replenishmentErrorOf = (error: unknown): string => {
	const { status, message } = resolveProcurementError(
		error,
		'No pudimos cargar los productos por reponer.',
	);
	if (status === 403) return 'No tienes permiso para ver los productos de esta empresa.';
	return message;
};

interface IKeyedResult {
	key: string;
	response: IReplenishmentCandidatesPage | null;
	error: string | null;
}

/**
 * Acciones: qué reponer y a qué proveedor (`GET P/replenishment-candidates`,
 * §13). La búsqueda, el estado y la página viajan al backend, que decide el
 * orden (lo más urgente primero) y los conteos por estado; aquí no se
 * recalcula nada. Cada respuesta queda asociada a la petición que la pidió y
 * una tardía nunca pisa a la vigente.
 */
const useAccionesReport = (context: IInventoryReportContext, filters: IInventoryReportFilters) => {
	const { subsidiaryId, owner } = context;
	const [debouncedSearch] = useDebounce(filters.busqueda, 300);
	const { reposicion, page, perPage } = filters;
	const params = useMemo(
		() => replenishmentParamsOf(debouncedSearch, { reposicion, page, perPage }),
		[debouncedSearch, reposicion, page, perPage],
	);
	const key = `${owner}:${JSON.stringify(params)}`;
	const [result, setResult] = useState<IKeyedResult | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		listReplenishmentCandidates(subsidiaryId, params, controller.signal).then(
			(response) => {
				if (!controller.signal.aborted) setResult({ key, response, error: null });
			},
			(error: unknown) => {
				if (controller.signal.aborted) return;
				setResult({ key, response: null, error: replenishmentErrorOf(error) });
			},
		);
		return () => controller.abort();
	}, [subsidiaryId, params, key, attempt]);

	const current = result?.key === key ? result : null;
	const response = current?.response ?? null;
	// Sin el resultado anterior, el reintento vuelve a mostrar la carga.
	const refresh = useCallback(() => {
		setResult(null);
		setAttempt((value) => value + 1);
	}, []);

	const tablePage = useMemo<IReportPage<IReplenishmentCandidatesPage['rows'][number]>>(
		() =>
			response
				? {
						rows: response.rows,
						page: response.page,
						lastPage: response.lastPage,
						total: response.total,
					}
				: { rows: [], page, lastPage: 1, total: 0 },
		[response, page],
	);
	const statusCounts: TReplenishmentStatusCounts | null = response?.statusCounts ?? null;
	const totalCount = statusCounts
		? REPLENISHMENT_STATUSES.reduce((total, status) => total + statusCounts[status], 0)
		: null;

	return {
		page: tablePage,
		statusCounts,
		/** Todos los estados: la suma de `status_counts`, que ignora el estado elegido. */
		totalCount,
		/** La URL pide una página que ya no existe (p. ej. tras reponer productos). */
		lastPageIfOutOfRange:
			response && response.total > 0 && response.page > response.lastPage
				? response.lastPage
				: null,
		loading: current === null,
		error: current?.error ?? null,
		refresh,
	};
};

export default useAccionesReport;
