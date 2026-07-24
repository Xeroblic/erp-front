import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { DeferredPaymentsFilters } from '@/interface/deferredPayments.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	resetDeferredPaymentsFilters,
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

export const usePagosDiferidos = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId, hasValidBranch } = useCurrentBranch();
	const deferredPayments = useAppSelector((state) => state.deferredPayments);
	const [search, setSearch] = useState(deferredPayments.filters.search ?? '');
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [debouncedSearch, debounceControls] = useDebounce(search, 300);
	const ignoredDebouncedSearchRef = useRef<string | null>(null);

	useEffect(() => {
		if (!subsidiaryId) return undefined;
		const request = dispatch(fetchDeferredPaymentsSummary({ subsidiaryId }));
		return () => request.abort();
	}, [dispatch, subsidiaryId]);

	useEffect(() => {
		if (!subsidiaryId) return undefined;
		const request = dispatch(
			fetchDeferredPayments({ subsidiaryId, filters: deferredPayments.filters }),
		);
		return () => request.abort();
	}, [deferredPayments.filters, dispatch, subsidiaryId]);

	useEffect(() => {
		if (ignoredDebouncedSearchRef.current !== null) {
			if (debouncedSearch === ignoredDebouncedSearchRef.current) return;
			ignoredDebouncedSearchRef.current = null;
		}
		if ((deferredPayments.filters.search ?? '') === debouncedSearch) return;
		dispatch(setDeferredPaymentsFilters({ search: debouncedSearch || undefined, page: 1 }));
	}, [debouncedSearch, deferredPayments.filters.search, dispatch]);

	const setFilter = useCallback(
		(patch: Partial<DeferredPaymentsFilters>) => {
			dispatch(setDeferredPaymentsFilters({ ...patch, page: patch.page ?? 1 }));
		},
		[dispatch],
	);

	const hasFilters = useMemo(
		() =>
			Boolean(
				search.trim() ||
					deferredPayments.filters.status ||
					deferredPayments.filters.customer_sale_id ||
					deferredPayments.filters.due_after ||
					deferredPayments.filters.due_before,
			),
		[deferredPayments.filters, search],
	);

	const resetFilters = useCallback(() => {
		ignoredDebouncedSearchRef.current = debouncedSearch;
		debounceControls.cancel();
		setSearch('');
		dispatch(resetDeferredPaymentsFilters());
	}, [debounceControls, debouncedSearch, dispatch]);

	const openDetail = useCallback((id: number) => setSelectedId(id), []);
	const closeDetail = useCallback(() => setSelectedId(null), []);

	const retry = useCallback(() => {
		if (!subsidiaryId) return;
		void dispatch(fetchDeferredPaymentsSummary({ subsidiaryId }));
		void dispatch(fetchDeferredPayments({ subsidiaryId, filters: deferredPayments.filters }));
	}, [deferredPayments.filters, dispatch, subsidiaryId]);

	return useMemo(
		() => ({
			data: {
				list: deferredPayments.list,
				summary: deferredPayments.summary,
				meta: deferredPayments.meta,
			},
			state: {
				loading: deferredPayments.loading,
				loadingSummary: deferredPayments.loadingSummary,
				error: deferredPayments.error,
				hasFilters,
				hasValidBranch,
			},
			filters: {
				values: deferredPayments.filters,
				search,
				setSearch,
				setFilter,
				reset: resetFilters,
				hasFilters,
			},
			selection: { selectedId, openDetail, closeDetail },
			actions: { retry },
			branch: { branchId, subsidiaryId },
		}),
		[
			branchId,
			deferredPayments,
			hasFilters,
			hasValidBranch,
			closeDetail,
			openDetail,
			resetFilters,
			retry,
			selectedId,
			search,
			setFilter,
			subsidiaryId,
		],
	);
};
