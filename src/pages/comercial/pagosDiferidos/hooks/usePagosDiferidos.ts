import { useCallback, useEffect, useMemo, useState } from 'react';
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
import USE_DEFERRED_PAYMENTS_MOCK from '@/store/slices/deferredPayments/deferredPaymentsConfig';

const usePagosDiferidos = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const deferredPayments = useAppSelector((state) => state.deferredPayments);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const search = deferredPayments.filters.search ?? '';
	const [debouncedSearch] = useDebounce(search, 300);
	const effectiveSubsidiaryId = subsidiaryId ?? (USE_DEFERRED_PAYMENTS_MOCK ? 0 : null);
	const hasDataContext = effectiveSubsidiaryId !== null;
	const hasInvalidDateRange = Boolean(
		deferredPayments.filters.due_after &&
			deferredPayments.filters.due_before &&
			deferredPayments.filters.due_after > deferredPayments.filters.due_before,
	);

	const filtersForRequest = useMemo<DeferredPaymentsFilters>(
		() => ({
			page: deferredPayments.filters.page,
			per_page: deferredPayments.filters.per_page,
			sort: deferredPayments.filters.sort,
			status: deferredPayments.filters.status,
			customer_sale_id: deferredPayments.filters.customer_sale_id,
			due_after: deferredPayments.filters.due_after,
			due_before: deferredPayments.filters.due_before,
			search: debouncedSearch || undefined,
		}),
		[
			debouncedSearch,
			deferredPayments.filters.customer_sale_id,
			deferredPayments.filters.due_after,
			deferredPayments.filters.due_before,
			deferredPayments.filters.page,
			deferredPayments.filters.per_page,
			deferredPayments.filters.sort,
			deferredPayments.filters.status,
		],
	);

	useEffect(() => {
		if (effectiveSubsidiaryId === null) return undefined;
		const request = dispatch(
			fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId }),
		);
		return () => request.abort();
	}, [dispatch, effectiveSubsidiaryId]);

	useEffect(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange) return undefined;
		const request = dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: filtersForRequest,
			}),
		);
		return () => request.abort();
	}, [dispatch, effectiveSubsidiaryId, filtersForRequest, hasInvalidDateRange]);

	const setSearch = useCallback(
		(value: string) => {
			dispatch(
				setDeferredPaymentsFilters({
					search: value || undefined,
					page: 1,
				}),
			);
		},
		[dispatch],
	);

	const setFilter = useCallback(
		(patch: Partial<DeferredPaymentsFilters>) => {
			dispatch(setDeferredPaymentsFilters({ ...patch, page: patch.page ?? 1 }));
		},
		[dispatch],
	);

	const hasFilters = useMemo(
		() =>
			Boolean(
				debouncedSearch.trim() ||
					deferredPayments.filters.status ||
					deferredPayments.filters.customer_sale_id ||
					deferredPayments.filters.due_after ||
					deferredPayments.filters.due_before,
			),
		[debouncedSearch, deferredPayments.filters],
	);

	const resetFilters = useCallback(() => {
		dispatch(resetDeferredPaymentsFilters());
	}, [dispatch]);

	const openDetail = useCallback((id: number) => setSelectedId(id), []);
	const closeDetail = useCallback(() => setSelectedId(null), []);

	const retrySummary = useCallback(() => {
		if (effectiveSubsidiaryId === null) return undefined;
		return dispatch(fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId }));
	}, [dispatch, effectiveSubsidiaryId]);

	const retryList = useCallback(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange) return undefined;
		return dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: filtersForRequest,
			}),
		);
	}, [dispatch, effectiveSubsidiaryId, filtersForRequest, hasInvalidDateRange]);

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
				errorSummary: deferredPayments.errorSummary,
				hasDataContext,
				isMockMode: USE_DEFERRED_PAYMENTS_MOCK,
			},
			filters: {
				values: deferredPayments.filters,
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
		}),
		[
			branchId,
			closeDetail,
			deferredPayments,
			hasDataContext,
			hasFilters,
			hasInvalidDateRange,
			openDetail,
			resetFilters,
			retryList,
			retrySummary,
			search,
			selectedId,
			setFilter,
			setSearch,
			subsidiaryId,
		],
	);
};

export default usePagosDiferidos;
