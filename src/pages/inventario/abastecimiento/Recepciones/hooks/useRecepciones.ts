import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchStockReceipts,
	selectStockReceiptsItems,
	selectStockReceiptsListError,
	selectStockReceiptsListLoading,
	selectStockReceiptsListSubsidiaryId,
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
	const { branchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const rawItems = useAppSelector(selectStockReceiptsItems);
	const rawMeta = useAppSelector(selectStockReceiptsMeta);
	const listLoading = useAppSelector(selectStockReceiptsListLoading);
	const rawError = useAppSelector(selectStockReceiptsListError);
	const listSubsidiaryId = useAppSelector(selectStockReceiptsListSubsidiaryId);
	/**
	 * Propiedad de contexto (ZF-12, hallazgo 3): `items`/`meta`/`error` del
	 * store sólo se muestran si pertenecen a la filial activa. El `pending`
	 * del thunk ya limpia `items`/`meta` al empezar una petición nueva, pero
	 * esto cubre la ventana **antes** de que esa petición llegue a salir —
	 * mientras el debounce de búsqueda todavía retiene el `dispatch` — para
	 * que un cambio de filial nunca pinte, ni por un instante, datos ajenos.
	 */
	const isCurrentSubsidiaryData = listSubsidiaryId !== null && listSubsidiaryId === subsidiaryId;
	const items = isCurrentSubsidiaryData ? rawItems : [];
	const meta = isCurrentSubsidiaryData ? rawMeta : null;
	const error = isCurrentSubsidiaryData ? rawError : null;

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
		visibleBranches,
		items,
		meta,
		loading: listLoading || isSearchDebouncing || !isCurrentSubsidiaryData,
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
