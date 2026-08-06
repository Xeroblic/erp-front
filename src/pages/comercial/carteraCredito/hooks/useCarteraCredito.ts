import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type {
	DeferredPaymentCreditProfilesFilters,
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentCreditProfileListItem,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import type { CreditProfileStatusFilter } from '../types';

const DEFAULT_FILTERS: DeferredPaymentCreditProfilesFilters = { page: 1, per_page: 20 };

const getErrorMessage = (error: unknown): string => {
	if (error !== null && typeof error === 'object' && 'response' in error) {
		const { response } = error;
		if (response !== null && typeof response === 'object' && 'status' in response) {
			if (response.status === 403) return 'No tenés acceso a esta subsidiaria.';
		}
	}
	return 'No se pudo cargar la cartera de crédito.';
};

const useCarteraCredito = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();
	const [filters, setFilters] = useState<DeferredPaymentCreditProfilesFilters>(DEFAULT_FILTERS);
	const [status, setStatus] = useState<CreditProfileStatusFilter>('all');
	const [search, setSearch] = useState('');
	const [rows, setRows] = useState<IDeferredPaymentCreditProfileListItem[]>([]);
	const [meta, setMeta] = useState<DeferredPaymentsPaginationMeta | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);
	const [debouncedSearch] = useDebounce(search, 300);

	const requestFilters = useMemo(
		() => ({
			...filters,
			search: debouncedSearch.trim() || undefined,
			active: status === 'all' ? undefined : status === 'active',
		}),
		[debouncedSearch, filters, status],
	);

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (subsidiaryId === null) return;
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
				if (signal?.aborted || requestId !== requestIdRef.current) return;
				setRows(response.data);
				setMeta(response.meta);
			} catch (requestError: unknown) {
				if (signal?.aborted || requestId !== requestIdRef.current) return;
				setRows([]);
				setMeta(null);
				setError(getErrorMessage(requestError));
			} finally {
				if (!signal?.aborted && requestId === requestIdRef.current) setLoading(false);
			}
		},
		[requestFilters, subsidiaryId],
	);

	useEffect(() => {
		requestIdRef.current += 1;
		setRows([]);
		setMeta(null);
		setError(null);
		setFilters(DEFAULT_FILTERS);
		setStatus('all');
		setSearch('');
	}, [subsidiaryId]);

	useEffect(() => {
		if (subsidiaryId === null) return undefined;
		const controller = new AbortController();
		load(controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [load, subsidiaryId]);

	const updateSearch = useCallback((value: string) => {
		setSearch(value);
		setFilters((current) => ({ ...current, page: 1 }));
	}, []);
	const updateStatus = useCallback((value: CreditProfileStatusFilter) => {
		setStatus(value);
		setFilters((current) => ({ ...current, page: 1 }));
	}, []);
	const updatePagination = useCallback((page: number, perPage: number) => {
		setFilters((current) => ({ ...current, page, per_page: perPage }));
	}, []);

	return {
		data: { rows, meta },
		state: { loading, error, hasDataContext: subsidiaryId !== null },
		filters: {
			values: filters,
			search,
			status,
			setSearch: updateSearch,
			setStatus: updateStatus,
			setPagination: updatePagination,
		},
		actions: { retry: () => load(), refresh: () => load() },
		branch: { branchId, subsidiaryId },
	};
};

export default useCarteraCredito;
