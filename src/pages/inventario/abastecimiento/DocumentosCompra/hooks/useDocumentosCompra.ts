import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchPurchaseDocuments,
	selectPurchaseDocumentsItems,
	selectPurchaseDocumentsListError,
	selectPurchaseDocumentsListLoading,
	selectPurchaseDocumentsListSubsidiaryId,
	selectPurchaseDocumentsMeta,
} from '@/store/slices/procurement/purchaseDocumentsSlice';
import type {
	IPurchaseDocumentListParams,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';
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

/**
 * El contrato usa 15 por defecto, pero el paginador estándar sólo ofrece 5,
 * 10, 20, 30, 40 y 50: con 15 el selector mostraba «Mostrar 5» mientras la
 * tabla listaba 15. Se pide 20, una de sus opciones.
 */
const DEFAULT_PAGE_SIZE = 20;
const NO_ROWS: IPurchaseDocumentListRow[] = [];

const useDocumentosCompra = () => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const storedItems = useAppSelector(selectPurchaseDocumentsItems);
	const storedMeta = useAppSelector(selectPurchaseDocumentsMeta);
	const listLoading = useAppSelector(selectPurchaseDocumentsListLoading);
	const storedError = useAppSelector(selectPurchaseDocumentsListError);
	const listSubsidiaryId = useAppSelector(selectPurchaseDocumentsListSubsidiaryId);

	/**
	 * Mismo criterio que `useProveedores`: el listado del store es de la última
	 * filial que respondió y la petición nueva recién sale en el efecto. Hasta
	 * que llegue, lo de la filial anterior no se muestra: vacío y en carga.
	 */
	const isListForSubsidiary = listSubsidiaryId === subsidiaryId;
	const items = isListForSubsidiary ? storedItems : NO_ROWS;
	const meta = isListForSubsidiary ? storedMeta : null;
	const error = isListForSubsidiary ? storedError : null;

	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [documentType, setDocumentType] = useState<TDocumentTypeFilter>('all');
	const [status, setStatus] = useState<TDocumentStatusFilter>('all');
	const [receptionStatus, setReceptionStatus] = useState<TDocumentReceptionStatusFilter>('all');
	const [issuedFrom, setIssuedFrom] = useState('');
	const [issuedTo, setIssuedTo] = useState('');
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

	// Otra filial es otro listado: se vuelve a la página 1 en el mismo render,
	// para no pedir una página que puede no existir en la nueva.
	const [pageSubsidiaryId, setPageSubsidiaryId] = useState(subsidiaryId);
	if (pageSubsidiaryId !== subsidiaryId) {
		setPageSubsidiaryId(subsidiaryId);
		setPage(1);
	}

	/**
	 * El alta queda atada a la filial en que se abrió: si cambia, el modal se
	 * cierra en vez de crear en la filial nueva con proveedor y productos
	 * elegidos en la anterior.
	 */
	const [createModalSubsidiaryId, setCreateModalSubsidiaryId] = useState<number | null>(null);
	const isCreateModalOpen = subsidiaryId !== null && createModalSubsidiaryId === subsidiaryId;
	// Fuera de su filial se descarta, para que volver a ella no lo reabra.
	if (createModalSubsidiaryId !== null && !isCreateModalOpen) setCreateModalSubsidiaryId(null);
	const setIsCreateModalOpen = useCallback(
		(open: boolean) => setCreateModalSubsidiaryId(open ? subsidiaryId : null),
		[subsidiaryId],
	);

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
		loading: listLoading || isSearchDebouncing || !isListForSubsidiary,
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
		isCreateModalOpen,
		setIsCreateModalOpen,
	};
};

export default useDocumentosCompra;
