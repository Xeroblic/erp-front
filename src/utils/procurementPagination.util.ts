import {
	PROCUREMENT_PER_PAGE_DEFAULT,
	PROCUREMENT_PER_PAGE_MAX,
} from '@/interface/procurement.interface';
import type { IApiPaginationMeta, IProcurementPageParams } from '@/interface/procurement.interface';

/**
 * Paginación del contrato de abastecimiento (sección 1 del `frontend-guide.md`).
 *
 * `page` / `per_page`, defecto 15, máximo 100. Un `per_page` fuera de rango es un
 * 422 del backend, así que se acota antes de enviar.
 *
 * Los contadores y totales de `meta` son de toda la consulta autorizada, no de la
 * página: `meta.total` de un listado de stock cuenta productos, no unidades, y no
 * se puede derivar sumando la página visible.
 */

/** Acota `per_page` al rango del contrato y `page` a enteros positivos. */
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
 * Rango legible de la página actual, con el total de **toda la consulta**.
 * Devuelve `null` cuando la consulta no arrojó resultados: una lista vacía se
 * presenta con su estado vacío, no con «0–0 de 0».
 */
export const describePageRange = (meta: IApiPaginationMeta): string | null => {
	if (meta.total === 0 || meta.from === null || meta.to === null) return null;

	return `${meta.from}–${meta.to} de ${meta.total}`;
};

export const hasNextPage = (meta: IApiPaginationMeta): boolean =>
	meta.current_page < meta.last_page;

export const hasPreviousPage = (meta: IApiPaginationMeta): boolean => meta.current_page > 1;
