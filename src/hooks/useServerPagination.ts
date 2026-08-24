/**
 * Hook personalizado para manejar paginación server-side
 *
 * Simplifica la implementación de paginación server-side
 * encapsulando la lógica común de paginación y filtros.
 */

import { useState, useCallback, useEffect } from 'react';
import { PaginationState } from '@tanstack/react-table';

export interface UseServerPaginationOptions<TFilters = Record<string, any>> {
	/** Tamaño de página inicial (default: 5) */
	initialPageSize?: number;
	/** Filtros iniciales */
	initialFilters?: TFilters;
	/** Función para cargar datos cuando cambian paginación o filtros */
	onFetchData: (params: {
		page: number;
		per_page: number;
		filters: TFilters;
	}) => void | Promise<void>;
	/** Si se debe hacer fetch automático al montar (default: true) */
	autoFetch?: boolean;
}

export interface UseServerPaginationResult<TFilters = Record<string, any>> {
	/** Estado de paginación (para pasar a DataTable) */
	pagination: PaginationState;
	/** Handler para cambio de paginación (para pasar a DataTable) */
	onPaginationChange: (updaterOrValue: any) => void;
	/** Filtros actuales */
	filters: TFilters;
	/** Actualizar un filtro específico (resetea a página 1) */
	setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
	/** Actualizar múltiples filtros (resetea a página 1) */
	setFilters: (filters: Partial<TFilters>) => void;
	/** Limpiar todos los filtros (resetea a página 1) */
	clearFilters: () => void;
	/** Recargar datos con paginación y filtros actuales */
	refetch: () => void;
	/** Resetear a página 1 (mantiene filtros) */
	resetPage: () => void;
}

/**
 * Hook para manejar paginación server-side con filtros
 *
 * @example
 * ```tsx
 * const { pagination, onPaginationChange, filters, setFilter, clearFilters } = useServerPagination({
 *   initialPageSize: 5,
 *   initialFilters: { status: '', q: '' },
 *   onFetchData: ({ page, per_page, filters }) => {
 *     dispatch(loadSalesList({
 *       subsidiaryId,
 *       filters: { page, per_page, ...filters }
 *     }));
 *   }
 * });
 *
 * return (
 *   <DataTable
 *     data={sales}
 *     manualPagination
 *     pageCount={meta?.last_page}
 *     paginationState={pagination}
 *     onPaginationChange={onPaginationChange}
 *   />
 * );
 * ```
 */
export function useServerPagination<TFilters extends Record<string, any> = Record<string, any>>({
	initialPageSize = 5,
	initialFilters = {} as TFilters,
	onFetchData,
	autoFetch = true,
}: UseServerPaginationOptions<TFilters>): UseServerPaginationResult<TFilters> {
	// Estado de paginación
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: initialPageSize,
	});

	// Estado de filtros
	const [filters, setFiltersState] = useState<TFilters>(initialFilters);

	// Handler para cambio de paginación
	const handlePaginationChange = useCallback((updaterOrValue: any) => {
		setPagination((old) =>
			typeof updaterOrValue === 'function' ? updaterOrValue(old) : updaterOrValue,
		);
	}, []);

	// Función para hacer fetch
	const fetchData = useCallback(() => {
		onFetchData({
			page: pagination.pageIndex + 1, // Backend usa 1-indexed
			per_page: pagination.pageSize,
			filters,
		});
	}, [pagination, filters, onFetchData]);

	// Fetch automático cuando cambian paginación o filtros
	useEffect(() => {
		if (autoFetch) {
			fetchData();
		}
	}, [fetchData, autoFetch]);

	// Actualizar un filtro específico
	const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
		setFiltersState((prev) => ({ ...prev, [key]: value }));
		setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset a página 1
	}, []);

	// Actualizar múltiples filtros
	const setFilters = useCallback((newFilters: Partial<TFilters>) => {
		setFiltersState((prev) => ({ ...prev, ...newFilters }));
		setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset a página 1
	}, []);

	// Limpiar filtros
	const clearFilters = useCallback(() => {
		setFiltersState(initialFilters);
		setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset a página 1
	}, [initialFilters]);

	// Resetear a página 1
	const resetPage = useCallback(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, []);

	return {
		pagination,
		onPaginationChange: handlePaginationChange,
		filters,
		setFilter,
		setFilters,
		clearFilters,
		refetch: fetchData,
		resetPage,
	};
}

/**
 * Ejemplo de uso completo:
 *
 * ```tsx
 * import { useServerPagination } from '@/hooks/useServerPagination';
 *
 * function SalesTable() {
 *   const dispatch = useDispatch();
 *   const sales = useSelector(selectSalesList);
 *   const meta = useSelector(selectSalesMeta);
 *   const loading = useSelector(selectSalesLoading);
 *
 *   const {
 *     pagination,
 *     onPaginationChange,
 *     filters,
 *     setFilter,
 *     clearFilters,
 *   } = useServerPagination({
 *     initialPageSize: 5,
 *     initialFilters: { status: '', q: '', wc_order_id: '' },
 *     onFetchData: ({ page, per_page, filters }) => {
 *       dispatch(loadSalesList({
 *         subsidiaryId: 1,
 *         filters: {
 *           page,
 *           per_page,
 *           with_customer: 1,
 *           ...(filters.status && { status: filters.status }),
 *           ...(filters.q && { q: filters.q }),
 *           ...(filters.wc_order_id && { wc_order_id: filters.wc_order_id }),
 *         },
 *       }));
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <Input
 *         value={filters.q}
 *         onChange={(e) => setFilter('q', e.target.value)}
 *       />
 *       <Select
 *         value={filters.status}
 *         onChange={(e) => setFilter('status', e.target.value)}
 *       >
 *         <option value="">Todos</option>
 *         <option value="completed">Completado</option>
 *       </Select>
 *       <Button onClick={clearFilters}>Limpiar</Button>
 *
 *       <DataTable
 *         data={sales}
 *         columns={columns}
 *         loading={loading}
 *         manualPagination
 *         pageCount={meta?.last_page ?? 0}
 *         paginationState={pagination}
 *         onPaginationChange={onPaginationChange}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
