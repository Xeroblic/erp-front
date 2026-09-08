import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchPurchaseDocuments,
	selectPurchaseDocumentsItems,
	selectPurchaseDocumentsListError,
	selectPurchaseDocumentsListLoading,
	selectPurchaseDocumentsMeta,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import type { IPurchaseDocumentListParams } from '@/interface/procurement.interface';
import {
	DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS,
	DOCUMENT_STATUS_FILTER_OPTIONS,
	DOCUMENT_TYPE_FILTER_OPTIONS,
} from '../types';
import type {
	TDocumentReceptionStatusFilter,
	TDocumentStatusFilter,
	TDocumentTypeFilter,
} from '../types';

const DEFAULT_PAGE_SIZE = 15; // Defecto del contrato (sección 1).

const useDocumentosCompra = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const items = useAppSelector(selectPurchaseDocumentsItems);
	const meta = useAppSelector(selectPurchaseDocumentsMeta);
	const listLoading = useAppSelector(selectPurchaseDocumentsListLoading);
	const error = useAppSelector(selectPurchaseDocumentsListError);

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [documentType, setDocumentType] = useState<TDocumentTypeFilter>('all');
	const [status, setStatus] = useState<TDocumentStatusFilter>('all');
	const [receptionStatus, setReceptionStatus] = useState<TDocumentReceptionStatusFilter>('all');
	const [issuedFrom, setIssuedFrom] = useState('');
	const [issuedTo, setIssuedTo] = useState('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

	const isSearchDebouncing = search !== debouncedSearch;
	const normalizedSearch = debouncedSearch.trim();

	const params = useMemo<IPurchaseDocumentListParams>(
		() => ({
			search: normalizedSearch || undefined,
			document_type: documentType === 'all' ? undefined : documentType,
			status: status === 'all' ? undefined : status,
			reception_status: receptionStatus === 'all' ? undefined : receptionStatus,
			issued_from: issuedFrom || undefined,
			issued_to: issuedTo || undefined,
			page,
			per_page: perPage,
		}),
		[
			normalizedSearch,
			documentType,
			status,
			receptionStatus,
			issuedFrom,
			issuedTo,
			page,
			perPage,
		],
	);

	useEffect(() => {
		if (isSearchDebouncing) return;
		void dispatch(fetchPurchaseDocuments({ subsidiaryId, params }));
	}, [dispatch, subsidiaryId, params, isSearchDebouncing]);

	const refresh = useCallback(
		() => dispatch(fetchPurchaseDocuments({ subsidiaryId, params })),
		[dispatch, subsidiaryId, params],
	);

	/**
	 * Tras confirmar o anular, la fila puede salir del filtro vigente (un
	 * confirmado deja de calzar con «Borrador»). Igual criterio que
	 * `refreshAfterMutation` de proveedores: si era la única fila de una
	 * página que no es la primera, retrocede una en vez de dejarla vacía.
	 */
	const refreshAfterMutation = useCallback(() => {
		const isLastRowOnLastPage =
			items.length === 1 && page > 1 && meta !== null && meta.current_page === meta.last_page;
		if (isLastRowOnLastPage) {
			setPage((current) => Math.max(1, current - 1));
			return undefined;
		}
		return refresh();
	}, [items.length, meta, page, refresh]);

	const setSearchValue = useCallback((value: string) => {
		setSearch(value);
		setPage(1);
	}, []);
	const clearFilters = useCallback(() => {
		setSearch('');
		setDocumentType('all');
		setStatus('all');
		setReceptionStatus('all');
		setIssuedFrom('');
		setIssuedTo('');
		setPage(1);
	}, []);
	const setDocumentTypeValue = useCallback((value: TDocumentTypeFilter) => {
		setDocumentType(value);
		setPage(1);
	}, []);
	const setStatusValue = useCallback((value: TDocumentStatusFilter) => {
		setStatus(value);
		setPage(1);
	}, []);
	const setReceptionStatusValue = useCallback((value: TDocumentReceptionStatusFilter) => {
		setReceptionStatus(value);
		setPage(1);
	}, []);
	const setIssuedFromValue = useCallback((value: string) => {
		setIssuedFrom(value);
		setPage(1);
	}, []);
	const setIssuedToValue = useCallback((value: string) => {
		setIssuedTo(value);
		setPage(1);
	}, []);
	const onPaginationChange = useCallback((nextPage: number, nextPerPage: number) => {
		setPage(nextPage);
		setPerPage(nextPerPage);
	}, []);

	const hasActiveFilters = Boolean(
		normalizedSearch ||
			documentType !== 'all' ||
			status !== 'all' ||
			receptionStatus !== 'all' ||
			issuedFrom ||
			issuedTo,
	);

	return {
		branchId,
		subsidiaryId,
		items,
		meta,
		loading: listLoading || isSearchDebouncing,
		error,
		search,
		documentType,
		status,
		receptionStatus,
		issuedFrom,
		issuedTo,
		documentTypeOptions: DOCUMENT_TYPE_FILTER_OPTIONS,
		statusOptions: DOCUMENT_STATUS_FILTER_OPTIONS,
		receptionStatusOptions: DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS,
		hasActiveFilters,
		setSearchValue,
		clearFilters,
		setDocumentTypeValue,
		setStatusValue,
		setReceptionStatusValue,
		setIssuedFromValue,
		setIssuedToValue,
		onPaginationChange,
		refresh,
		refreshAfterMutation,
	};
};

export default useDocumentosCompra;
