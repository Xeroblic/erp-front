import { useCallback, useEffect, useState } from 'react';
import { listInitialStockAllocationsForPurchaseDocument } from '@/services/procurement/inventoryStock.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type {
	IApiCollectionEnvelope,
	IInventoryDocumentAllocation,
} from '@/interface/procurement.interface';

/** Uno de los tamaños del paginador estándar; el backend admite hasta 100. */
const DEFAULT_PER_PAGE = 10;

interface IUseInitialStockAllocationsArgs {
	subsidiaryId: number | null;
	documentId: number;
}

/**
 * Respaldos de stock inicial de un documento (`GET P/purchase-documents/
 * {document}/initial-stock-allocations`). Estado local: sólo importan mientras
 * la ficha está abierta.
 *
 * La lista trae únicamente las sucursales a las que el usuario accede, así que
 * su `meta.total` no es el del documento: ese es
 * `related_counts.initial_stock_allocations`, que cuenta toda la filial.
 *
 * El llamador monta el componente con `key` de filial y documento: cambiar de
 * contexto parte de la página 1, y la respuesta tardía del anterior se descarta.
 */
const useInitialStockAllocations = ({
	subsidiaryId,
	documentId,
}: IUseInitialStockAllocationsArgs) => {
	const [response, setResponse] =
		useState<IApiCollectionEnvelope<IInventoryDocumentAllocation> | null>(null);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		if (subsidiaryId === null) return undefined;

		let cancelled = false;
		setLoading(true);
		setError(null);
		listInitialStockAllocationsForPurchaseDocument(subsidiaryId, documentId, {
			page,
			per_page: perPage,
		})
			.then((result) => {
				if (!cancelled) setResponse(result);
			})
			.catch((caught: unknown) => {
				if (cancelled) return;
				setResponse(null);
				setError(
					getProcurementErrorMessage(
						caught,
						'No pudimos cargar las asignaciones de stock inicial.',
					),
				);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, documentId, page, perPage, reloadToken]);

	const paginate = useCallback((nextPage: number, nextPerPage: number) => {
		setPage(nextPage);
		setPerPage(nextPerPage);
	}, []);

	const retry = useCallback(() => setReloadToken((value) => value + 1), []);

	return { response, loading, error, paginate, retry };
};

export default useInitialStockAllocations;
