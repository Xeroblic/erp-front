import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { listWarehousesForStockReceipts } from '@/services/procurement/stockReceipts.service';
import { mergeListParams } from '@/utils/listSearchParams.util';
import type {
	IStockReceiptListParams,
	IStockReceiptListRow,
} from '@/interface/procurement.interface';
import {
	parseRecepcionesFilters,
	RECEPCIONES_FILTER_KEYS,
	serializeRecepcionesFilters,
	STOCK_RECEIPT_STATUS_FILTER_OPTIONS,
} from '../types';
import type { IRecepcionesFilters, TStockReceiptStatusFilter } from '../types';

const NO_ROWS: IStockReceiptListRow[] = [];

/** Lo que se descarta al cambiar de filial: la página y la bodega son de la anterior. */
const SUBSIDIARY_RESET: Partial<IRecepcionesFilters> = { page: 1, warehouseId: '' };

/**
 * Listado de recepciones (sección 7 del contrato). Mismo patrón que
 * `useDocumentosCompra`: filtros y paginación en la URL (con `replace`, sin
 * tocar `?purchase_document_id=`, que abre el alta), búsqueda debounced y
 * `params` memoizado.
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
	 * `items`/`meta`/`error` del store sólo se muestran si pertenecen a la
	 * filial activa: cubre la ventana en que el debounce de búsqueda todavía
	 * retiene la petición nueva. Sin filial activa, el thunk rechaza con
	 * `listSubsidiaryId = null` y ese error sí es de este contexto.
	 */
	const isCurrentSubsidiaryData = listSubsidiaryId !== null && listSubsidiaryId === subsidiaryId;
	const items = isCurrentSubsidiaryData ? rawItems : NO_ROWS;
	const meta = isCurrentSubsidiaryData ? rawMeta : null;
	const error = isCurrentSubsidiaryData ? rawError : null;

	const authorizedBranchIds = useMemo(
		() => visibleBranches.map((branch) => branch.id),
		[visibleBranches],
	);
	const warehouseOptions = useMemo(
		() => listWarehousesForStockReceipts(authorizedBranchIds),
		[authorizedBranchIds],
	);

	const [searchParams, setSearchParams] = useSearchParams();
	const urlFilters = useMemo(() => parseRecepcionesFilters(searchParams), [searchParams]);

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

	/**
	 * Otra filial es otro listado: la página puede no existir y la bodega es de
	 * la anterior. Se descartan en el mismo render —la petición nunca sale con
	 * ellos— y la URL se alinea en el efecto. Pasar de `null` a una filial no
	 * es un cambio: es el perfil que terminó de cargar, y un enlace con
	 * `?warehouse_id=` debe sobrevivirlo.
	 */
	const [filtersSubsidiaryId, setFiltersSubsidiaryId] = useState(subsidiaryId);
	const isSubsidiarySwitch = filtersSubsidiaryId !== null && filtersSubsidiaryId !== subsidiaryId;
	const filters = useMemo(
		() => (isSubsidiarySwitch ? { ...urlFilters, ...SUBSIDIARY_RESET } : urlFilters),
		[isSubsidiarySwitch, urlFilters],
	);
	useEffect(() => {
		if (filtersSubsidiaryId === subsidiaryId) return;
		if (isSubsidiarySwitch) update(SUBSIDIARY_RESET);
		setFiltersSubsidiaryId(subsidiaryId);
	}, [filtersSubsidiaryId, isSubsidiarySwitch, subsidiaryId, update]);

	const { search, status, warehouseId, receivedFrom, receivedTo, page, perPage } = filters;
	const [debouncedSearch] = useDebounce(search, 300);

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
		authorizedBranchIds,
		items,
		meta,
		loading: listLoading || isSearchDebouncing || !isCurrentSubsidiaryData,
		error,
		search,
		status,
		warehouseId,
		warehouseOptions,
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
	};
};

export default useRecepciones;
