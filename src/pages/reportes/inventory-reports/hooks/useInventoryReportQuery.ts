import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryReport,
	inventoryReportQueryKey,
} from '@/store/slices/reports/reportsThunks';
import type { IInventoryReportQuery } from '@/services/reports/inventoryReports.service';

/**
 * Carga un reporte completo y lo expone sólo si la respuesta es de esta
 * instancia (ZF-12): la clave incluye filial, sucursal, fuente y una marca de
 * sesión, así un cambio de contexto nunca pinta filas del anterior.
 *
 * `query` debe venir memoizada; `null` no pide nada (tipo aún no resuelto).
 */
const useInventoryReportQuery = (query: IInventoryReportQuery | null, owner: string) => {
	const session = useId();
	const dispatch = useAppDispatch();
	const [retry, setRetry] = useState(0);
	const ownerContext = `${owner}:${session}`;
	const request = useMemo(
		() => (query ? { ...query, ownerContext } : null),
		[query, ownerContext],
	);
	const slot = useAppSelector((root) => (query ? root.reports.inventory[query.type] : undefined));

	useEffect(() => {
		if (!request) return undefined;
		const promise = dispatch(fetchInventoryReport(request));
		return () => {
			promise.abort();
		};
	}, [dispatch, request, retry]);

	const isCurrent =
		request !== null &&
		slot !== undefined &&
		slot.ownerContext === inventoryReportQueryKey(request);
	const refresh = useCallback(() => setRetry((value) => value + 1), []);

	return {
		result: isCurrent ? slot.result : null,
		loading: !isCurrent || slot.loading,
		error: isCurrent ? slot.error : null,
		refresh,
	};
};

export default useInventoryReportQuery;
