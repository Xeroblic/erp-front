import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryStock,
	inventoryStockQueryKey,
} from '@/store/slices/procurement/inventoryStockSlice';
import { getInventoryWarehouses } from '@/services/procurement/inventoryStock.service';
import { inventoryLocationParams } from '@/pages/inventario/abastecimiento/StockPorUbicacion/types';

/**
 * Filtros de búsqueda y ubicación: no son un formulario que se envía, así
 * que viven en `useState` simple y no en Formik/Yup — no hay nada que
 * validar ni que mostrar en rojo (§ CLAUDE.md 2.3 aplica a formularios, no a
 * este tipo de filtros de listado, igual criterio que el resto de
 * abastecimiento — `useProveedores`, `useRecepciones`).
 */

/** Mounted by a keyed, authorized session; the key changes with user/branch/subsidiary. */
export default function useStockPorUbicacion(branchId: number, context: string) {
	const session = useId();
	const dispatch = useAppDispatch();
	const raw = useAppSelector((state) => state.inventoryStock.list);
	const [pagination, setPagination] = useState({ page: 1, per_page: 15 });
	const [search, setSearch] = useState('');
	const [location, setLocation] = useState('branch');
	const [retry, setRetry] = useState(0);
	const locationParams = useMemo(() => inventoryLocationParams(location), [location]);
	const request = useMemo(
		() => ({
			branchId,
			ownerContext: `${context}:${session}`,
			params: { ...locationParams, search: search.trim() || undefined, ...pagination },
		}),
		[branchId, context, session, locationParams, search, pagination],
	);
	const queryKey = inventoryStockQueryKey(request);
	const isCurrent = raw.ownerContext === queryKey;
	const response = isCurrent ? raw.response : null;
	const error = isCurrent ? raw.error : null;
	const loading = !isCurrent || raw.loading;
	useEffect(() => {
		const pending = dispatch(fetchInventoryStock(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry]);
	const setFilter = useCallback((field: 'search' | 'location', value: string) => {
		setPagination((current) => ({ ...current, page: 1 }));
		if (field === 'search') setSearch(value);
		else setLocation(value);
	}, []);
	const clearFilters = useCallback(() => {
		setSearch('');
		setLocation('branch');
		setPagination({ page: 1, per_page: 15 });
	}, []);
	const paginate = useCallback((page: number, per_page: number) => {
		setPagination({ page, per_page });
	}, []);
	const refresh = useCallback(() => setRetry((value) => value + 1), []);
	const warehouses = useMemo(() => getInventoryWarehouses(branchId), [branchId]);
	return {
		search,
		location,
		setFilter,
		clearFilters,
		response,
		error,
		loading,
		paginate,
		refresh,
		warehouses,
		locationParams,
	};
}
