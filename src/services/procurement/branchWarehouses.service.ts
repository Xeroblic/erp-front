import ApiService from '@/services/ApiService';
import type { IInventoryWarehouseInfo } from '@/interface/inventoryOverview.interface';
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

const optionalString = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() !== '' ? value : null;

const optionalNumber = (value: unknown): number | null => {
	const parsed = typeof value === 'string' ? Number(value) : value;
	return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};

/**
 * Ficha de una bodega tal como la publica `WarehouseResource`, para la vista
 * Por bodega de Inventario. `current_capacity` no se usa: lo calcula el stock
 * legado, no el saldo por ubicación.
 */
export interface IBranchWarehouseProfile extends IInventoryWarehouseInfo {
	capacity: number | null;
	maximum_capacity: number | null;
}

/** Misma regla que `toBranchWarehouse`: sin `id`, `name` o `is_active` no se ofrece. */
const toWarehouseProfile = (value: unknown): IBranchWarehouseProfile[] => {
	const record = asRecord(value) ?? {};
	const { id, name, is_active: isActive } = record;
	if (typeof id !== 'number' || typeof name !== 'string' || typeof isActive !== 'boolean')
		return [];
	return [
		{
			id,
			name,
			is_active: isActive,
			code: optionalString(record.code),
			warehouse_type: optionalString(record.warehouse_type),
			description: optionalString(record.description),
			manager_name: optionalString(record.manager_name),
			address: optionalString(record.address),
			commune_name: optionalString(record.commune_name),
			schedule: optionalString(record.schedule),
			requires_serial_tracking: record.requires_serial_tracking === true,
			capacity: optionalNumber(record.capacity),
			maximum_capacity: optionalNumber(record.maximum_capacity),
		},
	];
};

const fetchWarehouseProfilePage = async (
	branchId: number,
	page: number,
	signal?: AbortSignal,
): Promise<{ warehouses: IBranchWarehouseProfile[]; lastPage: number }> => {
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
		warehouses: rows.flatMap(toWarehouseProfile),
		lastPage: typeof lastPage === 'number' && lastPage > 0 ? lastPage : 1,
	};
};

/** Todas las bodegas de la sucursal con su ficha, en el orden del backend (nombre). */
export const listBranchWarehouseProfiles = async (
	branchId: number,
	signal?: AbortSignal,
): Promise<IBranchWarehouseProfile[]> => {
	const first = await fetchWarehouseProfilePage(branchId, 1, signal);
	const rest = await Promise.all(
		Array.from({ length: Math.max(first.lastPage - 1, 0) }, (_, index) =>
			fetchWarehouseProfilePage(branchId, index + 2, signal),
		),
	);
	return [first, ...rest].flatMap((page) => page.warehouses);
};

export default listBranchWarehouses;
