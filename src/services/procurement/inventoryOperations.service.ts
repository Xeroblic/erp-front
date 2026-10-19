import INVENTORY_OPERATIONS_USE_MOCKS from '@/config/inventoryOperations.config';
import * as inventoryOperationsMock from '@/mocks/services/inventoryOperations.mock';
import ApiService from '@/services/ApiService';
import type {
	IInventoryOperationDetailResponse,
	IInventoryOperationMatchParams,
	IInventoryOperationsParams,
	IInventoryOperationsResponse,
} from '@/interface/inventoryOperations.interface';

/**
 * Trazabilidad agrupada — §14 del contrato de abastecimiento (tarea 17).
 *
 * Fachada con la firma pública de siempre: el slice importa sólo de aquí. Con
 * `VITE_INVENTORY_OPERATIONS_USE_MOCKS` encendida delega en el doble
 * (`@/mocks/services/inventoryOperations.mock`), que arma las operaciones con
 * lo que registraron el stock y las recepciones simulados. Apagada, usa la API
 * real.
 *
 * Contrato verificado contra el backend (`routes/apis/inventoryOperations.php`,
 * `ListInventoryOperationsRequest` y los Resources de `Inventory/`):
 * - Permiso `view-inventory-movements` más acceso a **todas** las sucursales
 *   que toca la operación (regla D2): si falta una, la operación no aparece en
 *   la lista y su detalle responde 403.
 * - Lista paginada, 15 por defecto y 100 como máximo, con
 *   `context.pending_movements_count` al nivel de `data`.
 * - El detalle se pide por UUID y acepta los filtros de la lista sólo para
 *   marcar `matches_filter`.
 * - `warehouse_id` y `unlocated` son excluyentes: `unlocated` se omite si no
 *   está encendido, porque enviarlo en `0` junto a la bodega es 422.
 *
 * Sin caché de `ApiService`: el motor agrupa movimientos segundos después de
 * escribirlos, y el slice ya descarta respuestas tardías por `requestId`. Los
 * errores llegan crudos para que el slice los resuelva con
 * `resolveProcurementError` (el 403 del detalle no es un error inesperado).
 */

interface IInventoryOperationsRequestOptions {
	signal?: AbortSignal;
	/** Sólo lo usa el doble, que no conoce nombres de sucursal. */
	branchName?: string | null;
}

interface IInventoryOperationsService {
	listInventoryOperations: (
		subsidiaryId: number,
		params: IInventoryOperationsParams,
		options?: IInventoryOperationsRequestOptions,
	) => Promise<IInventoryOperationsResponse>;
	getInventoryOperation: (
		subsidiaryId: number,
		operationId: string,
		params: IInventoryOperationMatchParams,
		options?: IInventoryOperationsRequestOptions,
	) => Promise<IInventoryOperationDetailResponse>;
}

const operationsUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/inventory-operations`;

/**
 * Parámetros tal como los valida el backend: `unlocated` sólo encendido y
 * nunca junto a una bodega, y sin búsqueda vacía. Axios ya omite los
 * `undefined`.
 */
export const toInventoryOperationsQuery = (
	params: IInventoryOperationsParams,
): IInventoryOperationsParams => {
	const { unlocated, search, ...query } = params;
	const term = search?.trim();
	return {
		...query,
		...(unlocated === 1 && query.warehouse_id === undefined ? { unlocated } : {}),
		...(term ? { search: term } : {}),
	};
};

const apiInventoryOperations: IInventoryOperationsService = {
	listInventoryOperations: async (subsidiaryId, params, { signal } = {}) => {
		const response = await ApiService.fetchData<IInventoryOperationsResponse>({
			url: operationsUrl(subsidiaryId),
			method: 'get',
			params: toInventoryOperationsQuery(params),
			signal,
		});
		return response.data;
	},
	getInventoryOperation: async (subsidiaryId, operationId, params, { signal } = {}) => {
		const response = await ApiService.fetchData<IInventoryOperationDetailResponse>({
			url: `${operationsUrl(subsidiaryId)}/${encodeURIComponent(operationId)}`,
			method: 'get',
			params: toInventoryOperationsQuery(params),
			signal,
		});
		return response.data;
	},
};

const inventoryOperations: IInventoryOperationsService = INVENTORY_OPERATIONS_USE_MOCKS
	? inventoryOperationsMock
	: apiInventoryOperations;

/** `GET S/inventory-operations`: operaciones agrupadas, paginadas. */
export const { listInventoryOperations } = inventoryOperations;

/** `GET S/inventory-operations/{inventoryOperation}`: detalle de una operación. */
export const { getInventoryOperation } = inventoryOperations;
