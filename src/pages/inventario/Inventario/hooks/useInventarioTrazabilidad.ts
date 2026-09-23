import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryOperationDetail,
	fetchInventoryOperations,
	inventoryOperationDetailQueryKey,
	inventoryOperationsQueryKey,
	type IOperationDetailRequest,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import type {
	IInventoryOperationDetail,
	IInventoryOperationMatchParams,
	IInventoryOperationsParams,
} from '@/interface/inventoryOperations.interface';

export interface IInventarioTrazabilidadOptions {
	subsidiaryId: number;
	branchId: number;
	/** Nombre de la sucursal activa: el mock no lo conoce y lo necesita para `branch`. */
	branchName: string | null;
	owner: string;
	/** Filtros del §14, ya acotados a la sucursal. El llamador los memoiza. */
	params: IInventoryOperationsParams;
}

export interface IOperacionDetalleState {
	detail: IInventoryOperationDetail | null;
	loading: boolean;
	error: string | null;
}

/**
 * Trazabilidad de los productos sin serie (§14): operaciones de la sucursal,
 * de la más nueva a la más antigua, y el detalle de cada una al desplegarla.
 *
 * Lo usan la pestaña Trazabilidad (filtros en la URL) y la ficha del producto
 * (fijo a `product_id`). Igual que el resto de Inventario, cada consulta
 * guarda la clave de quien la pidió y sólo se pinta si coincide (ZF-12).
 */
const useInventarioTrazabilidad = ({
	subsidiaryId,
	branchId,
	branchName,
	owner,
	params,
}: IInventarioTrazabilidadOptions) => {
	const session = useId();
	const dispatch = useAppDispatch();
	const ownerContext = `${owner}:${session}`;
	const operations = useAppSelector((state) => state.inventoryOverview.operations);
	const details = useAppSelector((state) => state.inventoryOverview.operationDetails);
	const [retry, setRetry] = useState(0);

	const listRequest = useMemo(
		() => ({ subsidiaryId, branchId, branchName, ownerContext, params }),
		[subsidiaryId, branchId, branchName, ownerContext, params],
	);
	useEffect(() => {
		const pending = dispatch(fetchInventoryOperations(listRequest));
		return () => {
			pending.abort();
		};
	}, [dispatch, listRequest, retry]);

	const listKey = inventoryOperationsQueryKey(listRequest);
	const isCurrent = operations.ownerContext === listKey;
	const refresh = useCallback(() => setRetry((value) => value + 1), []);

	// El detalle marca los ítems con los mismos filtros de la lista, sin paginar.
	const matchParams = useMemo((): IInventoryOperationMatchParams => {
		const match = { ...params };
		delete match.page;
		delete match.per_page;
		return match;
	}, [params]);
	const detailRequestOf = useCallback(
		(operationId: string): IOperationDetailRequest => ({
			subsidiaryId,
			branchId,
			branchName,
			ownerContext,
			operationId,
			params: matchParams,
		}),
		[subsidiaryId, branchId, branchName, ownerContext, matchParams],
	);

	/** Cada lista nueva (otros filtros o reintento) empieza con todo plegado. */
	const expansionKey = `${listKey}:${retry}`;
	const [expansion, setExpansion] = useState<{ key: string; ids: string[] }>({
		key: expansionKey,
		ids: [],
	});
	const expanded = useMemo(
		() => (expansion.key === expansionKey ? expansion.ids : []),
		[expansion, expansionKey],
	);

	const pendingDetails = useRef(new Map<string, { abort: () => void }>());
	useEffect(() => {
		const pending = pendingDetails.current;
		return () => {
			pending.forEach((request) => request.abort());
			pending.clear();
		};
	}, [detailRequestOf]);

	const loadDetail = useCallback(
		(operationId: string) => {
			pendingDetails.current.get(operationId)?.abort();
			pendingDetails.current.set(
				operationId,
				dispatch(fetchInventoryOperationDetail(detailRequestOf(operationId))),
			);
		},
		[dispatch, detailRequestOf],
	);

	const detailOf = useCallback(
		(operationId: string): IOperacionDetalleState => {
			const slot = details[operationId];
			const current =
				slot?.ownerContext ===
				inventoryOperationDetailQueryKey(detailRequestOf(operationId));
			return {
				detail: current ? (slot.response?.data ?? null) : null,
				loading: !current || slot.loading,
				error: current ? slot.error : null,
			};
		},
		[details, detailRequestOf],
	);

	const toggle = useCallback(
		(operationId: string) => {
			const isOpen = expanded.includes(operationId);
			setExpansion({
				key: expansionKey,
				ids: isOpen
					? expanded.filter((id) => id !== operationId)
					: [...expanded, operationId],
			});
			if (!isOpen && !detailOf(operationId).detail) loadDetail(operationId);
		},
		[expanded, expansionKey, detailOf, loadDetail],
	);

	return {
		response: isCurrent ? operations.response : null,
		loading: !isCurrent || operations.loading,
		error: isCurrent ? operations.error : null,
		refresh,
		expanded,
		toggle,
		detailOf,
		retryDetail: loadDetail,
	};
};

export default useInventarioTrazabilidad;

export type TInventarioTrazabilidad = ReturnType<typeof useInventarioTrazabilidad>;
