import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { DeferredPaymentsFilters } from '@/interface/deferredPayments.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import USE_DEFERRED_PAYMENTS_MOCK from '@/store/slices/deferredPayments/deferredPaymentsConfig';
import {
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	resetDeferredPaymentsFilters,
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

const usePagosDiferidos = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const list = useAppSelector((state) => state.deferredPayments.list);
	const summary = useAppSelector((state) => state.deferredPayments.summary);
	const meta = useAppSelector((state) => state.deferredPayments.meta);
	const values = useAppSelector((state) => state.deferredPayments.filters);
	const loading = useAppSelector((state) => state.deferredPayments.loading);
	const loadingSummary = useAppSelector((state) => state.deferredPayments.loadingSummary);
	const error = useAppSelector((state) => state.deferredPayments.error);
	const errorSummary = useAppSelector((state) => state.deferredPayments.errorSummary);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const search = values.search ?? '';
	const [debouncedSearch] = useDebounce(search, 300);
	const isSearchDebouncing = search !== debouncedSearch;
	const effectiveSubsidiaryId = subsidiaryId ?? (USE_DEFERRED_PAYMENTS_MOCK ? 0 : null);
	const hasDataContext = effectiveSubsidiaryId !== null;
	const hasInvalidDateRange = Boolean(
		values.due_after && values.due_before && values.due_after > values.due_before,
	);

	const filtersForRequest = useMemo<DeferredPaymentsFilters>(
		() => ({ ...values, search: debouncedSearch || undefined }),
		[debouncedSearch, values],
	);

	useEffect(() => {
		if (effectiveSubsidiaryId === null) return undefined;
		const request = dispatch(
			fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId }),
		);
		return () => request.abort();
	}, [dispatch, effectiveSubsidiaryId]);

	useEffect(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		const request = dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: filtersForRequest,
			}),
		);
		return () => request.abort();
	}, [
		dispatch,
		effectiveSubsidiaryId,
		filtersForRequest,
		hasInvalidDateRange,
		isSearchDebouncing,
	]);

	const setSearch = useCallback(
		(value: string) => {
			dispatch(setDeferredPaymentsFilters({ search: value || undefined, page: 1 }));
		},
		[dispatch],
	);
	const setFilter = useCallback(
		(patch: Partial<DeferredPaymentsFilters>) => {
			dispatch(setDeferredPaymentsFilters({ ...patch, page: patch.page ?? 1 }));
		},
		[dispatch],
	);
	const hasFilters = Boolean(
		debouncedSearch.trim() ||
			values.status ||
			values.customer_sale_id ||
			values.due_after ||
			values.due_before,
	);
	const resetFilters = useCallback(() => dispatch(resetDeferredPaymentsFilters()), [dispatch]);
	const openDetail = useCallback((id: number) => setSelectedId(id), []);
	const closeDetail = useCallback(() => setSelectedId(null), []);
	const retrySummary = useCallback(() => {
		if (effectiveSubsidiaryId === null) return undefined;
		return dispatch(fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId }));
	}, [dispatch, effectiveSubsidiaryId]);
	const retryList = useCallback(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		return dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: filtersForRequest,
			}),
		);
	}, [
		dispatch,
		effectiveSubsidiaryId,
		filtersForRequest,
		hasInvalidDateRange,
		isSearchDebouncing,
	]);

	return {
		data: { list, summary, meta },
		state: {
			loading,
			loadingSummary,
			error,
			errorSummary,
			hasDataContext,
			isMockMode: USE_DEFERRED_PAYMENTS_MOCK,
		},
		filters: {
			values,
			search,
			setSearch,
			setFilter,
			reset: resetFilters,
			hasFilters,
			hasInvalidDateRange,
		},
		selection: { selectedId, openDetail, closeDetail },
		actions: { retryList, retrySummary },
		branch: { branchId, subsidiaryId },
	};
};

export default usePagosDiferidos;
