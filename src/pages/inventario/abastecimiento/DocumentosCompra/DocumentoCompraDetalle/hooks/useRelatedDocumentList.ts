import { useCallback, useEffect, useState } from 'react';
import type { IApiCollectionEnvelope, IApiPaginationMeta } from '@/interface/procurement.interface';

/**
 * Listas relacionadas paginadas del detalle de documento de compra (sección
 * 6): `stock-receipts` e `initial-stock-allocations`. Recepciones ya tiene
 * datos reales desde la card 05 (hallazgo 9 de la revisión ZF-110); stock
 * inicial sigue vacía — nada la puebla todavía (cards 04/08, ZF-112) — pero
 * pagina de verdad contra el servicio, no un stub que sólo muestre el
 * contador de `related_counts`.
 */

type TRelatedListFetcher<TRow> = (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number },
) => Promise<IApiCollectionEnvelope<TRow>>;

interface IUseRelatedDocumentListArgs<TRow> {
	subsidiaryId: number | null;
	documentId: number | null;
	fetcher: TRelatedListFetcher<TRow>;
}

const PER_PAGE = 10;

const useRelatedDocumentList = <TRow>({
	subsidiaryId,
	documentId,
	fetcher,
}: IUseRelatedDocumentListArgs<TRow>) => {
	const [data, setData] = useState<TRow[]>([]);
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
				if (cancelled) return;
				setData(response.data);
				setMeta(response.meta);
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

	return { data, meta, loading, error, page, onPageChange };
};

export default useRelatedDocumentList;
