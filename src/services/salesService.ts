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

/**
 * Metadata de paginación de Laravel
 */
export interface PaginationMeta {
	current_page: number;
	from: number | null;
	last_page: number;
	per_page: number;
	to: number | null;
	total: number;
}

/**
 * Links de paginación de Laravel
 */
export interface PaginationLinks {
	first: string | null;
	last: string | null;
	prev: string | null;
	next: string | null;
}

/**
 * Respuesta paginada completa de Laravel
 */
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}

const base = (subsidiaryId: number) => `/subsidiaries/${subsidiaryId}/sales`;

/**
 * Obtiene UNA PÁGINA de ventas (recomendado para tablas con server-side pagination).
 * Retorna la estructura completa con data, meta y links.
 */
export const fetchSalesPage = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<PaginatedResponse<ISale>> => {
	const params = { with_customer: 1, per_page: 10, ...filters } as Record<string, any>;

	const resp = await ApiService.fetchData<any>({
		url: base(subsidiaryId),
		method: 'get',
		params,
	});

	// Laravel retorna { data: [...], meta: {...}, links: {...} }
	const rootData = resp.data;

	return {
		data: (rootData?.data ?? []) as ISale[],
		meta: rootData?.meta ?? {
			current_page: 1,
			from: null,
			last_page: 1,
			per_page: 10,
			to: null,
			total: 0,
		},
		links: rootData?.links ?? {
			first: null,
			last: null,
			prev: null,
			next: null,
		},
	};
};

/**
 * LEGACY: Agrega TODAS las páginas de ventas (útil para exportación/estadísticas).
 * ⚠️ NO usar en tablas UI. Puede ser muy lento con muchas ventas.
 * Retorna solo el array de ventas.
 */
export const fetchSalesAggregated = async (
	subsidiaryId: number,
	filters: Omit<SalesListFilters, 'page'> = {},
): Promise<ISale[]> => {
	const perPage = filters.per_page || 50;
	const params = { with_customer: 1, per_page: perPage, ...filters } as Record<string, any>;

	const aggregated: ISale[] = [];
	let page = 1;
	let lastPage = 1;

	do {
		const resp = await ApiService.fetchData<any>({
			url: base(subsidiaryId),
			method: 'get',
			params: { ...params, page },
		});

		const rootData = resp.data;
		const items = (rootData?.data ?? []) as ISale[];
		aggregated.push(...items);

		// Actualizar meta para el bucle
		const meta = rootData?.meta;
		lastPage = meta?.last_page ?? (items.length < perPage ? page : page + 1);
		page += 1;
	} while (page <= lastPage);

	return aggregated;
};

/**
 * DEPRECATED: Mantener solo por compatibilidad con código legacy.
 * Usar fetchSalesPage para nuevas implementaciones.
 */
export const fetchSalesList = async (
	subsidiaryId: number,
	filters: SalesListFilters = {},
): Promise<{ data: ISale[]; meta?: any }> => {
	// Si viene page, devolver UNA página
	if (filters.page !== undefined) {
		const result = await fetchSalesPage(subsidiaryId, filters);
		return { data: result.data, meta: result.meta };
	}

	// Si no viene page, agregar todo (legacy)
	const data = await fetchSalesAggregated(subsidiaryId, filters);
	return { data };
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
	fetchSalesPage,
	fetchSalesAggregated,
	fetchSalesList, // deprecated
	fetchSaleDetail,
	fetchSaleItems,
	closeSale,
	createSale,
};

export default salesService;
