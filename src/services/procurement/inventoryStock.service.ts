import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import * as inventoryStockMock from '@/mocks/services/inventoryStock.mock';
import {
	rejectEndpointNotPublished,
	throwEndpointNotPublished,
} from '@/utils/procurementEndpoint.util';

export type { IInventoryStockAvailability } from '@/mocks/services/inventoryStock.mock';

/**
 * Stock por ubicación, traslados, ajustes y documentación posterior —
 * secciones 3, 8, 9 y 11 del contrato de abastecimiento.
 *
 * Fachada con la firma pública de siempre: slices, hooks y vistas importan
 * sólo de aquí. Con `VITE_INVENTORY_STOCK_USE_MOCKS` encendida delega en el
 * doble (`@/mocks/services/inventoryStock.mock`), que guarda las procedencias
 * simuladas que también escriben las recepciones. Apagada, usa la API real.
 *
 * **El backend todavía no publica estas rutas** (Laravel Boost, 01-10-2026:
 * no hay `inventory-stock`, `warehouse-stock-movements` ni
 * `inventory-adjustments`; `stock-adjustments` e `inventory-movements` son
 * rutas legadas con otro contrato). La rama real rechaza con
 * `ProcurementEndpointNotPublishedError` en vez de inventar datos. Las rutas
 * anotadas salen de `frontend-guide.md` (PR #67 del backend) y quedan
 * **pendientes de confirmar**. Permiso previsto (§15): `view-product` para
 * leer y `edit-product` para escribir, en la sucursal.
 */

const RESOURCE = 'el inventario por ubicación';
const B = '/branches/{branch}';
const P = '/subsidiaries/{subsidiary}/procurement';

const rejectNotPublished = (endpoint: string): Promise<never> =>
	rejectEndpointNotPublished(RESOURCE, endpoint);

const throwNotPublished = (endpoint: string): never =>
	throwEndpointNotPublished(RESOURCE, endpoint);

type TInventoryStockService = Pick<
	typeof inventoryStockMock,
	| 'listInventoryStock'
	| 'listInventoryOrigins'
	| 'createInventoryDocumentAllocation'
	| 'listInitialStockAllocationsForPurchaseDocument'
	| 'createWarehouseStockMovement'
	| 'createInventoryAdjustment'
	| 'getInventoryWarehouses'
	| 'getInventoryAdjustableProducts'
	| 'getInventoryStockAvailability'
	| 'getInventoryOriginFilterOptions'
>;

const apiInventoryStock: TInventoryStockService = {
	listInventoryStock: () => rejectNotPublished(`GET ${B}/inventory-stock`),
	listInventoryOrigins: () => rejectNotPublished(`GET ${B}/inventory-stock/{product}/origins`),
	createInventoryDocumentAllocation: () =>
		rejectNotPublished(`POST ${B}/inventory-stock/{product}/document-allocations`),
	listInitialStockAllocationsForPurchaseDocument: () =>
		rejectNotPublished(`GET ${P}/purchase-documents/{document}/initial-stock-allocations`),
	createWarehouseStockMovement: () => rejectNotPublished(`POST ${B}/warehouse-stock-movements`),
	createInventoryAdjustment: () => rejectNotPublished(`POST ${B}/inventory-adjustments`),
	// Síncronas: leen el store simulado sin pasar por la red. Con la API real
	// serían lecturas asíncronas (bodegas, catálogo, saldo) que estas firmas no
	// admiten; se resuelven cuando se publiquen las rutas. Hoy sólo las llaman
	// pantallas que no se montan con la bandera apagada.
	getInventoryWarehouses: () => throwNotPublished(`GET ${B}/warehouses`),
	getInventoryAdjustableProducts: () => throwNotPublished('catálogo de productos corregibles'),
	getInventoryStockAvailability: () => throwNotPublished(`GET ${B}/inventory-stock`),
	getInventoryOriginFilterOptions: () =>
		throwNotPublished(`GET ${B}/inventory-stock/{product}/origins`),
};

const inventoryStock: TInventoryStockService = INVENTORY_STOCK_USE_MOCKS
	? inventoryStockMock
	: apiInventoryStock;

/** `GET B/inventory-stock` (§3): stock actual por ubicación. */
export const { listInventoryStock } = inventoryStock;

/** `GET B/inventory-stock/{product}/origins` (§3): procedencias de un producto. */
export const { listInventoryOrigins } = inventoryStock;

/** `POST B/inventory-stock/{product}/document-allocations` (§8): documentar stock inicial. */
export const { createInventoryDocumentAllocation } = inventoryStock;

/** `GET P/purchase-documents/{document}/initial-stock-allocations` (§6). */
export const { listInitialStockAllocationsForPurchaseDocument } = inventoryStock;

/** `POST B/warehouse-stock-movements` (§9): traslado entre ubicaciones. */
export const { createWarehouseStockMovement } = inventoryStock;

/** `POST B/inventory-adjustments` (§11): ajuste por conteo o corrección. */
export const { createInventoryAdjustment } = inventoryStock;

/** Bodegas de la sucursal para traslados y ajustes. */
export const { getInventoryWarehouses } = inventoryStock;

/** Productos que un ajuste puede corregir: los no serializados de la filial. */
export const { getInventoryAdjustableProducts } = inventoryStock;

/** Saldo vigente de un producto en la sucursal, tras aplicar un ajuste. */
export const { getInventoryStockAvailability } = inventoryStock;

/** Proveedores y documentos con los que filtrar las procedencias de un producto. */
export const { getInventoryOriginFilterOptions } = inventoryStock;
