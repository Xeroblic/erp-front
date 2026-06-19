/**
 * Servicio de API para WooCommerce — Productos / Términos
 *
 * Endpoints bajo `/subsidiaries/{subsidiary}/integrations/woocommerce/...`.
 * `subsidiaryId` siempre es el primer argumento (= ID de la sucursal en la ruta).
 */

import ApiService from './ApiService';
import type {
	ImportTermsPayload,
	ImportTermsResponse,
	ImportTermsStatus,
	ImportTermsStatusQueryParams,
	QuickProductPayload,
	QuickProductResponse,
	WooSyncStockPayload,
	WooProductActionResponse,
	WooRemoteState,
	WooCompareParams,
	WooCompareResult,
	WooCandidatesParams,
	WooCandidate,
	WooLinkPayload,
	WooLinkResponse,
	WooUnlinkResponse,
} from '../types/integrations.types';

// ==================== IMPORTACIÓN DE TÉRMINOS (CATEGORÍAS / MARCAS) ====================

/**
 * #1 · Programa la importación masiva de términos (categorías/marcas) desde
 * la tienda WooCommerce hacia el ERP. Devuelve el lote (job en cola).
 * `POST /import-terms`
 */
export const importTerms = async (subsidiaryId: number, payload: ImportTermsPayload) => {
	const response = await ApiService.fetchData<ImportTermsResponse, ImportTermsPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/import-terms`,
		method: 'POST',
		data: payload,
	});
	return response.data;
};

/**
 * #2 · Consulta el progreso del lote de importación de términos (#1).
 * `GET /import-terms/status`
 */
export const getImportTermsStatus = async (
	subsidiaryId: number,
	params?: ImportTermsStatusQueryParams,
) => {
	const response = await ApiService.fetchData<ImportTermsStatus>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/import-terms/status`,
		method: 'GET',
		params,
	});
	return response.data;
};

// ==================== PRODUCTOS ====================

/**
 * #4 · Creación rápida de producto: lo registra en el ERP y lo manda a
 * publicar en WooCommerce.
 * `POST /quick-products`
 */
export const createQuickProduct = async (subsidiaryId: number, payload: QuickProductPayload) => {
	const response = await ApiService.fetchData<QuickProductResponse, QuickProductPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/quick-products`,
		method: 'POST',
		data: payload,
	});
	return response.data;
};

/**
 * #5 · Publica o actualiza por completo el producto en WooCommerce.
 * `POST /products/{product}`
 */
export const publishProduct = async (
	subsidiaryId: number,
	productId: number,
	payload?: WooSyncStockPayload,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}`,
		method: 'POST',
		data: payload ?? {},
	});
	return response.data;
};

/**
 * #6 · Despublica el producto: lo desvincula / pasa a borrador en Woo.
 * `DELETE /products/{product}`
 */
export const unpublishProduct = async (
	subsidiaryId: number,
	productId: number,
	payload?: WooSyncStockPayload,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}`,
		method: 'DELETE',
		data: payload ?? {},
	});
	return response.data;
};

/**
 * #7 · Estado remoto: consulta en vivo Woo y lo contrasta con el ERP.
 * `GET /products/{product}/remote`
 */
export const getProductRemoteState = async (subsidiaryId: number, productId: number) => {
	const response = await ApiService.fetchData<WooRemoteState>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/remote`,
		method: 'GET',
	});
	return response.data;
};

// ==================== EMPAREJAMIENTO MANUAL ====================

/**
 * Compara datos ERP vs WooCommerce antes de vincular.
 * `GET /products/{product}/woo-compare`
 */
export const compareProduct = async (
	subsidiaryId: number,
	productId: number,
	params: WooCompareParams,
) => {
	const response = await ApiService.fetchData<WooCompareResult>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/woo-compare`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Busca candidatos en WooCommerce para emparejamiento manual.
 * `GET /products/{product}/woo-candidates`
 */
export const searchCandidates = async (
	subsidiaryId: number,
	productId: number,
	params?: WooCandidatesParams,
) => {
	const response = await ApiService.fetchData<WooCandidate[]>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/woo-candidates`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Vincula manualmente un producto ERP con uno de WooCommerce.
 * `POST /products/{product}/link`
 */
export const linkProduct = async (
	subsidiaryId: number,
	productId: number,
	payload: WooLinkPayload,
) => {
	const response = await ApiService.fetchData<WooLinkResponse, WooLinkPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/link`,
		method: 'POST',
		data: payload,
	});
	return response.data;
};

/**
 * Desvincula un producto del emparejamiento manual con WooCommerce.
 * `DELETE /products/{product}/link`
 */
export const unlinkProduct = async (subsidiaryId: number, productId: number) => {
	const response = await ApiService.fetchData<WooUnlinkResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/link`,
		method: 'DELETE',
	});
	return response.data;
};
