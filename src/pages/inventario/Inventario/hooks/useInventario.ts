import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryOverview,
	fetchInventorySummary,
	fetchInventoryWarehouses,
	inventoryBranchQueryKey,
	inventoryOverviewQueryKey,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import { INVENTORY_OVERVIEW_FEATURES } from '@/services/procurement/inventoryOverview.service';
import type { IInventoryOverviewParams } from '@/interface/inventoryOverview.interface';
import {
	inventoryLocationParams,
	type IInventarioFilters,
} from '@/pages/inventario/Inventario/types';

/**
 * Datos de la vista de Inventario para la sucursal activa: alertas (A2),
 * bodegas (A3) y, en la vista General, la lista de productos (A1).
 *
 * Se monta dentro de una sesión con `key` por usuario/filial/sucursal: un
 * cambio de contexto desmonta todo en vez de pintar la respuesta anterior
 * mientras llega la nueva. Además cada consulta compara su `ownerContext`
 * con la clave de esta instancia (ZF-12).
 */
const useInventario = (
	branchId: number,
	owner: string,
	filtros: IInventarioFilters,
	/** La ficha de bodega no muestra las alertas de la sucursal: no pide A2. */
	{ withSummary = true }: { withSummary?: boolean } = {},
) => {
	const session = useId();
	const dispatch = useAppDispatch();
	const ownerContext = `${owner}:${session}`;
	const state = useAppSelector((root) => root.inventoryOverview);
	const [retry, setRetry] = useState(0);

	const branchRequest = useMemo(() => ({ branchId, ownerContext }), [branchId, ownerContext]);
	const { ubicacion, estado, busqueda, orden, page, perPage, vista } = filtros;
	const listRequest = useMemo(() => {
		const params: IInventoryOverviewParams = {
			...inventoryLocationParams(ubicacion),
			include: 'warehouses',
			search: busqueda.trim() || undefined,
			// Sin umbral ni orden publicados no se piden: un enlace viejo con
			// `estado` u `orden` no cambia una consulta que no los entiende.
			stock_status: INVENTORY_OVERVIEW_FEATURES.stockStatus
				? (estado ?? undefined)
				: undefined,
			sort: INVENTORY_OVERVIEW_FEATURES.sort ? orden : undefined,
			page,
			per_page: perPage,
		};
		return { branchId, ownerContext, params };
	}, [branchId, ownerContext, ubicacion, busqueda, estado, orden, page, perPage]);

	useEffect(() => {
		const summary = withSummary ? dispatch(fetchInventorySummary(branchRequest)) : null;
		const warehouses = dispatch(fetchInventoryWarehouses(branchRequest));
		return () => {
			summary?.abort();
			warehouses.abort();
		};
	}, [dispatch, branchRequest, retry, withSummary]);

	useEffect(() => {
		if (vista !== 'general') return undefined;
		const list = dispatch(fetchInventoryOverview(listRequest));
		return () => {
			list.abort();
		};
	}, [dispatch, listRequest, vista, retry]);

	const branchKey = inventoryBranchQueryKey(branchRequest);
	const listKey = inventoryOverviewQueryKey(listRequest);
	const isSummaryCurrent = state.summary.ownerContext === branchKey;
	const isWarehousesCurrent = state.warehouses.ownerContext === branchKey;
	const isListCurrent = state.list.ownerContext === listKey;

	const refresh = useCallback(() => setRetry((value) => value + 1), []);

	return {
		summary: isSummaryCurrent ? (state.summary.response?.data ?? null) : null,
		summaryLoading: !isSummaryCurrent || state.summary.loading,
		summaryError: isSummaryCurrent ? state.summary.error : null,
		warehouses: isWarehousesCurrent ? (state.warehouses.response?.data ?? []) : [],
		warehousesLoading: !isWarehousesCurrent || state.warehouses.loading,
		warehousesError: isWarehousesCurrent ? state.warehouses.error : null,
		list: isListCurrent ? state.list.response : null,
		listLoading: !isListCurrent || state.list.loading,
		listError: isListCurrent ? state.list.error : null,
		refresh,
	};
};

export default useInventario;
