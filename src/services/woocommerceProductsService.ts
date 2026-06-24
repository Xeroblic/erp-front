/**
 * Servicio de API para WooCommerce — Productos / Términos
 *
 * Endpoints bajo `/subsidiaries/{subsidiary}/integrations/woocommerce/...`.
 * `subsidiaryId` siempre es el primer argumento (= ID de la sucursal en la ruta).
 *
 * Todas las funciones aceptan un `integrationId` opcional. Cuando se pasa,
 * se envía como query param `integration_id` para que el backend dirija la
 * petición a la integración correcta (soporta multi-tienda por subsidiaria).
 */

import ApiService from './ApiService';
import type {
	ImportTermsPayload,
	ImportTermsResponse,
	ImportTermsStatus,
	ImportTermsStatusQueryParams,
	QuickProductPayload,
	QuickProductResponse,
	WooProduct,
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
	WooProductsQueryParams,
} from '../types/integrations.types';

const withIntegration = (
	params: object | undefined,
	integrationId?: string,
): Record<string, unknown> | undefined => {
	if (!integrationId) return params as Record<string, unknown> | undefined;
	return { ...params, integration_id: integrationId };
};

// ==================== IMPORTACIÓN DE TÉRMINOS (CATEGORÍAS / MARCAS) ====================

/**
 * #1 · Programa la importación masiva de términos (categorías/marcas) desde
 * la tienda WooCommerce hacia el ERP. Devuelve el lote (job en cola).
 * `POST /import-terms`
 */
export const importTerms = async (
	subsidiaryId: number,
	payload: ImportTermsPayload,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<ImportTermsResponse, ImportTermsPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/import-terms`,
		method: 'POST',
		data: payload,
		params: integrationId ? { integration_id: integrationId } : undefined,
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<ImportTermsStatus>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/import-terms/status`,
		method: 'GET',
		params: withIntegration(params, integrationId),
	});
	return response.data;
};

// ==================== PRODUCTOS ====================

/**
 * #4 · Creación rápida de producto: lo registra en el ERP y lo manda a
 * publicar en WooCommerce.
 * `POST /quick-products`
 */
export const createQuickProduct = async (
	subsidiaryId: number,
	payload: QuickProductPayload,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<QuickProductResponse, QuickProductPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/quick-products`,
		method: 'POST',
		data: payload,
		params: integrationId ? { integration_id: integrationId } : undefined,
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}`,
		method: 'POST',
		data: payload ?? {},
		params: integrationId ? { integration_id: integrationId } : undefined,
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}`,
		method: 'DELETE',
		data: payload ?? {},
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * #7 · Estado remoto: consulta en vivo Woo y lo contrasta con el ERP.
 * `GET /products/{product}/remote`
 */
export const getProductRemoteState = async (
	subsidiaryId: number,
	productId: number,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooRemoteState>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/remote`,
		method: 'GET',
		params: integrationId ? { integration_id: integrationId } : undefined,
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooCompareResult>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/woo-compare`,
		method: 'GET',
		params: withIntegration(params, integrationId),
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooCandidate[]>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/woo-candidates`,
		method: 'GET',
		params: withIntegration(params, integrationId),
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
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooLinkResponse, WooLinkPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/link`,
		method: 'POST',
		data: payload,
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * Desvincula un producto del emparejamiento manual con WooCommerce.
 * `DELETE /products/{product}/link`
 */
export const unlinkProduct = async (
	subsidiaryId: number,
	productId: number,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooUnlinkResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/link`,
		method: 'DELETE',
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

// ==================== ENDPOINTS PENDIENTES WOOCOMMERCE ====================

/**
 * #3 · Listar productos vinculados y con errores de WooCommerce.
 * `GET /products`
 */
export const getWooProducts = async (
	subsidiaryId: number,
	params?: WooProductsQueryParams,
	integrationId?: string,
) => {
	const normalizedParams = params ? { ...params } : {};
	if (typeof normalizedParams.only_errors === 'boolean') {
		normalizedParams.only_errors = normalizedParams.only_errors ? 1 : 0;
	}

	const response = await ApiService.fetchData<{ data?: WooProduct[] } | WooProduct[]>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products`,
		method: 'GET',
		params: withIntegration(normalizedParams, integrationId),
	});
	// El backend envuelve la lista en `{ data: [...] }` (wrapper de Laravel).
	// Soporta también respuesta como array directo por robustez.
	const body = response.data;
	return Array.isArray(body) ? body : (body.data ?? []);
};

/**
 * #8 · Sincronizar solo el precio en WooCommerce.
 * `POST /products/{product}/sync-price`
 */
export const syncProductPrice = async (
	subsidiaryId: number,
	productId: number,
	payload?: WooSyncStockPayload,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/sync-price`,
		method: 'POST',
		data: payload ?? {},
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * #9 · Sincronizar solo el stock en WooCommerce.
 * `POST /products/{product}/sync-stock`
 */
export const syncProductStock = async (
	subsidiaryId: number,
	productId: number,
	payload?: WooSyncStockPayload,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/sync-stock`,
		method: 'POST',
		data: payload ?? {},
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * #10 · Publicar o sincronizar variaciones de un producto padre.
 * `POST /products/{product}/publish-children`
 */
export const publishProductChildren = async (
	subsidiaryId: number,
	productId: number,
	payload?: WooSyncStockPayload,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<WooProductActionResponse, WooSyncStockPayload>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/${productId}/publish-children`,
		method: 'POST',
		data: payload ?? {},
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

