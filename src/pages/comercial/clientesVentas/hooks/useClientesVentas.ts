import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useContextScopedResource from '@/hooks/useContextScopedResource';
import type { OrganizationalContext } from '@/hooks/useContextScopedSelection';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearCustomersListOverview,
	fetchCustomersListOverviewThunk,
} from '@/store/slices/customerSales/customerSalesSlice';

const DEFAULT_PAGE_SIZE = 10;

interface CustomersPagination {
	page: number;
	perPage: number;
}

const useClientesVentas = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const rawOverview = useAppSelector((state) => state.customerSales.listOverview);
	const rawMeta = useAppSelector((state) => state.customerSales.listMeta);
	const rawLoading = useAppSelector((state) => state.customerSales.listOverviewLoading);
	const rawError = useAppSelector((state) => state.customerSales.listOverviewError);
	const listOverviewSubsidiaryId = useAppSelector(
		(state) => state.customerSales.listOverviewSubsidiaryId,
	);
	const currentContext = useMemo<OrganizationalContext | null>(
		() => (subsidiaryId === null ? null : { type: 'subsidiary', id: subsidiaryId }),
		[subsidiaryId],
	);
	const ownerContext = useMemo<OrganizationalContext | null>(
		() =>
			listOverviewSubsidiaryId === null
				? null
				: { type: 'subsidiary', id: listOverviewSubsidiaryId },
		[listOverviewSubsidiaryId],
	);
	const scopedOverview = useContextScopedResource({
		currentContext,
		ownerContext,
		data: rawOverview,
		meta: rawMeta,
		loading: rawLoading,
		error: rawError,
		emptyData: [],
		emptyMeta: null,
	});
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [pagination, setPagination] = useState<CustomersPagination>({
		page: 1,
		perPage: DEFAULT_PAGE_SIZE,
	});
	const normalizedSearch = debouncedSearch.trim();
	const isSearchDebouncing = search !== debouncedSearch;
	const hasDataContext = subsidiaryId !== null;

	const requestArgs = useMemo(
		() =>
			subsidiaryId === null
				? null
				: {
						subsidiary: subsidiaryId,
						page: pagination.page,
						per_page: pagination.perPage,
						params: normalizedSearch ? { q: normalizedSearch } : undefined,
					},
		[normalizedSearch, pagination.page, pagination.perPage, subsidiaryId],
	);

	useEffect(() => {
		if (requestArgs === null) {
			dispatch(clearCustomersListOverview());
			return undefined;
		}
		if (isSearchDebouncing) return undefined;

		const request = dispatch(fetchCustomersListOverviewThunk(requestArgs));
		return () => request.abort();
	}, [dispatch, isSearchDebouncing, requestArgs]);

	useEffect(() => {
		setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
	}, [subsidiaryId]);

	const setSearchValue = useCallback((value: string) => {
		setSearch(value);
		setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
	}, []);
	const clearSearch = useCallback(() => setSearchValue(''), [setSearchValue]);
	const setPage = useCallback(
		(page: number, perPage = pagination.perPage) => {
			setPagination({ page: Math.max(1, page), perPage });
		},
		[pagination.perPage],
	);
	const retry = useCallback(() => {
		if (requestArgs === null || isSearchDebouncing) return undefined;
		return dispatch(fetchCustomersListOverviewThunk(requestArgs));
	}, [dispatch, isSearchDebouncing, requestArgs]);

	return {
		data: { overview: scopedOverview.data, meta: scopedOverview.meta },
		state: {
			loading: scopedOverview.loading,
			error: scopedOverview.error,
			hasDataContext,
			isSearchDebouncing,
		},
		filters: {
			search,
			setSearch: setSearchValue,
			clearSearch,
			hasSearch: Boolean(normalizedSearch),
		},
		pagination,
		actions: { setPage, retry },
		branch: { branchId, subsidiaryId },
	};
};

export default useClientesVentas;
