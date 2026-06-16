/**
 * Servicio de API para WooCommerce — Productos
 *
 * Endpoints bajo `/subsidiaries/{subsidiary}/integrations/woocommerce/...`.
 * `subsidiaryId` siempre es el primer argumento (= ID de la sucursal en la ruta).
 */

import ApiService from './ApiService';
import type {
	QuickProductPayload,
	QuickProductResponse,
	WooSyncStockPayload,
	WooProductActionResponse,
	WooRemoteState,
} from '../types/integrations.types';

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
