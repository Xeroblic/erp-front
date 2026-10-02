import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import * as inventoryOperationsMock from '@/mocks/services/inventoryOperations.mock';
import { rejectEndpointNotPublished } from '@/utils/procurementEndpoint.util';

/**
 * Trazabilidad agrupada — §14 del contrato de abastecimiento.
 *
 * Fachada con la firma pública de siempre: el slice importa sólo de aquí. Con
 * `VITE_INVENTORY_STOCK_USE_MOCKS` encendida delega en el doble
 * (`@/mocks/services/inventoryOperations.mock`), que arma las operaciones con
 * lo que registraron el stock y las recepciones simulados. Apagada, usa la API
 * real.
 *
 * **El backend todavía no publica estas rutas** (Laravel Boost, 01-10-2026: no
 * hay `inventory-operations`; `inventory-movements` es la ruta legada). La rama
 * real rechaza con `ProcurementEndpointNotPublishedError` en vez de inventar
 * datos; las rutas anotadas quedan **pendientes de confirmar**. Permiso
 * previsto (§15): `view-inventory-movements`.
 */

const RESOURCE = 'la trazabilidad de inventario';
const S = '/subsidiaries/{subsidiary}';

type TInventoryOperationsService = Pick<
	typeof inventoryOperationsMock,
	'listInventoryOperations' | 'getInventoryOperation'
>;

const apiInventoryOperations: TInventoryOperationsService = {
	listInventoryOperations: () =>
		rejectEndpointNotPublished(RESOURCE, `GET ${S}/inventory-operations`),
	getInventoryOperation: () =>
		rejectEndpointNotPublished(RESOURCE, `GET ${S}/inventory-operations/{operation}`),
};

const inventoryOperations: TInventoryOperationsService = INVENTORY_STOCK_USE_MOCKS
	? inventoryOperationsMock
	: apiInventoryOperations;

/** `GET S/inventory-operations`: operaciones agrupadas, paginadas. */
export const { listInventoryOperations } = inventoryOperations;

/** `GET S/inventory-operations/{operation}`: detalle de una operación. */
export const { getInventoryOperation } = inventoryOperations;
