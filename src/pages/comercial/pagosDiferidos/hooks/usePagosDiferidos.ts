import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useContextScopedSelection from '@/hooks/useContextScopedSelection';
import type {
	DeferredPaymentApiSummaryParams,
	DeferredPaymentsFilters,
} from '@/interface/deferredPayments.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	resetDeferredPaymentsFilters,
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

interface UsePagosDiferidosOptions {
	initialSearch?: string;
}

const usePagosDiferidos = ({ initialSearch }: UsePagosDiferidosOptions = {}) => {
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
	const listSubsidiaryId = useAppSelector((state) => state.deferredPayments.listSubsidiaryId);
	const appliedInitialSearchKey = useRef<string | null>(null);
	const search = values.search ?? '';
	const [debouncedSearch] = useDebounce(search, 300);
	const isSearchDebouncing = search !== debouncedSearch;
	const effectiveSubsidiaryId = subsidiaryId;
	const hasDataContext = effectiveSubsidiaryId !== null;
	const selection = useContextScopedSelection<number>(
		effectiveSubsidiaryId === null
			? null
			: { type: 'subsidiary', id: effectiveSubsidiaryId },
	);
	const hasInvalidDateRange = Boolean(
		values.due_after && values.due_before && values.due_after > values.due_before,
	);
	const isSubsidiaryChange =
		listSubsidiaryId !== null && listSubsidiaryId !== effectiveSubsidiaryId;
	const requestPage = isSubsidiaryChange ? 1 : values.page;
	const listFiltersForRequest = useMemo<DeferredPaymentsFilters>(
		() => ({
			page: requestPage,
			per_page: values.per_page,
			sort: values.sort,
			status: values.status,
			...(values.customer_sale_id !== undefined
				? { customer_sale_id: values.customer_sale_id }
				: {}),
			due_after: values.due_after,
			due_before: values.due_before,
			search: debouncedSearch || undefined,
		}),
		[
			debouncedSearch,
			requestPage,
			values.customer_sale_id,
			values.due_after,
			values.due_before,
			values.per_page,
			values.sort,
			values.status,
		],
	);
	const summaryFiltersForRequest = useMemo<DeferredPaymentApiSummaryParams>(
		() => ({
			status: values.status,
			...(values.customer_sale_id !== undefined
				? { customer_sale_id: values.customer_sale_id }
				: {}),
			due_after: values.due_after,
			due_before: values.due_before,
			search: debouncedSearch || undefined,
		}),
		[
			debouncedSearch,
			values.customer_sale_id,
			values.due_after,
			values.due_before,
			values.status,
		],
	);

	useEffect(() => {
		const normalizedInitialSearch = initialSearch?.trim();
		if (!normalizedInitialSearch) return;

		const initialSearchKey = normalizedInitialSearch;
		if (appliedInitialSearchKey.current === initialSearchKey) return;

		appliedInitialSearchKey.current = initialSearchKey;
		dispatch(
			setDeferredPaymentsFilters({
				search: normalizedInitialSearch,
				customer_sale_id: undefined,
				page: 1,
			}),
		);
	}, [dispatch, initialSearch]);

	useEffect(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		const listRequest = dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: listFiltersForRequest,
			}),
		);
		return () => listRequest.abort();
	}, [
		dispatch,
		effectiveSubsidiaryId,
		listFiltersForRequest,
		hasInvalidDateRange,
		isSearchDebouncing,
	]);

	useEffect(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		const summaryRequest = dispatch(
			fetchDeferredPaymentsSummary({
				subsidiaryId: effectiveSubsidiaryId,
				filters: summaryFiltersForRequest,
			}),
		);
		return () => summaryRequest.abort();
	}, [
		dispatch,
		effectiveSubsidiaryId,
		hasInvalidDateRange,
		isSearchDebouncing,
		summaryFiltersForRequest,
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
	const resetFilters = useCallback(() => {
		dispatch(resetDeferredPaymentsFilters());
	}, [dispatch]);
	const retrySummary = useCallback(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		return dispatch(
			fetchDeferredPaymentsSummary({
				subsidiaryId: effectiveSubsidiaryId,
				filters: summaryFiltersForRequest,
			}),
		);
	}, [
		dispatch,
		effectiveSubsidiaryId,
		hasInvalidDateRange,
		isSearchDebouncing,
		summaryFiltersForRequest,
	]);
	const retryList = useCallback(() => {
		if (effectiveSubsidiaryId === null || hasInvalidDateRange || isSearchDebouncing)
			return undefined;
		return dispatch(
			fetchDeferredPayments({
				subsidiaryId: effectiveSubsidiaryId,
				filters: listFiltersForRequest,
			}),
		);
	}, [
		dispatch,
		effectiveSubsidiaryId,
		listFiltersForRequest,
		hasInvalidDateRange,
		isSearchDebouncing,
	]);

	return {
		data: { list, summary, meta },
		state: { loading, loadingSummary, error, errorSummary, hasDataContext },
		filters: {
			values,
			search,
			setSearch,
			setFilter,
			reset: resetFilters,
			hasFilters,
			hasInvalidDateRange,
			isSearchDebouncing,
		},
		selection: {
			selectedId: selection.selectedId,
			context: selection.context,
			isOpen: selection.isOpen,
			openDetail: selection.select,
			closeDetail: selection.clear,
		},
		actions: { retryList, retrySummary },
		branch: { branchId, subsidiaryId },
	};
};

export default usePagosDiferidos;
