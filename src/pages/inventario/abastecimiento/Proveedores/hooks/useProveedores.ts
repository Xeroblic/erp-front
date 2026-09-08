import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchProcurementSuppliers,
	selectProcurementSuppliersItems,
	selectProcurementSuppliersListError,
	selectProcurementSuppliersListLoading,
	selectProcurementSuppliersMeta,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProcurementSupplierListParams } from '@/interface/procurement.interface';
import { SUPPLIER_STATUS_FILTER_OPTIONS } from '../types';
import type { TSupplierStatusFilter } from '../types';

const DEFAULT_PAGE_SIZE = 15; // Defecto del contrato (sección 1).

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
	const items = useAppSelector(selectProcurementSuppliersItems);
	const meta = useAppSelector(selectProcurementSuppliersMeta);
	const listLoading = useAppSelector(selectProcurementSuppliersListLoading);
	const error = useAppSelector(selectProcurementSuppliersListError);

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [status, setStatus] = useState<TSupplierStatusFilter>('active');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

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
		dispatch(fetchProcurementSuppliers({ subsidiaryId, params }));
	}, [dispatch, subsidiaryId, params, isSearchDebouncing]);

	const refresh = useCallback(
		() => dispatch(fetchProcurementSuppliers({ subsidiaryId, params })),
		[dispatch, subsidiaryId, params],
	);

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
		loading: listLoading || isSearchDebouncing,
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
	};
};

export default useProveedores;
