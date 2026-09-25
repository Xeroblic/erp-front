import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchProcurementSuppliers,
	selectProcurementSuppliersItems,
	selectProcurementSuppliersListError,
	selectProcurementSuppliersListLoading,
	selectProcurementSuppliersListSubsidiaryId,
	selectProcurementSuppliersMeta,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type {
	IProcurementSupplierListParams,
	IProcurementSupplierListRow,
} from '@/interface/procurement.interface';
import { SUPPLIER_STATUS_FILTER_OPTIONS } from '../types';
import type { TSupplierStatusFilter } from '../types';

const DEFAULT_PAGE_SIZE = 15; // Defecto del contrato (sección 1).
const NO_ROWS: IProcurementSupplierListRow[] = [];

interface IDeactivateTarget {
	subsidiaryId: number | null;
	supplier: IProcurementSupplierListRow;
}

/**
 * `is_active` e `include_inactive` son excluyentes por contrato: modelarlos
 * como una sola elección los vuelve excluyentes por construcción en vez de
 * dejar que la UI los combine.
 */
const buildStatusParams = (
	status: TSupplierStatusFilter,
): Pick<IProcurementSupplierListParams, 'is_active' | 'include_inactive'> => {
	if (status === 'inactive') return { is_active: 0 };
	if (status === 'all') return { include_inactive: 1 };
	return {};
};

const useProveedores = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const storedItems = useAppSelector(selectProcurementSuppliersItems);
	const storedMeta = useAppSelector(selectProcurementSuppliersMeta);
	const listLoading = useAppSelector(selectProcurementSuppliersListLoading);
	const storedError = useAppSelector(selectProcurementSuppliersListError);
	const listSubsidiaryId = useAppSelector(selectProcurementSuppliersListSubsidiaryId);

	/**
	 * El listado del store es de la última filial que respondió; la nueva
	 * petición recién sale en el efecto. Hasta que llegue, lo de la filial
	 * anterior no se muestra: la vista queda vacía y en carga.
	 */
	const isListForSubsidiary = listSubsidiaryId === subsidiaryId;
	const items = isListForSubsidiary ? storedItems : NO_ROWS;
	const meta = isListForSubsidiary ? storedMeta : null;
	const error = isListForSubsidiary ? storedError : null;

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [status, setStatus] = useState<TSupplierStatusFilter>('active');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
	const [deactivateRequest, setDeactivateRequest] = useState<IDeactivateTarget | null>(null);

	// Otra filial es otro listado: se vuelve a la página 1 en el mismo render,
	// para no pedir una página que puede no existir en la nueva.
	const [pageSubsidiaryId, setPageSubsidiaryId] = useState(subsidiaryId);
	if (pageSubsidiaryId !== subsidiaryId) {
		setPageSubsidiaryId(subsidiaryId);
		setPage(1);
	}

	/**
	 * El proveedor a desactivar queda atado a la filial en que se eligió: si
	 * cambia, el modal se cierra en vez de enviar ese ID a la filial nueva.
	 */
	const deactivateTarget =
		deactivateRequest?.subsidiaryId === subsidiaryId ? deactivateRequest.supplier : null;
	const openDeactivate = useCallback(
		(supplier: IProcurementSupplierListRow) => setDeactivateRequest({ subsidiaryId, supplier }),
		[subsidiaryId],
	);
	const closeDeactivate = useCallback(() => setDeactivateRequest(null), []);

	const isSearchDebouncing = search !== debouncedSearch;
	const normalizedSearch = debouncedSearch.trim();

	const params = useMemo<IProcurementSupplierListParams>(
		() => ({
			...buildStatusParams(status),
			search: normalizedSearch || undefined,
			page,
			per_page: perPage,
		}),
		[status, normalizedSearch, page, perPage],
	);

	useEffect(() => {
		if (isSearchDebouncing) return;
		void dispatch(fetchProcurementSuppliers({ subsidiaryId, params }));
	}, [dispatch, subsidiaryId, params, isSearchDebouncing]);

	const refresh = useCallback(
		() => dispatch(fetchProcurementSuppliers({ subsidiaryId, params })),
		[dispatch, subsidiaryId, params],
	);

	/**
	 * Tras desactivar o restaurar, la fila afectada puede salir del filtro
	 * vigente (una desactivación deja de calzar con «Activos», una
	 * restauración deja de calzar con «Inactivos»). Si era la única fila de
	 * la página y no es la primera, recargar esa misma página dejaría una
	 * lista vacía con más páginas atrás: se retrocede una en vez de eso,
	 * igual que `refreshAfterDeletion` en clientes de ventas.
	 */
	const refreshAfterMutation = useCallback(() => {
		const isLastRowOnLastPage =
			items.length === 1 && page > 1 && meta !== null && meta.current_page === meta.last_page;
		if (isLastRowOnLastPage) {
			setPage((current) => Math.max(1, current - 1));
			return undefined;
		}
		return refresh();
	}, [items.length, meta, page, refresh]);

	const setSearchValue = useCallback((value: string) => {
		setSearch(value);
		setPage(1);
	}, []);
	const clearSearch = useCallback(() => setSearchValue(''), [setSearchValue]);
	const setStatusValue = useCallback((value: TSupplierStatusFilter) => {
		setStatus(value);
		setPage(1);
	}, []);
	const onPaginationChange = useCallback((nextPage: number, nextPerPage: number) => {
		setPage(nextPage);
		setPerPage(nextPerPage);
	}, []);

	return {
		branchId,
		subsidiaryId,
		items,
		meta,
		loading: listLoading || isSearchDebouncing || !isListForSubsidiary,
		error,
		search,
		status,
		statusOptions: SUPPLIER_STATUS_FILTER_OPTIONS,
		hasSearch: Boolean(normalizedSearch),
		setSearchValue,
		clearSearch,
		setStatusValue,
		onPaginationChange,
		refresh,
		refreshAfterMutation,
		deactivateTarget,
		openDeactivate,
		closeDeactivate,
	};
};

export default useProveedores;
