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

/** Ítem no serializado reingresado al inventario tras confirmar la devolución. */
export interface RestockedReturnItem {
	sale_item_id: number;
	product_id: number;
	quantity: number;
}

/** Respuesta al confirmar la recepción física de una devolución. */
export interface ConfirmReturnResponse {
	message: string;
	sale_id: number;
	confirmed_serials: string[];
	restocked_items: RestockedReturnItem[];
}

/**
 * Confirma la recepción física en bodega de los productos devueltos de una venta
 * previamente revertida (refunded). Devuelve al stock las series en estado
 * RETURNED y reingresa la cantidad pendiente de los ítems no serializados.
 */
export const confirmSaleReturn = async (
	subsidiaryId: number,
	saleId: number,
): Promise<ConfirmReturnResponse> => {
	const resp = await ApiService.fetchData<any>({
		url: `${base(subsidiaryId)}/${saleId}/confirm-return`,
		method: 'post',
	});
	return (resp.data?.data ?? resp.data) as ConfirmReturnResponse;
};

/** Una corrección atómica de serie (swap) sobre una línea de venta. */
export interface SerialCorrectionInput {
	sale_item_id: number;
	old_serial: string;
	new_serial: string;
	/** Opcional en el backend; el front lo exige obligatorio. */
	reason?: string;
}

/** Respuesta al corregir series de una venta. */
export interface CorrectSerialsResponse {
	message: string;
	sale_id: number;
}

/**
 * Corrige (swap atómico) una o más series mal asignadas a una venta cerrada o
 * revertida-en-tránsito. No altera montos/estado; solo intercambia la serie
 * incorrecta por la correcta. El backend valida producto/grade/estado.
 */
export const correctSaleSerials = async (
	subsidiaryId: number,
	saleId: number,
	corrections: SerialCorrectionInput[],
): Promise<CorrectSerialsResponse> => {
	const resp = await ApiService.fetchData<any>({
		url: `${base(subsidiaryId)}/${saleId}/serial-corrections`,
		method: 'post',
		data: { corrections },
	});
	return (resp.data?.data ?? resp.data) as CorrectSerialsResponse;
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

// ---------------------------------------------------------------------------
// Ventas pendientes de asignar serie (flujo híbrido serie / no-serie)
// ---------------------------------------------------------------------------

/** Serie disponible sugerida por el backend para un ítem serializado. */
export interface PendingSerialAvailableSerial {
	serial_number: string;
	branch_id: number | null;
	grade: string | null;
}

/** Ítem serializado de una venta que aún requiere asignación de serie física. */
export interface PendingSerialItem {
	sale_item_id: number;
	product_id: number;
	sku: string;
	name: string;
	grade: string | null;
	quantity: number;
	hold_quantity: number;
	available_serials: PendingSerialAvailableSerial[];
}

/** Venta confirmada con unidades serializadas en reserva pendientes de asignar. */
export interface PendingSerialSale {
	id: number;
	sale_number: string;
	wc_order_id: number | null;
	wc_order_number: string | null;
	status: string;
	is_closed: boolean;
	subsidiary_id: number;
	branch_id: number | null;
	customer_name: string | null;
	created_at: string;
	serialized_items: PendingSerialItem[];
}

export interface PendingSerialFilters {
	per_page?: number;
	page?: number;
	q?: string;
}

/**
 * Bandeja de ventas pendientes de asignar serie física (server-side pagination).
 */
export const fetchPendingSerialAssignment = async (
	subsidiaryId: number,
	filters: PendingSerialFilters = {},
): Promise<PaginatedResponse<PendingSerialSale>> => {
	const params = { per_page: 10, ...filters } as Record<string, unknown>;
	const resp = await ApiService.fetchData<PaginatedResponse<PendingSerialSale>>({
		url: `${base(subsidiaryId)}/pending-serial-assignment`,
		method: 'get',
		params,
	});
	const d = resp.data;
	return {
		data: d?.data ?? [],
		meta: d?.meta,
		links: d?.links,
	} as PaginatedResponse<PendingSerialSale>;
};

/**
 * Contador rápido (polling) de ventas con series físicas pendientes de asignar.
 * Cacheado un breve TTL y deduplicado: alimenta el badge del navbar.
 */
export const fetchPendingSerialAssignmentCount = async (
	subsidiaryId: number,
): Promise<number> => {
	const resp = await ApiService.fetchData<{ count?: number; data?: { count?: number } }>({
		url: `${base(subsidiaryId)}/pending-serial-assignment/count`,
		method: 'get',
		cacheTTLms: 15_000,
		dedupe: true,
	});
	const d = resp.data;
	return Number(d?.count ?? d?.data?.count ?? 0) || 0;
};

export const salesService = {
	fetchSalesPage,
	fetchSalesAggregated,
	fetchSalesList, // deprecated
	fetchSaleDetail,
	fetchSaleItems,
	closeSale,
	confirmSaleReturn,
	correctSaleSerials,
	createSale,
	fetchPendingSerialAssignment,
	fetchPendingSerialAssignmentCount,
};

export default salesService;
