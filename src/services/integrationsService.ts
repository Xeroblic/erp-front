/**
 * Servicio de API para el módulo de Integraciones
 * Endpoints para gestionar integraciones WooCommerce y mapeo de productos
 */

import ApiService from './ApiService';
import type {
	Integration,
	CreateIntegrationPayload,
	CreateIntegrationResponse,
	UpdateIntegrationPayload,
	UpdateIntegrationResponse,
	IntegrationsQueryParams,
	UnmappedWooCommerceProduct,
	UnmappedProductsQueryParams,
	MappedProductsQueryParams,
	SyncedProductsQueryParams,
	SyncedProduct,
	MapProductPayload,
	CheckOrImportOrderResponse,
	ImportMissingOrdersResponse,
	SyncStockResponse,
	SyncStockPayload,
	WebhookCatalogEntry,
	WebhookCatalogResponse,
} from '../types/integrations.types';

// ==================== GESTIÓN DE INTEGRACIONES ====================

/**
 * Obtener lista de integraciones de una subsidiaria
 */
export const getIntegrations = async (subsidiaryId: number, params?: IntegrationsQueryParams) => {
	const response = await ApiService.fetchData<{ data: Integration[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Obtener detalle de una integración
 */
export const getIntegration = async (subsidiaryId: number, integrationId: string) => {
	const response = await ApiService.fetchData<{ data: Integration }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}`,
		method: 'GET',
	});
	return response.data;
};

/**
 * Crear una nueva integración
 */
export const createIntegration = async (
	subsidiaryId: number,
	payload: CreateIntegrationPayload,
) => {
	const response = await ApiService.fetchData<CreateIntegrationResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations`,
		method: 'POST',
		data: payload,
	});
	return response.data;
};

/**
 * Actualizar una integración existente
 */
export const updateIntegration = async (
	subsidiaryId: number,
	integrationId: string,
	payload: UpdateIntegrationPayload,
) => {
	const response = await ApiService.fetchData<UpdateIntegrationResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}`,
		method: 'PATCH',
		data: payload,
	});
	return response.data;
};

/**
 * Eliminar una integración
 */
export const deleteIntegration = async (subsidiaryId: number, integrationId: string) => {
	const response = await ApiService.fetchData<{ message: string }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}`,
		method: 'DELETE',
	});
	return response.data;
};

// ==================== CATÁLOGO DE WEBHOOKS ENTRANTES ====================

/**
 * Obtener el catálogo dinámico de webhooks entrantes que soporta el ERP, agrupado por
 * proveedor/webhook (cada entrada trae sus topics, efectos y notas).
 *
 * Es global (no depende de subsidiaria) y prácticamente estático, por lo que se cachea
 * unos minutos y se deduplica.
 */
export const getWebhookCatalog = async (): Promise<WebhookCatalogEntry[]> => {
	const response = await ApiService.fetchData<WebhookCatalogResponse>({
		url: `/integrations/webhooks/catalog`,
		method: 'GET',
		cacheTTLms: 300_000,
		dedupe: true,
	});
	return response.data?.data ?? [];
};

// ==================== PRODUCTOS NO MAPEADOS (POR INTEGRACIÓN) ====================

/**
 * Obtener productos no mapeados pendientes de una integración
 */
