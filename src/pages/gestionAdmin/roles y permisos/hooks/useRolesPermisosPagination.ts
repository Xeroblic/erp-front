import { useCallback, useEffect, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useDebounce } from 'use-debounce';
import {
	USERS_DEFAULT_PAGE_SIZE,
	type FetchUsuariosConRolesPermsParams,
} from '@/store/slices/rolesPermisos/rolesPermisosSlice';

const SEARCH_DEBOUNCE_MS = 400;

interface UseRolesPermisosPaginationOptions {
	onFetch: (params: FetchUsuariosConRolesPermsParams) => void;
}

type PaginationUpdater = PaginationState | ((current: PaginationState) => PaginationState);

const useRolesPermisosPagination = ({ onFetch }: UseRolesPermisosPaginationOptions) => {
	const [searchInput, setSearchInput] = useState('');
	const [search, setSearch] = useState('');
	const [debouncedSearchInput] = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: USERS_DEFAULT_PAGE_SIZE,
	});

	useEffect(() => {
		const nextSearch = debouncedSearchInput.trim();
		if (nextSearch === search) return;

		setSearch(nextSearch);
		setPagination((current) => ({ ...current, pageIndex: 0 }));
	}, [debouncedSearchInput, search]);

	const refresh = useCallback(() => {
		onFetch({
			page: pagination.pageIndex + 1,
			per_page: pagination.pageSize,
			...(search ? { search } : {}),
		});
	}, [onFetch, pagination.pageIndex, pagination.pageSize, search]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const onPaginationChange = useCallback((updater: PaginationUpdater) => {
		setPagination((current) => {
			const next = typeof updater === 'function' ? updater(current) : updater;
			return { pageIndex: next.pageIndex, pageSize: next.pageSize };
		});
	}, []);

	return {
		search: { value: searchInput, onChange: setSearchInput },
		pagination: { state: pagination, onChange: onPaginationChange },
		refresh,
	};
};

export default useRolesPermisosPagination;
