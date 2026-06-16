/**
 * Servicio de API para WooCommerce — Importación de términos (categorías/marcas)
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
