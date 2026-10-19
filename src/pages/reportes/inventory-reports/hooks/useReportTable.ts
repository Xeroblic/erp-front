import { useMemo } from 'react';
import type { IInventoryReportFilters } from '@/pages/reportes/inventory-reports/types';
import {
	paginateReportRows,
	searchReportRows,
	sortReportRows,
	type TReportSortValue,
} from '@/pages/reportes/inventory-reports/utils';

export interface IReportTableConfig<T> {
	/** Claves de columna ordenables; un `?orden=` fuera de la lista se ignora. */
	fields: readonly string[];
	valueOf: (row: T, field: string) => TReportSortValue;
	/** Textos donde busca `q`; sin esto la tabla no se busca. */
	textsOf?: (row: T) => string[];
}

/**
 * Búsqueda, filtro, orden y página de un reporte ya cargado completo.
 * `config` y `filter` deben ser estables (módulo o `useCallback`).
 */
const useReportTable = <T>(
	rows: T[] | null,
	filters: IInventoryReportFilters,
	config: IReportTableConfig<T>,
	filter?: (row: T) => boolean,
) => {
	const { orden, busqueda, page, perPage } = filters;
	const sort = orden && config.fields.includes(orden.field) ? orden : null;

	const visible = useMemo(() => {
		let list = rows ?? [];
		if (filter) list = list.filter(filter);
		if (config.textsOf) list = searchReportRows(list, busqueda, config.textsOf);
		return sortReportRows(list, sort, config.valueOf);
	}, [rows, filter, config, busqueda, sort]);

	const current = useMemo(
		() => paginateReportRows(visible, page, perPage),
		[visible, page, perPage],
	);

	/** `visible`: todas las filas filtradas y ordenadas (lo que se exporta). */
	return { sort, visible, page: current };
};

export default useReportTable;
