import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useContextScopedResource from '@/hooks/useContextScopedResource';
import type { OrganizationalContext } from '@/hooks/useContextScopedSelection';
import type {
	DeferredPaymentCreditProfilesFilters,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentCreditProfileListItem,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import getApiErrorMessage from '@/utils/deferredPaymentsError.utils';
import type { CreditProfileStatusFilter } from '../types';

const DEFAULT_FILTERS: DeferredPaymentCreditProfilesFilters = { page: 1, per_page: 10 };

const useCarteraCredito = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();
	const [filters, setFilters] = useState<DeferredPaymentCreditProfilesFilters>(DEFAULT_FILTERS);
	const [filtersSubsidiaryId, setFiltersSubsidiaryId] = useState(subsidiaryId);
	const [status, setStatus] = useState<CreditProfileStatusFilter>('all');
	const [search, setSearch] = useState('');
	const [rows, setRows] = useState<IDeferredPaymentCreditProfileListItem[]>([]);
	const [meta, setMeta] = useState<DeferredPaymentsPaginationMeta | null>(null);
	const [loading, setLoading] = useState(subsidiaryId !== null);
	const [error, setError] = useState<string | null>(null);
	const [ownerSubsidiaryId, setOwnerSubsidiaryId] = useState<number | null>(subsidiaryId);
	const requestIdRef = useRef(0);
	const activeSubsidiaryIdRef = useRef(subsidiaryId);
	activeSubsidiaryIdRef.current = subsidiaryId;
	const currentContext = useMemo<OrganizationalContext | null>(
		() => (subsidiaryId === null ? null : { type: 'subsidiary', id: subsidiaryId }),
		[subsidiaryId],
	);
	const ownerContext = useMemo<OrganizationalContext | null>(
		() => (ownerSubsidiaryId === null ? null : { type: 'subsidiary', id: ownerSubsidiaryId }),
		[ownerSubsidiaryId],
	);
	const scopedPortfolio = useContextScopedResource({
		currentContext,
		ownerContext,
		data: rows,
		meta,
		loading,
		error: error ?? undefined,
		emptyData: [] as IDeferredPaymentCreditProfileListItem[],
		emptyMeta: null as DeferredPaymentsPaginationMeta | null,
	});
	const searchInput = useMemo(() => ({ value: search, subsidiaryId }), [search, subsidiaryId]);
	const [debouncedSearch] = useDebounce(searchInput, 300);
	const effectiveSearch =
		debouncedSearch.subsidiaryId === subsidiaryId
			? debouncedSearch.value.trim() || undefined
			: undefined;

	const requestFilters = useMemo(
		() => ({
			...filters,
			search: effectiveSearch,
			active: status === 'all' ? undefined : status === 'active',
		}),
		[effectiveSearch, filters, status],
	);

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (subsidiaryId === null) return;
			const requestSubsidiaryId = subsidiaryId;
			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;
			setLoading(true);
			setError(null);
			try {
				const response = await deferredPaymentsService.getCreditProfiles(
					subsidiaryId,
					requestFilters,
					signal,
				);
				if (
					signal?.aborted ||
					requestSubsidiaryId !== activeSubsidiaryIdRef.current ||
					requestId !== requestIdRef.current
				)
					return;
				const lastPage = Math.max(response.meta.last_page, 1);
				if (requestFilters.page > lastPage) {
					requestIdRef.current += 1;
					setFilters((current) =>
						current.page === lastPage ? current : { ...current, page: lastPage },
					);
					return;
				}
				setOwnerSubsidiaryId(requestSubsidiaryId);
				setRows(response.data);
				setMeta(response.meta);
			} catch (requestError: unknown) {
				if (
					signal?.aborted ||
					requestSubsidiaryId !== activeSubsidiaryIdRef.current ||
					requestId !== requestIdRef.current
				)
					return;
				setOwnerSubsidiaryId(requestSubsidiaryId);
				setRows([]);
				setMeta(null);
				setError(
					getApiErrorMessage(requestError, 'No se pudo cargar la cartera de crédito.'),
				);
			} finally {
				if (
					!signal?.aborted &&
					requestSubsidiaryId === activeSubsidiaryIdRef.current &&
					requestId === requestIdRef.current
				)
					setLoading(false);
			}
		},
		[requestFilters, subsidiaryId],
	);

	useEffect(() => {
		requestIdRef.current += 1;
		setFiltersSubsidiaryId(subsidiaryId);
		setRows([]);
		setMeta(null);
		setError(null);
		setLoading(subsidiaryId !== null);
		setFilters(DEFAULT_FILTERS);
		setStatus('all');
		setSearch('');
	}, [subsidiaryId]);

	useEffect(() => {
		if (subsidiaryId === null || filtersSubsidiaryId !== subsidiaryId) return undefined;
		const controller = new AbortController();
		load(controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [filtersSubsidiaryId, load, subsidiaryId]);

	const updateSearch = useCallback((value: string) => {
		setSearch(value);
		setFilters((current) => (current.page === 1 ? current : { ...current, page: 1 }));
	}, []);
	const updateStatus = useCallback((value: CreditProfileStatusFilter) => {
		setStatus(value);
		setFilters((current) => ({ ...current, page: 1 }));
	}, []);
	const updatePagination = useCallback((page: number, perPage: number) => {
		setFilters((current) => ({ ...current, page, per_page: perPage }));
	}, []);
	const resetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
		setStatus('all');
		setSearch('');
	}, []);
	const refreshAfterDeletion = useCallback(async (): Promise<void> => {
		if (filters.page > 1 && rows.length === 1) {
			setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }));
			return;
		}
		await load();
	}, [filters.page, load, rows.length]);

	return {
		data: { rows: scopedPortfolio.data, meta: scopedPortfolio.meta },
		state: {
			loading: scopedPortfolio.loading,
			error: scopedPortfolio.error ?? null,
			hasDataContext: subsidiaryId !== null,
		},
		filters: {
			values: filters,
			search,
			status,
			setSearch: updateSearch,
			setStatus: updateStatus,
			setPagination: updatePagination,
			reset: resetFilters,
		},
		actions: { retry: () => load(), refresh: () => load(), refreshAfterDeletion },
		branch: { branchId, subsidiaryId },
	};
};

export default useCarteraCredito;
