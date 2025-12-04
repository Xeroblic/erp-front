import ApiService from '@/services/ApiService';
// 👇 Importamos la "Fuente de la Verdad". No redefinimos tipos aquí.
import {
	ISale,
	ISaleItem,
	ICreateSaleRequest,
	ICloseSaleRequest,
} from '@/interface/sales.interface';

// Filtros alineados a la documentación
export interface SalesListFilters {
	status?: string;
	wc_order_id?: string | number;
	q?: string; // Nº Venta / Nº Woo
	per_page?: number;
	page?: number;
	with_customer?: 0 | 1;
}

// Interfaces de respuesta específicas del servicio
export interface CloseSaleResponse {
	message: string;
	sale_id: number;
}

const base = (subsidiaryId: number) => `/subsidiaries/${subsidiaryId}/sales`;

/**
 * Obtiene el listado de ventas.
 * Soporta paginación automática (traer todo) o paginada por backend.
 */
export const fetchSalesList = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<{ data: ISale[]; meta?: any }> => {
	// Configuración por defecto
	const perPage = filters.per_page || 50;
	const params = { with_customer: 1, per_page: perPage, ...filters } as Record<string, any>;

	// CASO 1: Paginación controlada por Backend (Recomendado para tablas grandes)
	// Si el componente pide una página específica, solo devolvemos esa.
	if (filters.page) {
		const resp = await ApiService.fetchData<any>({
			url: base(subsidiaryId),
			method: 'get',
			params,
		});
		// Normalización de respuesta (algunos backends devuelven {data: []} y otros [])
		const payload = resp.data?.data ?? resp.data;

		if (Array.isArray(payload)) {
			return { data: payload as ISale[] };
		}
		return { data: (payload?.data ?? []) as ISale[], meta: payload?.meta };
	}

	// CASO 2: Agregación (Legacy/Stats)
	// Recorre todas las páginas. Útil si necesitas calcular totales en el frontend.
	// ⚠️ Advertencia: Puede ser lento si hay miles de ventas.
	const aggregated: ISale[] = [];
	let page = 1;
	let lastPage = 1;
	let meta: any = null;

	do {
		const resp = await ApiService.fetchData<any>({
			url: base(subsidiaryId),
			method: 'get',
			params: { ...params, page },
		});

		const rootData = resp.data; // Ajustar según estructura real (resp.data o resp)
		const payload = rootData?.data ?? rootData;

		// Determinar si es array directo o paginado
		const items = Array.isArray(payload) ? payload : payload?.data || [];

		aggregated.push(...(items as ISale[]));

		// Actualizar meta para el bucle
		meta = payload?.meta ?? rootData?.meta ?? meta;
		lastPage = meta?.last_page ?? (items.length < perPage ? page : page + 1); // Fallback simple

		page += 1;
	} while (page <= lastPage);

	return { data: aggregated, meta };
};

/**
 * Obtiene el detalle completo de una venta
 */
export const fetchSaleDetail = async (subsidiaryId: number, saleId: number): Promise<ISale> => {
	const resp = await ApiService.fetchData<any>({
		url: `${base(subsidiaryId)}/${saleId}`,
		method: 'get',
		params: { with_customer: 1 },
	});
	// Retorna ISale completo con montos formateados como strings (desde backend)
	return (resp.data?.data ?? resp.data) as ISale;
};

/**
 * Obtiene los ítems de una venta (si no vinieran en el detalle)
 */
export const fetchSaleItems = async (
	subsidiaryId: number,
	saleId: number,
): Promise<ISaleItem[]> => {
	const resp = await ApiService.fetchData<any>({
		url: `${base(subsidiaryId)}/${saleId}/items`,
		method: 'get',
	});
	return (resp.data?.data ?? resp.data) as ISaleItem[];
};

/**
 * Cierra una venta asignando series (Change Status a Completed)
 */
export const closeSale = async (
	subsidiaryId: number,
	saleId: number,
	payload: ICloseSaleRequest,
): Promise<CloseSaleResponse> => {
	const resp = await ApiService.fetchData<any>({
		url: `${base(subsidiaryId)}/${saleId}/close`,
		method: 'post',
		data: payload as any,
	});
	return (resp.data?.data ?? resp.data) as CloseSaleResponse;
};

/**
 * Crea una nueva venta manual
 */
export const createSale = async (
	subsidiaryId: number,
	payload: ICreateSaleRequest,
): Promise<ISale> => {
	const resp = await ApiService.fetchData<any>({
		url: base(subsidiaryId),
		method: 'post',
		data: payload as any,
	});
	return (resp.data?.data ?? resp.data) as ISale;
};

export const salesService = {
	fetchSalesList,
	fetchSaleDetail,
	fetchSaleItems,
	closeSale,
	createSale,
};

export default salesService;
