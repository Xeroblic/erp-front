import { pagesConfig, type PageConfig } from '@/config/pages.config';

/**
 * Destino de un enlace entre fichas del flujo de abastecimiento: la ruta ya
 * armada y el `authority` de la página. Quien enlaza comprueba ese mismo
 * arreglo con la semántica de `AuthorityCheck` (todos los permisos), así un
 * enlace nunca lleva a una ruta que redirige a «sin permisos».
 */
export interface IPageLink {
	to: string;
	authority: readonly string[];
}

const { subPages } = pagesConfig.inventory;

/**
 * Sustituye el único parámetro de la ruta declarada en `pages.config`. No usa
 * `generatePath` de react-router: esto es configuración, y varias pruebas
 * reemplazan ese módulo sin reexportarlo.
 */
const detailLink = (page: PageConfig, param: string, id: number): IPageLink => ({
	to: page.to.replace(`:${param}`, encodeURIComponent(String(id))),
	authority: page.authority,
});

/** Ficha del proveedor (`view-procurement-supplier`). */
export const supplierDetailLink = (supplierId: number): IPageLink =>
	detailLink(subPages.proveedoresDetalle, 'proveedorId', supplierId);

/** Ficha del documento de compra (`view-purchase-document`). */
export const purchaseDocumentDetailLink = (documentId: number): IPageLink =>
	detailLink(subPages.documentosCompraDetalle, 'documentoId', documentId);

/** Ficha de la recepción (`view-product`). */
export const stockReceiptDetailLink = (receiptId: number): IPageLink =>
	detailLink(subPages.recepcionDetalle, 'recepcionId', receiptId);

/**
 * Listado de documentos de compra filtrado por proveedor
 * (`view-purchase-document`). El listado lee `supplier_id` de la URL.
 */
export const supplierPurchaseDocumentsLink = (supplierId: number): IPageLink => ({
	to: `${subPages.documentosCompra.to}?supplier_id=${encodeURIComponent(String(supplierId))}`,
	authority: subPages.documentosCompra.authority,
});
