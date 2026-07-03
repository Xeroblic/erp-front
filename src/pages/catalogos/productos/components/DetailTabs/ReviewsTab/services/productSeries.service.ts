import ApiService from '@/services/ApiService';

interface SeriesPage {
	data?: unknown[];
	meta?: Record<string, unknown>;
}

const PER_PAGE = 200;

const buildUrl = (subsidiaryId: number, productId: number): string =>
	`/subsidiaries/${subsidiaryId}/products/${productId}/series`;

const readRows = (body: SeriesPage | undefined): unknown[] =>
	Array.isArray(body?.data) ? body.data : [];

const readLastPage = (body: SeriesPage | undefined): number => {
	const raw = Number(body?.meta?.last_page ?? 1);
	return Number.isFinite(raw) && raw > 0 ? raw : 1;
};

/**
 * Trae todas las series de un producto recorriendo la paginación del backend
 * (el endpoint pagina y sin esto sólo devuelve la primera página).
 */
export const fetchAllProductSeries = async (
	subsidiaryId: number,
	productId: number,
): Promise<unknown[]> => {
	const first = await ApiService.fetchData<SeriesPage>({
		url: buildUrl(subsidiaryId, productId),
		method: 'get',
		params: { per_page: PER_PAGE, page: 1 },
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
				}),
			),
		);
		rest.forEach((response) => rows.push(...readRows(response.data)));
	}

	return rows;
};
