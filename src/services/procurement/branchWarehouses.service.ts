import ApiService from '@/services/ApiService';
import type { IStockReceiptWarehouse } from '@/interface/procurement.interface';

/**
 * `GET /branches/{branch}/warehouses` (`view-warehouse`), recorrido completo.
 * Lo comparten el traslado (origen y destino) y la recepción (bodega que
 * recibe): una bodega que falte no se podría elegir.
 *
 * Sin caché de `ApiService`: una bodega desactivada tiene que dejar de
 * ofrecerse como destino en la próxima apertura.
 */

const WAREHOUSES_PER_PAGE = 100;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

/**
 * Una fila sin `id`, `name` o `is_active` legibles no se ofrece: no se podría
 * nombrar ni validar. La sucursal es la consultada: la ruta sólo lista las
 * bodegas de esa sucursal.
 */
const toBranchWarehouse = (value: unknown, branchId: number): IStockReceiptWarehouse[] => {
	const { id, name, is_active: isActive } = asRecord(value) ?? {};
	if (typeof id !== 'number' || typeof name !== 'string' || typeof isActive !== 'boolean')
		return [];
	return [{ id, name, is_active: isActive, branch_id: branchId }];
};

const fetchWarehousePage = async (
	branchId: number,
	page: number,
	signal?: AbortSignal,
): Promise<{ warehouses: IStockReceiptWarehouse[]; lastPage: number }> => {
	const response = await ApiService.fetchData<unknown>({
		url: `/branches/${branchId}/warehouses`,
		method: 'get',
		params: { page, per_page: WAREHOUSES_PER_PAGE },
		signal,
	});
	const body = asRecord(response.data);
	const rows = Array.isArray(body?.data) ? body.data : [];
	const lastPage = asRecord(body?.meta)?.last_page;
	return {
		warehouses: rows.flatMap((row) => toBranchWarehouse(row, branchId)),
		lastPage: typeof lastPage === 'number' && lastPage > 0 ? lastPage : 1,
	};
};

/** Todas las bodegas de la sucursal, activas e inactivas, con su estado. */
const listBranchWarehouses = async (
	branchId: number,
	signal?: AbortSignal,
): Promise<IStockReceiptWarehouse[]> => {
	const first = await fetchWarehousePage(branchId, 1, signal);
	const rest = await Promise.all(
		Array.from({ length: Math.max(first.lastPage - 1, 0) }, (_, index) =>
			fetchWarehousePage(branchId, index + 2, signal),
		),
	);
	return [first, ...rest].flatMap((page) => page.warehouses);
};

export default listBranchWarehouses;
