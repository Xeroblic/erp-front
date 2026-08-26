import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchWithdrawals,
	selectWithdrawals,
	selectWithdrawalsError,
	selectWithdrawalsLoading,
	selectWithdrawalsMeta,
	selectWithdrawalsOwnerContext,
	withdrawalsFiltersFromSearchParams,
} from '@/store/slices/equipmentWithdrawals';
import type { IFetchWithdrawalsParams } from '@/interface/equipmentWithdrawals.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

export type QuickFilterKey = 'all' | 'out' | 'stale';

export interface IQuickFilter {
	key: QuickFilterKey;
	label: string;
	/** Query params exactos del contrato §9. */
	params: Record<string, string>;
}

/**
 * Filtros rápidos del listado:
 * - "Qué hay afuera": lo confirmado que sigue fuera (préstamos).
 * - "Borradores estancados": equipos fuera del stock por borradores sin avanzar.
 */
export const QUICK_FILTERS: IQuickFilter[] = [
	{ key: 'all', label: 'Todos', params: {} },
	{ key: 'out', label: 'Qué hay afuera', params: { status: 'confirmed', type: 'loan' } },
	{ key: 'stale', label: 'Borradores estancados', params: { stale: 'true' } },
];

const detectQuickFilter = (searchParams: URLSearchParams): QuickFilterKey => {
	const status = searchParams.get('status');
	const type = searchParams.get('type');
	const stale = searchParams.get('stale');

	if (stale === 'true') return 'stale';
	if (status === 'confirmed' && type === 'loan') return 'out';
	return 'all';
};

const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_PER_PAGE = 20;

export interface UseRetirosEquiposResult {
	rows: ReturnType<typeof selectWithdrawals>;
	meta: ReturnType<typeof selectWithdrawalsMeta>;
	isLoading: boolean;
	error: string | null;
	hasValidBranch: boolean;
	quickFilter: QuickFilterKey;
	applyQuickFilter: (key: QuickFilterKey) => void;
	pageIndex: number;
	pageSize: number;
	onPageChange: (pageIndex: number) => void;
	searchValue: string;
	onSearchChange: (value: string) => void;
	reload: () => void;
}

export const useRetirosEquipos = (): UseRetirosEquiposResult => {
	const dispatch = useAppDispatch();
	const [searchParams, setSearchParams] = useSearchParams();
	const debouncedSearchRef = useRef<ReturnType<typeof setTimeout>>();

	const cancelPendingSearch = useCallback(() => {
		if (debouncedSearchRef.current === undefined) return;
		clearTimeout(debouncedSearchRef.current);
		debouncedSearchRef.current = undefined;
	}, []);

	const { branchId, subsidiaryId, hasValidBranch } = useCurrentBranch();

	const rows = useAppSelector(selectWithdrawals);
	const meta = useAppSelector(selectWithdrawalsMeta);
	const isLoading = useAppSelector(selectWithdrawalsLoading);
	const error = useAppSelector(selectWithdrawalsError);
	const ownerContext = useAppSelector(selectWithdrawalsOwnerContext);
	const activeContext = `branch:${branchId ?? 'none'}|subsidiary:${subsidiaryId ?? 'none'}`;
	const isOwned = ownerContext === null || ownerContext === activeContext;

	const filters = useMemo<IFetchWithdrawalsParams>(
		() => withdrawalsFiltersFromSearchParams(searchParams),
		[searchParams],
	);

	const page = filters.page ?? 1;
	const pageSize = filters.per_page ?? DEFAULT_PER_PAGE;
	const quickFilter = useMemo(() => detectQuickFilter(searchParams), [searchParams]);

	useEffect(() => {
		if (!hasValidBranch) return undefined;
		void dispatch(
			fetchWithdrawals({
				branchId,
				subsidiaryId,
				params: { ...filters, page, per_page: pageSize },
			}),
		);
		return undefined;
	}, [dispatch, branchId, subsidiaryId, hasValidBranch, filters, page, pageSize]);

	const applyQuickFilter = useCallback(
		(key: QuickFilterKey) => {
			cancelPendingSearch();
			const filter = QUICK_FILTERS.find((item) => item.key === key) ?? QUICK_FILTERS[0];
			setSearchParams(new URLSearchParams(filter.params));
		},
		[cancelPendingSearch, setSearchParams],
	);

	const onPageChange = useCallback(
		(nextPageIndex: number) => {
			const next = new URLSearchParams(searchParams);
			next.set('page', String(nextPageIndex + 1));
			setSearchParams(next);
		},
		[searchParams, setSearchParams],
	);

	const onSearchChange = useCallback(
		(value: string) => {
			const next = new URLSearchParams(searchParams);
			const q = value.trim();
			if (q) next.set('q', q);
			else next.delete('q');
			next.delete('page'); // nueva búsqueda vuelve a la primera página
			setSearchParams(next);
		},
		[searchParams, setSearchParams],
	);

	// El input de búsqueda escribe en la URL; el debounce evita recargar por
	// cada tecla mientras se respeta el filtro q del contrato §9.
	useEffect(() => cancelPendingSearch, [cancelPendingSearch]);

	const handleSearchChange = useCallback(
		(value: string) => {
			cancelPendingSearch();
			debouncedSearchRef.current = setTimeout(() => {
				debouncedSearchRef.current = undefined;
				onSearchChange(value);
			}, SEARCH_DEBOUNCE_MS);
		},
		[cancelPendingSearch, onSearchChange],
	);

	const reload = useCallback(() => {
		if (!hasValidBranch) return;
		void dispatch(
			fetchWithdrawals({
				branchId,
				subsidiaryId,
				params: { ...filters, page, per_page: pageSize },
			}),
		);
	}, [dispatch, branchId, subsidiaryId, hasValidBranch, filters, page, pageSize]);

	return {
		rows: isOwned ? rows : [],
		meta: isOwned ? meta : null,
		isLoading,
		error: isOwned ? error : null,
		hasValidBranch,
		quickFilter,
		applyQuickFilter,
		pageIndex: page - 1,
		pageSize,
		onPageChange,
		searchValue: filters.q ?? '',
		onSearchChange: handleSearchChange,
		reload,
	};
};
