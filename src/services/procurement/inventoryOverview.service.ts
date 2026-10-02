import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import * as inventoryOverviewMock from '@/mocks/services/inventoryOverview.mock';
import { rejectEndpointNotPublished } from '@/utils/procurementEndpoint.util';

/**
 * Vista unificada de Inventario — A1–A4 de
 * `Docs/inventario-unificado-contrato.md` y el umbral crítico del §13 del
 * contrato de abastecimiento.
 *
 * Fachada con la firma pública de siempre: el slice importa sólo de aquí. Con
 * `VITE_INVENTORY_STOCK_USE_MOCKS` encendida delega en el doble
 * (`@/mocks/services/inventoryOverview.mock`), que agrega las procedencias del
 * stock simulado. Apagada, usa la API real.
 *
 * **El backend todavía no publica estas rutas** (Laravel Boost, 01-10-2026: no
 * hay `inventory-stock`). El umbral existe como columna del producto, pero
 * ninguna request lo valida todavía. La rama real rechaza con
 * `ProcurementEndpointNotPublishedError` en vez de inventar datos; las rutas
 * anotadas quedan **pendientes de confirmar**. Permiso previsto: `view-product`
 * en la sucursal; el umbral, `edit-product`.
 */

const RESOURCE = 'el resumen de inventario';
const B = '/branches/{branch}';

const rejectNotPublished = (endpoint: string): Promise<never> =>
	rejectEndpointNotPublished(RESOURCE, endpoint);

type TInventoryOverviewService = Pick<
	typeof inventoryOverviewMock,
	| 'listInventoryOverview'
	| 'getInventoryStockSummary'
	| 'listInventoryWarehouseAggregates'
	| 'getInventoryStockDetail'
	| 'updateInventoryCriticalThreshold'
>;

const apiInventoryOverview: TInventoryOverviewService = {
	listInventoryOverview: () => rejectNotPublished(`GET ${B}/inventory-stock?include=warehouses`),
	getInventoryStockSummary: () => rejectNotPublished(`GET ${B}/inventory-stock/summary`),
	listInventoryWarehouseAggregates: () =>
		rejectNotPublished(`GET ${B}/inventory-stock/warehouses`),
	getInventoryStockDetail: () => rejectNotPublished(`GET ${B}/inventory-stock/{product}`),
	updateInventoryCriticalThreshold: () =>
		rejectNotPublished(
			'PATCH /subsidiaries/{subsidiary}/products/{product} (critical_stock_threshold)',
		),
};

const inventoryOverview: TInventoryOverviewService = INVENTORY_STOCK_USE_MOCKS
	? inventoryOverviewMock
	: apiInventoryOverview;

/** A1 · `GET B/inventory-stock?include=warehouses`: una fila por producto. */
export const { listInventoryOverview } = inventoryOverview;

/** A2 · `GET B/inventory-stock/summary`: totales de la sucursal. */
export const { getInventoryStockSummary } = inventoryOverview;

/** A3 · `GET B/inventory-stock/warehouses`: una fila por bodega. */
export const { listInventoryWarehouseAggregates } = inventoryOverview;

/** A4 · `GET B/inventory-stock/{product}`: ficha de un producto. */
export const { getInventoryStockDetail } = inventoryOverview;

/** §13: umbral crítico del producto, entero ≥ 0 o `null` para desactivarlo. */
export const { updateInventoryCriticalThreshold } = inventoryOverview;
