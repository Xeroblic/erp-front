import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TInventoryStockStatusFilter } from '@/interface/inventoryOverview.interface';
import type { TInventoryReportView } from '@/pages/reportes/inventory-reports/inventoryReportTabs';
import {
	nextInventoryReportSort,
	parseInventoryReportFilters,
	serializeInventoryReportFilters,
	type IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';

/**
 * Filtros de Reportes › Inventario sincronizados con la URL
 * (`?vista&q&sucursal&estado&orden&page&per_page`), con el mismo criterio que
 * `useInventarioFiltros`: un enlace copiado abre exactamente el mismo reporte
 * y «atrás» deshace un filtro. No son un formulario que se envía, así que no
 * usan Formik.
 *
 * Cualquier cambio de filtro vuelve a la página 1; sólo paginar la conserva.
 */
const useInventoryReportFilters = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const filters = useMemo(() => parseInventoryReportFilters(searchParams), [searchParams]);

	const update = useCallback(
		(patch: (previous: IInventoryReportFilters) => Partial<IInventoryReportFilters>) => {
			setSearchParams(
				(previousParams) => {
					const previous = parseInventoryReportFilters(previousParams);
					return serializeInventoryReportFilters({
						...previous,
						page: 1,
						...patch(previous),
					});
				},
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	// Cada pestaña tiene otras columnas: el orden de la anterior no aplica, y
	// el estado sólo filtra Umbrales.
	const setVista = useCallback(
		(vista: TInventoryReportView) =>
			update((previous) => ({
				vista,
				orden: null,
				estado: vista === 'umbrales' ? previous.estado : null,
			})),
		[update],
	);
	const setBusqueda = useCallback((busqueda: string) => update(() => ({ busqueda })), [update]);
	const setSucursal = useCallback(
		(sucursal: number | null) => update(() => ({ sucursal })),
		[update],
	);
	const setEstado = useCallback(
		(estado: TInventoryStockStatusFilter | null) => update(() => ({ estado })),
		[update],
	);
	const setOrden = useCallback(
		(field: string) =>
			update((previous) => ({ orden: nextInventoryReportSort(previous.orden, field) })),
		[update],
	);
	const paginate = useCallback(
		(page: number, perPage: number) => update(() => ({ page, perPage })),
		[update],
	);
	const limpiar = useCallback(
		() => update(() => ({ busqueda: '', sucursal: null, estado: null, orden: null })),
		[update],
	);

	const hasFilters =
		filters.busqueda.trim() !== '' || filters.sucursal !== null || filters.estado !== null;

	return {
		filters,
		hasFilters,
		setVista,
		setBusqueda,
		setSucursal,
		setEstado,
		setOrden,
		paginate,
		limpiar,
	};
};

export type TInventoryReportFiltersApi = ReturnType<typeof useInventoryReportFilters>;

export default useInventoryReportFilters;
