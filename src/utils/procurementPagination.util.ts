import {
	PROCUREMENT_PER_PAGE_DEFAULT,
	PROCUREMENT_PER_PAGE_MAX,
} from '@/interface/procurement.interface';
import type { IApiPaginationMeta, IProcurementPageParams } from '@/interface/procurement.interface';

/** Un `per_page` fuera de rango es un 422 del backend, así que se acota antes de enviar. */
export const normalizePageParams = (
	params: Partial<IProcurementPageParams> = {},
): IProcurementPageParams => {
	const requestedPage = Number.isFinite(params.page) ? Math.trunc(params.page as number) : 1;
	const requestedPerPage = Number.isFinite(params.per_page)
		? Math.trunc(params.per_page as number)
		: PROCUREMENT_PER_PAGE_DEFAULT;

	return {
		page: Math.max(1, requestedPage),
		per_page: Math.min(PROCUREMENT_PER_PAGE_MAX, Math.max(1, requestedPerPage)),
	};
};

/**
 * `meta.total` es de toda la consulta, no de la página. `null` sin resultados:
 * una lista vacía usa su estado vacío, no «0–0 de 0».
 */
export const describePageRange = (meta: IApiPaginationMeta): string | null => {
	if (meta.total === 0 || meta.from === null || meta.to === null) return null;

	return `${meta.from}–${meta.to} de ${meta.total}`;
};

export const hasNextPage = (meta: IApiPaginationMeta): boolean =>
	meta.current_page < meta.last_page;
