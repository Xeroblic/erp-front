import { useCallback, useEffect, useState } from 'react';
import type { IApiCollectionEnvelope, IApiPaginationMeta } from '@/interface/procurement.interface';

/**
 * Listas relacionadas paginadas del detalle de documento de compra (sección
 * 6): `stock-receipts` e `initial-stock-allocations`. Siempre vacías en el
 * mock — nada las puebla todavía (cards 04/05) — pero pagina de verdad
 * contra el servicio, no un stub que sólo muestre el contador de
 * `related_counts`.
 */

type TRelatedListFetcher = (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number },
) => Promise<IApiCollectionEnvelope<never>>;

interface IUseRelatedDocumentListArgs {
	subsidiaryId: number | null;
	documentId: number | null;
	fetcher: TRelatedListFetcher;
}

const PER_PAGE = 10;

const useRelatedDocumentList = ({
	subsidiaryId,
	documentId,
	fetcher,
}: IUseRelatedDocumentListArgs) => {
	const [meta, setMeta] = useState<IApiPaginationMeta | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	// Un documento nuevo empieza en la página 1: sin esto, navegar de un
	// documento con varias páginas a otro conservaría la página vieja y
	// pediría una que puede no existir para el nuevo.
	useEffect(() => {
		setPage(1);
	}, [subsidiaryId, documentId]);

	useEffect(() => {
		if (subsidiaryId === null || documentId === null) return undefined;

		let cancelled = false;
		setLoading(true);
		setError(null);
		fetcher(subsidiaryId, documentId, { page, per_page: PER_PAGE })
			.then((response) => {
				if (!cancelled) setMeta(response.meta);
			})
			.catch(() => {
				if (!cancelled) setError('No se pudo cargar el listado.');
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, documentId, page, fetcher]);

	const onPageChange = useCallback((nextPage: number) => setPage(nextPage), []);

	return { meta, loading, error, page, onPageChange };
};

export default useRelatedDocumentList;
