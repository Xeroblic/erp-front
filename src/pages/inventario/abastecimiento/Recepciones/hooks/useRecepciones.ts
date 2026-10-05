import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { mergeListParams } from '@/utils/listSearchParams.util';
import type { IStockReceiptListParams } from '@/interface/procurement.interface';
import {
	parseRecepcionesFilters,
	RECEPCIONES_FILTER_KEYS,
	serializeRecepcionesFilters,
	STOCK_RECEIPT_STATUS_FILTER_OPTIONS,
} from '../types';
import type { IRecepcionesFilters, TStockReceiptStatusFilter } from '../types';

/**
 * Listado de recepciones (card 05, sección 7). Mismo patrón que
 * `useDocumentosCompra`: filtros y paginación en la URL (con `replace`, sin
 * tocar `?purchase_document_id=`, que abre el alta), búsqueda debounced,
 * `params` memoizado y `refreshAfterMutation` para no dejar una página vacía
 * tras anular/revertir la última fila visible.
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

	const [searchParams, setSearchParams] = useSearchParams();
	const { search, status, warehouseId, receivedFrom, receivedTo, page, perPage } = useMemo(
		() => parseRecepcionesFilters(searchParams),
		[searchParams],
	);
	const [debouncedSearch] = useDebounce(search, 300);

	/** Cualquier cambio de filtro vuelve a la página 1; sólo paginar la conserva. */
	const update = useCallback(
		(patch: Partial<IRecepcionesFilters>) => {
			setSearchParams(
				(previous) =>
					mergeListParams(
						previous,
						RECEPCIONES_FILTER_KEYS,
						serializeRecepcionesFilters({
							...parseRecepcionesFilters(previous),
							page: 1,
							...patch,
						}),
					),
				{ replace: true },
			);
		},
		[setSearchParams],
	);

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
			update({ page: Math.max(1, page - 1) });
			return undefined;
		}
		return refresh();
	}, [items.length, meta, page, refresh, update]);

	const setSearchValue = useCallback((value: string) => update({ search: value }), [update]);
	const clearFilters = useCallback(
		() =>
			update({
				search: '',
				status: 'all',
				warehouseId: '',
				receivedFrom: '',
				receivedTo: '',
			}),
		[update],
	);
	const setStatusValue = useCallback(
		(value: TStockReceiptStatusFilter) => update({ status: value }),
		[update],
	);
	const setWarehouseIdValue = useCallback(
		(value: number | '') => update({ warehouseId: value }),
		[update],
	);
	const setReceivedFromValue = useCallback(
		(value: string) => update({ receivedFrom: value }),
		[update],
	);
	const setReceivedToValue = useCallback(
		(value: string) => update({ receivedTo: value }),
		[update],
	);
	const onPaginationChange = useCallback(
		(nextPage: number, nextPerPage: number) => update({ page: nextPage, perPage: nextPerPage }),
		[update],
	);

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
