import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { mergeListParams } from '@/utils/listSearchParams.util';
import type {
	IPurchaseDocumentListParams,
	IPurchaseDocumentListRow,
} from '@/interface/procurement.interface';
import {
	DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS,
	DOCUMENT_STATUS_FILTER_OPTIONS,
	DOCUMENT_TYPE_FILTER_OPTIONS,
	DOCUMENTOS_COMPRA_FILTER_KEYS,
	parseDocumentosCompraFilters,
	serializeDocumentosCompraFilters,
} from '../types';
import useSupplierFilterOptions from './useSupplierFilterOptions';
import type {
	IDocumentosCompraFilters,
	TDocumentReceptionStatusFilter,
	TDocumentStatusFilter,
	TDocumentTypeFilter,
} from '../types';

const NO_ROWS: IPurchaseDocumentListRow[] = [];

/** Lo que se descarta al cambiar de filial: la página y el proveedor son de la anterior. */
const SUBSIDIARY_RESET: Partial<IDocumentosCompraFilters> = { page: 1, supplierId: null };

/**
 * Listado de documentos de compra con filtros y paginación en la URL
 * (`?status=draft&supplier_id=3&page=2`): volver de una ficha o recargar
 * conserva la vista, y otra pantalla puede enlazar la lista ya filtrada. Igual
 * que `useInventarioFilters`, cada cambio usa `replace` para no llenar el
 * historial, y cualquier filtro vuelve a la página 1.
 */
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

	const [searchParams, setSearchParams] = useSearchParams();
	const urlFilters = useMemo(() => parseDocumentosCompraFilters(searchParams), [searchParams]);

	const update = useCallback(
		(patch: Partial<IDocumentosCompraFilters>) => {
			setSearchParams(
				(previous) =>
					mergeListParams(
						previous,
						DOCUMENTOS_COMPRA_FILTER_KEYS,
						serializeDocumentosCompraFilters({
							...parseDocumentosCompraFilters(previous),
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
	 * Otra filial es otro listado: la página puede no existir y el proveedor
	 * es de la anterior (el backend respondería 422). Se descartan en el mismo
	 * render —la petición nunca sale con ellos— y siguen descartados hasta que
	 * la URL los refleje: el router aplica `setSearchParams` en una transición
	 * (`v7_startTransition`), después del estado de este hook. Pasar de `null`
	 * a una filial no es un cambio: es el perfil que terminó de cargar, y un
	 * enlace con `?supplier_id=` debe sobrevivirlo.
	 */
	const [filtersSubsidiaryId, setFiltersSubsidiaryId] = useState(subsidiaryId);
	const isSubsidiarySwitch = filtersSubsidiaryId !== null && filtersSubsidiaryId !== subsidiaryId;
	const isUrlReset = urlFilters.page === 1 && urlFilters.supplierId === null;
	const filters = useMemo(
		() => (isSubsidiarySwitch ? { ...urlFilters, ...SUBSIDIARY_RESET } : urlFilters),
		[isSubsidiarySwitch, urlFilters],
	);
	useEffect(() => {
		if (filtersSubsidiaryId === subsidiaryId) return;
		if (isSubsidiarySwitch && !isUrlReset) {
			update(SUBSIDIARY_RESET);
			return;
		}
		setFiltersSubsidiaryId(subsidiaryId);
	}, [filtersSubsidiaryId, isSubsidiarySwitch, isUrlReset, subsidiaryId, update]);

	const {
		search,
		documentType,
		status,
		receptionStatus,
		supplierId,
		issuedFrom,
		issuedTo,
		page,
		perPage,
	} = filters;
	const [debouncedSearch] = useDebounce(search, 300);
	const supplierFilter = useSupplierFilterOptions(subsidiaryId, supplierId);

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
			supplier_id: supplierId ?? undefined,
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
			supplierId,
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

	const setSearchValue = useCallback((value: string) => update({ search: value }), [update]);
	const clearFilters = useCallback(
		() =>
			update({
				search: '',
				documentType: 'all',
				status: 'all',
				receptionStatus: 'all',
				supplierId: null,
				issuedFrom: '',
				issuedTo: '',
			}),
		[update],
	);
	const setDocumentTypeValue = useCallback(
		(value: TDocumentTypeFilter) => update({ documentType: value }),
		[update],
	);
	const setStatusValue = useCallback(
		(value: TDocumentStatusFilter) => update({ status: value }),
		[update],
	);
	const setReceptionStatusValue = useCallback(
		(value: TDocumentReceptionStatusFilter) => update({ receptionStatus: value }),
		[update],
	);
	const setSupplierIdValue = useCallback(
		(value: number | null) => update({ supplierId: value }),
		[update],
	);
	const setIssuedFromValue = useCallback(
		(value: string) => update({ issuedFrom: value }),
		[update],
	);
	const setIssuedToValue = useCallback((value: string) => update({ issuedTo: value }), [update]);
	const onPaginationChange = useCallback(
		(nextPage: number, nextPerPage: number) => update({ page: nextPage, perPage: nextPerPage }),
		[update],
	);

	const hasActiveFilters = Boolean(
		normalizedSearch ||
			documentType !== 'all' ||
			status !== 'all' ||
			receptionStatus !== 'all' ||
			supplierId !== null ||
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
		supplierId,
		issuedFrom,
		issuedTo,
		documentTypeOptions: DOCUMENT_TYPE_FILTER_OPTIONS,
		statusOptions: DOCUMENT_STATUS_FILTER_OPTIONS,
		receptionStatusOptions: DOCUMENT_RECEPTION_STATUS_FILTER_OPTIONS,
		supplierOptions: supplierFilter.options,
		supplierOptionsLoading: supplierFilter.loading,
		canFilterBySupplier: supplierFilter.canList,
		hasActiveFilters,
		setSearchValue,
		clearFilters,
		setDocumentTypeValue,
		setStatusValue,
		setReceptionStatusValue,
		setSupplierIdValue,
		setIssuedFromValue,
		setIssuedToValue,
		onPaginationChange,
		refresh,
		isCreateModalOpen,
		setIsCreateModalOpen,
	};
};

export default useDocumentosCompra;
