import ApiService from '@/services/ApiService';
import type {
	IProcurementPageParams,
	IProductPurchaseHistoryParams,
	IProductPurchaseHistoryResponse,
	IProductSuppliersResponse,
} from '@/interface/procurement.interface';

/**
 * Compras por producto — sección 12 del contrato de abastecimiento (tarea 18),
 * `/api/subsidiaries/{subsidiary}/procurement/products/{product}/…`.
 *
 * Contrato verificado contra el backend (`ProductPurchaseController`):
 * - Leer exige `view-product`. Un producto de otra filial responde 404.
 * - Ambas rutas leen sólo las recepciones de las sucursales que el usuario
 *   alcanza: dos usuarios pueden ver sugerencias y conteos distintos.
 * - La sugerencia, el orden y los conteos los decide el backend; el front los
 *   muestra tal cual.
 * - Paginadas: 15 por defecto, 100 como máximo.
 *
 * Sólo API real: no hay doble, el backend ya publica las dos rutas. Sin caché
 * de `ApiService`: una recepción nueva cambia la sugerencia.
 */

const productPurchasesUrl = (subsidiaryId: number, productId: number): string =>
	`/subsidiaries/${subsidiaryId}/procurement/products/${productId}`;

/** Proveedores que vendieron el producto, el sugerido primero. */
export const listProductSuppliers = async (
	subsidiaryId: number,
	productId: number,
	params: Partial<IProcurementPageParams> = {},
	signal?: AbortSignal,
): Promise<IProductSuppliersResponse> => {
	const response = await ApiService.fetchData<IProductSuppliersResponse>({
		url: `${productPurchasesUrl(subsidiaryId, productId)}/suppliers`,
		method: 'get',
		params,
		signal,
	});
	return response.data;
};

/** Cada compra del producto, la más reciente primero. Los filtros vacíos no viajan. */
export const listProductPurchaseHistory = async (
	subsidiaryId: number,
	productId: number,
	params: IProductPurchaseHistoryParams = {},
	signal?: AbortSignal,
): Promise<IProductPurchaseHistoryResponse> => {
	const response = await ApiService.fetchData<IProductPurchaseHistoryResponse>({
		url: `${productPurchasesUrl(subsidiaryId, productId)}/purchase-history`,
		method: 'get',
		params: Object.fromEntries(
			Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
		),
		signal,
	});
	return response.data;
};
