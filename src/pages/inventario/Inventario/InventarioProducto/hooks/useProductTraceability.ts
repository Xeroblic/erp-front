import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryWarehouses,
	inventoryBranchQueryKey,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import type { IWarehouseCompact } from '@/interface/procurement.interface';
import useInventoryTraceability from '@/pages/inventario/Inventario/hooks/useInventoryTraceability';
import { INVENTARIO_PER_PAGE_DEFAULT } from '@/pages/inventario/Inventario/types';

export interface IProductTraceabilityOptions {
	subsidiaryId: number;
	branchId: number;
	branchName: string | null;
	owner: string;
	productId: number;
}

/**
 * Trazabilidad de un producto sin serie en la ficha: las operaciones de la
 * sucursal que lo contienen (§14, `product_id`). Pide además las bodegas de la
 * sucursal (A3), porque el §14 informa sólo el ID de la ubicación y un
 * traslado pudo pasar por una bodega donde hoy no queda nada.
 */
const useProductTraceability = ({
	subsidiaryId,
	branchId,
	branchName,
	owner,
	productId,
}: IProductTraceabilityOptions) => {
	const session = useId();
	const dispatch = useAppDispatch();
	const warehousesState = useAppSelector((state) => state.inventoryOverview.warehouses);
	const [pagination, setPagination] = useState({
		page: 1,
		perPage: INVENTARIO_PER_PAGE_DEFAULT,
	});

	const params = useMemo(
		() => ({
			branch_id: branchId,
			product_id: productId,
			page: pagination.page,
			per_page: pagination.perPage,
		}),
		[branchId, productId, pagination],
	);
	const data = useInventoryTraceability({
		subsidiaryId,
		branchId,
		branchName,
		owner: `${owner}:trazabilidad`,
		params,
	});

	const warehousesRequest = useMemo(
		() => ({ branchId, ownerContext: `${owner}:trazabilidad-bodegas:${session}` }),
		[branchId, owner, session],
	);
	useEffect(() => {
		const pending = dispatch(fetchInventoryWarehouses(warehousesRequest));
		return () => {
			pending.abort();
		};
	}, [dispatch, warehousesRequest]);
	const isWarehousesCurrent =
		warehousesState.ownerContext === inventoryBranchQueryKey(warehousesRequest);
	const warehouses = useMemo(
		(): IWarehouseCompact[] =>
			isWarehousesCurrent
				? (warehousesState.response?.data ?? []).flatMap((aggregate) =>
						aggregate.warehouse
							? [{ id: aggregate.warehouse.id, name: aggregate.warehouse.name }]
							: [],
					)
				: [],
		[isWarehousesCurrent, warehousesState.response],
	);

	const paginate = useCallback(
		(page: number, perPage: number) => setPagination({ page, perPage }),
		[],
	);

	return { data, warehouses, paginate };
};

export default useProductTraceability;
