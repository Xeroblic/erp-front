import ApiService from '@/services/ApiService';

interface SeriesPage {
	data?: unknown[];
	meta?: Record<string, unknown>;
	/** Presente (sin `data`) cuando el producto no usa seguimiento por series. */
	message?: string;
}

/**
 * El backend dimensiona la respuesta por `product_id`:
 * - Producto padre → devuelve TODAS las series (todas las variantes/grados).
 * - Producto hijo  → devuelve las series de ese grado.
 * - Sin seguimiento por series → `{ message: 'El producto no utiliza seguimiento por series.' }`
 *   (sin `data`), que `readRows` interpreta como lista vacía.
 * Por eso basta con pedir el id del padre para obtener todo el árbol.
 */
const PER_PAGE = 1000;

/** Las series de un producto cambian poco; cacheamos para reabrir la tab al instante. */
const SERIES_CACHE_TTL = 60_000;

const buildUrl = (subsidiaryId: number, productId: number): string =>
	`/subsidiaries/${subsidiaryId}/products/${productId}/series`;

const readRows = (body: SeriesPage | undefined): unknown[] =>
	Array.isArray(body?.data) ? body.data : [];

const readLastPage = (body: SeriesPage | undefined): number => {
	const raw = Number(body?.meta?.last_page ?? 1);
	return Number.isFinite(raw) && raw > 0 ? raw : 1;
};

export const fetchAllProductSeries = async (
	subsidiaryId: number,
	productId: number,
): Promise<unknown[]> => {
	const first = await ApiService.fetchData<SeriesPage>({
		url: buildUrl(subsidiaryId, productId),
		method: 'get',
		params: { per_page: PER_PAGE, page: 1 },
		cacheTTLms: SERIES_CACHE_TTL,
		dedupe: true,
	});

	const rows = [...readRows(first.data)];
	const lastPage = readLastPage(first.data);

	if (lastPage > 1) {
		const rest = await Promise.all(
			Array.from({ length: lastPage - 1 }, (_, index) =>
				ApiService.fetchData<SeriesPage>({
					url: buildUrl(subsidiaryId, productId),
					method: 'get',
					params: { per_page: PER_PAGE, page: index + 2 },
					cacheTTLms: SERIES_CACHE_TTL,
					dedupe: true,
				}),
			),
		);
		rest.forEach((response) => rows.push(...readRows(response.data)));
	}

	return rows;
};
