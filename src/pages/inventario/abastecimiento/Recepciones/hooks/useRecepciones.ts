import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchStockReceipts,
	selectStockReceiptsItems,
	selectStockReceiptsListError,
	selectStockReceiptsListLoading,
	selectStockReceiptsMeta,
} from '@/store/slices/procurement/stockReceiptsSlice';
import type { IStockReceiptListParams } from '@/interface/procurement.interface';
import { STOCK_RECEIPT_STATUS_FILTER_OPTIONS } from '../types';
import type { TStockReceiptStatusFilter } from '../types';

const DEFAULT_PAGE_SIZE = 15; // Defecto del contrato (sección 1).

/**
 * Listado de recepciones (card 05, sección 7). Mismo patrón que
 * `useDocumentosCompra`: filtros locales debounced, `params` memoizado y
 * `refreshAfterMutation` para no dejar una página vacía tras anular/revertir
 * la última fila visible.
 */
const useRecepciones = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const items = useAppSelector(selectStockReceiptsItems);
	const meta = useAppSelector(selectStockReceiptsMeta);
	const listLoading = useAppSelector(selectStockReceiptsListLoading);
	const error = useAppSelector(selectStockReceiptsListError);

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [status, setStatus] = useState<TStockReceiptStatusFilter>('all');
	const [warehouseId, setWarehouseId] = useState<number | ''>('');
	const [receivedFrom, setReceivedFrom] = useState('');
	const [receivedTo, setReceivedTo] = useState('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

	const isSearchDebouncing = search !== debouncedSearch;
	const normalizedSearch = debouncedSearch.trim();

	const params = useMemo<IStockReceiptListParams>(
		() => ({
			search: normalizedSearch || undefined,
			status: status === 'all' ? undefined : status,
			warehouse_id: warehouseId === '' ? undefined : warehouseId,
			received_from: receivedFrom || undefined,
			received_to: receivedTo || undefined,
			page,
			per_page: perPage,
		}),
		[normalizedSearch, status, warehouseId, receivedFrom, receivedTo, page, perPage],
	);

	useEffect(() => {
		if (isSearchDebouncing) return;
		void dispatch(fetchStockReceipts({ subsidiaryId, params }));
	}, [dispatch, subsidiaryId, params, isSearchDebouncing]);

	const refresh = useCallback(
		() => dispatch(fetchStockReceipts({ subsidiaryId, params })),
		[dispatch, subsidiaryId, params],
	);

	/**
	 * Tras anular/publicar, la fila puede salir del filtro vigente. Igual
	 * criterio que `refreshAfterMutation` de documentos: si era la única fila
	 * de una página que no es la primera, retrocede una en vez de dejarla
	 * vacía.
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
		setStatus('all');
		setWarehouseId('');
		setReceivedFrom('');
		setReceivedTo('');
		setPage(1);
	}, []);
	const setStatusValue = useCallback((value: TStockReceiptStatusFilter) => {
		setStatus(value);
		setPage(1);
	}, []);
	const setWarehouseIdValue = useCallback((value: number | '') => {
		setWarehouseId(value);
		setPage(1);
	}, []);
	const setReceivedFromValue = useCallback((value: string) => {
		setReceivedFrom(value);
		setPage(1);
	}, []);
	const setReceivedToValue = useCallback((value: string) => {
		setReceivedTo(value);
		setPage(1);
	}, []);
	const onPaginationChange = useCallback((nextPage: number, nextPerPage: number) => {
		setPage(nextPage);
		setPerPage(nextPerPage);
	}, []);

	const hasActiveFilters = Boolean(
		normalizedSearch || status !== 'all' || warehouseId !== '' || receivedFrom || receivedTo,
	);

	return {
		branchId,
		subsidiaryId,
		items,
		meta,
		loading: listLoading || isSearchDebouncing,
		error,
		search,
		status,
		warehouseId,
		receivedFrom,
		receivedTo,
		statusOptions: STOCK_RECEIPT_STATUS_FILTER_OPTIONS,
		hasActiveFilters,
		setSearchValue,
		clearFilters,
		setStatusValue,
		setWarehouseIdValue,
		setReceivedFromValue,
		setReceivedToValue,
		onPaginationChange,
		refresh,
		refreshAfterMutation,
	};
};

export default useRecepciones;
