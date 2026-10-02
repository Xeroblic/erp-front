import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import * as stockReceiptsMock from '@/mocks/services/stockReceipts.mock';
import {
	rejectEndpointNotPublished,
	throwEndpointNotPublished,
} from '@/utils/procurementEndpoint.util';

/**
 * Recepciones físicas — sección 7 del contrato de abastecimiento,
 * `/api/subsidiaries/{subsidiary}/procurement/stock-receipts`.
 *
 * Fachada con la firma pública de siempre: slices, hooks y vistas importan
 * sólo de aquí. Con `VITE_INVENTORY_STOCK_USE_MOCKS` encendida delega en el
 * doble (`@/mocks/services/stockReceipts.mock`), que además hace de backend en
 * los efectos cruzados sobre el documento y el stock simulado. Apagada, usa la
 * API real.
 *
 * **El backend todavía no publica estas rutas** (Laravel Boost, 01-10-2026:
 * bajo `procurement` sólo existen `suppliers` y `purchase-documents`). Mientras
 * tanto, la rama real rechaza con `ProcurementEndpointNotPublishedError` en
 * vez de inventar datos. Las rutas anotadas en cada función salen del contrato
 * (`frontend-guide.md` §7–§8, PR #67 del backend) y quedan **pendientes de
 * confirmar** —método, campos, nulabilidad y permiso efectivo— el día que se
 * publiquen. Permiso previsto (§15): `view-product` para leer y `edit-product`
 * para escribir, más `view-purchase-document` si la recepción tiene documento.
 */

/**
 * Recepciones trabaja con proveedores de prueba mientras no tenga backend.
 * Quien muestre datos de recepciones junto a un proveedor real (la ficha de
 * Proveedores) lo consulta para no cruzar un id real con la semilla. Pasa a
 * `false` el día que la rama real de esta fachada llame a rutas publicadas.
 */
export const STOCK_RECEIPTS_USE_TEST_SUPPLIERS = true;

const RESOURCE = 'las recepciones';
const P = '/subsidiaries/{subsidiary}/procurement';

const rejectNotPublished = (endpoint: string): Promise<never> =>
	rejectEndpointNotPublished(RESOURCE, endpoint);

const throwNotPublished = (endpoint: string): never =>
	throwEndpointNotPublished(RESOURCE, endpoint);

type TStockReceiptsService = Pick<
	typeof stockReceiptsMock,
	| 'listStockReceipts'
	| 'listStockReceiptsForPurchaseDocument'
	| 'getStockReceipt'
	| 'createStockReceipt'
	| 'updateStockReceipt'
	| 'cancelStockReceipt'
	| 'postStockReceipt'
	| 'retryStockReceipt'
	| 'reverseStockReceipt'
	| 'linkStockReceiptPurchaseDocument'
	| 'listWarehousesForStockReceipts'
	| 'getStockReceiptWarehouseBranchId'
	| 'listStockReceiptSuppliers'
>;

const apiStockReceipts: TStockReceiptsService = {
	listStockReceipts: () => rejectNotPublished(`GET ${P}/stock-receipts`),
	listStockReceiptsForPurchaseDocument: () =>
		rejectNotPublished(`GET ${P}/purchase-documents/{document}/stock-receipts`),
	getStockReceipt: () => rejectNotPublished(`GET ${P}/stock-receipts/{receipt}`),
	createStockReceipt: () => rejectNotPublished(`POST ${P}/stock-receipts`),
	updateStockReceipt: () => rejectNotPublished(`PATCH ${P}/stock-receipts/{receipt}`),
	cancelStockReceipt: () => rejectNotPublished(`POST ${P}/stock-receipts/{receipt}/cancel`),
	postStockReceipt: () => rejectNotPublished(`POST ${P}/stock-receipts/{receipt}/post`),
	retryStockReceipt: () => rejectNotPublished(`POST ${P}/stock-receipts/{receipt}/retry`),
	reverseStockReceipt: () => rejectNotPublished(`POST ${P}/stock-receipts/{receipt}/reverse`),
	linkStockReceiptPurchaseDocument: () =>
		rejectNotPublished(`PUT ${P}/stock-receipts/{receipt}/purchase-document`),
	// Síncronas: el catálogo real de bodegas (`GET /branches/{branch}/warehouses`)
	// exige una lectura asíncrona que esta firma no admite. Se resuelve cuando
	// se publiquen las recepciones; hasta entonces no se ofrece la semilla.
	listWarehousesForStockReceipts: () => throwNotPublished('catálogo de bodegas de recepción'),
	getStockReceiptWarehouseBranchId: () => throwNotPublished('catálogo de bodegas de recepción'),
	// El maestro real de proveedores sí está publicado, pero este selector sólo
	// sirve para crear una recepción, que no lo está. Llamarlo desde aquí, aun
	// con import dinámico, cierra el ciclo `ApiService → store →
	// stockReceiptsSlice → fachada`. Se conecta junto con la rama real.
	listStockReceiptSuppliers: () => rejectNotPublished(`POST ${P}/stock-receipts`),
};

const stockReceipts: TStockReceiptsService = INVENTORY_STOCK_USE_MOCKS
	? stockReceiptsMock
	: apiStockReceipts;

/** `GET /stock-receipts`. Orden `received_on` DESC, ID DESC. */
export const { listStockReceipts } = stockReceipts;

/** `GET /purchase-documents/{document}/stock-receipts`: resumen paginado. */
export const { listStockReceiptsForPurchaseDocument } = stockReceipts;

/** `GET /stock-receipts/{receipt}`: detalle con `ETag`. */
export const { getStockReceipt } = stockReceipts;

/** `POST /stock-receipts`: 201 `draft`, con o sin documento. */
export const { createStockReceipt } = stockReceipts;

/** `PATCH /stock-receipts/{receipt}`: `draft`, también corrige `failed`. Exige `If-Match`. */
export const { updateStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/cancel`: `draft`/`failed` → `cancelled`. */
export const { cancelStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/post`: 202 `queued`; la UI consulta el detalle. */
export const { postStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/retry`: `failed` → `queued` sin tocar el payload. */
export const { retryStockReceipt } = stockReceipts;

/** `POST /stock-receipts/{receipt}/reverse`: `posted` → `reversed`. */
export const { reverseStockReceipt } = stockReceipts;

/** `PUT /stock-receipts/{receipt}/purchase-document`: vínculo posterior, único. */
export const { linkStockReceiptPurchaseDocument } = stockReceipts;

/** Bodegas que se ofrecen en el alta/edición, filtradas por sucursales autorizadas. */
export const { listWarehousesForStockReceipts } = stockReceipts;

/** Sucursal dueña de una bodega de recepción, o `null` si no existe. */
export const { getStockReceiptWarehouseBranchId } = stockReceipts;

/** Proveedores del selector del alta sin documento. */
export const { listStockReceiptSuppliers } = stockReceipts;