export const getUnmappedProducts = async (
	subsidiaryId: number,
	integrationId: string,
	params?: UnmappedProductsQueryParams,
) => {
	const response = await ApiService.fetchData<{ data: UnmappedWooCommerceProduct[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Obtener productos mapeados de una integración
 */
export const getMappedProducts = async (
	subsidiaryId: number,
	integrationId: string,
	params?: MappedProductsQueryParams,
) => {
	const response = await ApiService.fetchData<{ data: UnmappedWooCommerceProduct[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/mapped`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Obtener productos sincronizados ERP ↔ WooCommerce
 */
export const getSyncedProducts = async (
	subsidiaryId: number,
	integrationId: string,
	params?: SyncedProductsQueryParams,
) => {
	const response = await ApiService.fetchData<{ data: SyncedProduct[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/synced-products`,
		method: 'GET',
		params: { ...params, filter_by_integration: params?.filter_by_integration ? 1 : 0 },
	});
	return response.data;
};

/**
 * Obtener detalle de un producto no mapeado
 */
export const getUnmappedProductDetail = async (
	subsidiaryId: number,
	integrationId: string,
	unmappedProductId: number,
) => {
	const response = await ApiService.fetchData<{ data: UnmappedWooCommerceProduct }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/${unmappedProductId}`,
		method: 'GET',
	});
	return response.data;
};

/**
 * Mapear un producto no mapeado a un producto del ERP
 */
export const mapProduct = async (
	subsidiaryId: number,
	integrationId: string,
	unmappedProductId: number,
	payload: MapProductPayload,
) => {
	const response = await ApiService.fetchData<{ message: string }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/${unmappedProductId}/map`,
		method: 'POST',
		data: payload,
	});
	return response.data;
};

/**
 * Desmapear un producto (volver a pending)
 */
export const unmapProduct = async (
	subsidiaryId: number,
	integrationId: string,
	unmappedProductId: number,
) => {
	const response = await ApiService.fetchData<{ message: string }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/${unmappedProductId}/unmap`,
		method: 'POST',
	});
	return response.data;
};

/**
 * Ignorar un producto no mapeado
 */
export const ignoreUnmappedProduct = async (
	subsidiaryId: number,
	integrationId: string,
	unmappedProductId: number,
) => {
	const response = await ApiService.fetchData<{ message: string }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/${integrationId}/unmapped-products/${unmappedProductId}`,
		method: 'DELETE',
	});
	return response.data;
};

// ==================== PRODUCTOS NO MAPEADOS (CONSOLIDADO) ====================

/**
 * Obtener productos no mapeados pendientes (consolidado de todas las integraciones)
 */
export const getConsolidatedUnmappedProducts = async (
	subsidiaryId: number,
	params?: UnmappedProductsQueryParams,
) => {
	const response = await ApiService.fetchData<{ data: UnmappedWooCommerceProduct[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/unmapped-products`,
		method: 'GET',
		params,
	});
	return response.data;
};

/**
 * Obtener productos mapeados (consolidado de todas las integraciones)
 */
export const getConsolidatedMappedProducts = async (
	subsidiaryId: number,
	params?: MappedProductsQueryParams,
) => {
	const response = await ApiService.fetchData<{ data: UnmappedWooCommerceProduct[] }>({
		url: `/subsidiaries/${subsidiaryId}/integrations/unmapped-products/mapped`,
		method: 'GET',
		params,
	});
	return response.data;
};

// ==================== WOOCOMMERCE API REST (ADMIN) ====================

/**
 * Verificar o importar una orden de WooCommerce por ID
 */
export const checkOrImportOrder = async (
	subsidiaryId: number,
	wcOrderId: number,
	integrationId?: string,
) => {
	const response = await ApiService.fetchData<CheckOrImportOrderResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/orders/${wcOrderId}/check-or-import`,
		method: 'GET',
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * Importar órdenes faltantes de manera incremental
 */
export const importMissingOrders = async (subsidiaryId: number, integrationId?: string) => {
	const response = await ApiService.fetchData<ImportMissingOrdersResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/import-missing-orders`,
		method: 'POST',
		data: {},
		params: integrationId ? { integration_id: integrationId } : undefined,
	});
	return response.data;
};

/**
 * Sincronizar stock con WooCommerce
 */
export const syncStock = async (
	subsidiaryId: number,
	integrationId: string,
	payload: SyncStockPayload,
) => {
	const response = await ApiService.fetchData<SyncStockResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/sync-stock`,
		method: 'POST',
		params: { integration_id: integrationId },
		data: payload,
	});
	return response.data;
};
