
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
	WooUnlinkAllResponse,
	WooProductsQueryParams,
} from '../types/integrations.types';

const withIntegration = (
	params: object | undefined,
	integrationId?: string,
): Record<string, unknown> | undefined => {
	if (!integrationId) return params as Record<string, unknown> | undefined;
	return { ...params, integration_id: integrationId };
};

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

/**
 * Desvinculación masiva ERP ↔ WooCommerce de todos los productos sincronizados de la
 * subsidiaria. Con `dryRun=true` solo informa cuántos hay vinculados (no toca nada);
 * con `dryRun=false` encola el job de desvinculación (soft-delete reversible, no modifica
 * las fichas en la tienda). Acción destructiva limitada a super-admin en la UI.
 */
export const unlinkAllProducts = async (subsidiaryId: number, dryRun: boolean) => {
	const response = await ApiService.fetchData<WooUnlinkAllResponse>({
		url: `/subsidiaries/${subsidiaryId}/integrations/woocommerce/products/unlink-all`,
		method: 'POST',
		data: { dry_run: dryRun },
	});
	return response.data;
};

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

	const body = response.data;
	return Array.isArray(body) ? body : (body.data ?? []);
};

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

