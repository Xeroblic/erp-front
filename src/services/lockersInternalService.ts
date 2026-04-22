import ApiService from './ApiService';

// ─────────────────────────────────────────────────
// Interfaces de los Casilleros (Vista Interna / Técnico)
// ─────────────────────────────────────────────────

/** Ubicación (sede) donde hay casilleros */
export interface ILockerLocation {
	id: number;
	name: string;
	address?: string;
	[key: string]: any;
}

/** Un casillero individual */
export interface ILockerInternal {
	id: number;
	locker_number: string;
	qr_token: string;
	status: 'available' | 'occupied' | 'maintenance' | 'reserved';
	current_pin?: string;
	customer_name?: string;
	customer_email?: string;
	customer_phone?: string;
	device_description?: string;
	device_brand?: string;
	device_model?: string;
	serial_number?: string;
	service_type?: string;
	is_invoice?: boolean;
	invoice_rut?: string;
	invoice_company_name?: string;
	invoice_company_address?: string;
	check_in_at?: string;
	check_out_at?: string;
	created_at?: string;
	updated_at?: string;
	[key: string]: any;
}

/** Orden de servicio asociada a un casillero */
export interface IServiceOrder {
	id: number;
	locker_id?: number;
	locker_number?: string;
	customer_name?: string;
	customer_email?: string;
	device_description?: string;
	device_brand?: string;
	device_model?: string;
	service_type?: string;
	status?: string;
	created_at?: string;
	updated_at?: string;
	[key: string]: any;
}

/** Respuesta genérica de acciones */
export interface ILockerActionResponse {
	success: boolean;
	message?: string;
	[key: string]: any;
}

// ─────────────────────────────────────────────────
// Payloads exactos según Postman / Laravel
// ─────────────────────────────────────────────────

/** POST /lockers/tech/withdraw — Técnico retira equipo del casillero */
export interface ITechWithdrawRequest {
	service_order_id: number;
	new_locker_pin: string;
}

/** POST /lockers/tech/drop-off — Técnico deposita equipo reparado */
export interface ITechDropOffRequest {
	locker_id: number;
	service_order_id: number;
	new_locker_pin: string;
}

/** POST /lockers/tech/reset — Resetear casillero */
export interface ITechResetRequest {
	locker_id: number;
	new_locker_pin: string;
}

/** PATCH /lockers/set-ready-for-pickup — Marcar listo para retiro */
export interface ISetReadyForPickupRequest {
	service_order_id: number;
	pin_manual: string;
}

// ─────────────────────────────────────────────────
// Servicio de Casilleros (Interno / Autenticado)
// Rutas: /lockers/... con auth:api
// ─────────────────────────────────────────────────
export const lockersInternalService = {
	/**
	 * Listar ubicaciones (sedes) con casilleros
	 * GET /lockers/locations
	 */
	getLocations: () =>
		ApiService.fetchNormalized<ILockerLocation[]>({
			url: '/lockers/locations',
			method: 'GET',
		}),

	/**
	 * Listar casilleros de una ubicación específica
	 * GET /lockers/locations/{locationId}/lockers
	 */
	getLockersByLocation: (locationId: number) =>
		ApiService.fetchNormalized<ILockerInternal[]>({
			url: `/lockers/locations/${locationId}/lockers`,
			method: 'GET',
		}),

	/**
	 * Info privada de un casillero (por token QR)
	 * GET /lockers/{qrToken}/private-info
	 */
	getPrivateInfo: (qrToken: string) =>
		ApiService.fetchNormalized<ILockerInternal>({
			url: `/lockers/${qrToken}/private-info`,
			method: 'GET',
		}),

	/**
	 * Listar órdenes de servicio
	 * GET /lockers/service-orders
	 */
	getServiceOrders: () =>
		ApiService.fetchNormalized<IServiceOrder[]>({
			url: '/lockers/service-orders',
			method: 'GET',
		}),

	/**
	 * Fase 2: Técnico retira equipo del casillero (Pick Off / Withdraw)
	 * POST /lockers/tech/withdraw
	 * Body: { service_order_id, new_locker_pin }
	 */
	techWithdraw: (data: ITechWithdrawRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/withdraw',
			method: 'POST',
			data,
		}),

	/**
	 * Fase 3: Técnico deposita equipo reparado en casillero (Drop-off)
	 * POST /lockers/tech/drop-off
	 * Body: { locker_id, service_order_id, new_locker_pin }
	 */
	techDropOff: (data: ITechDropOffRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/drop-off',
			method: 'POST',
			data,
		}),

	/**
	 * Fase 5: Resetear / liberar casillero
	 * POST /lockers/tech/reset
	 * Body: { locker_id, new_locker_pin }
	 */
	resetLocker: (data: ITechResetRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/reset',
			method: 'POST',
			data,
		}),

	/**
	 * Marcar orden como lista para retiro del cliente
	 * PATCH /lockers/set-ready-for-pickup
	 * Body: { service_order_id, pin_manual }
	 */
	setReadyForPickup: (data: ISetReadyForPickupRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/set-ready-for-pickup',
			method: 'PATCH',
			data,
		}),
};

export default lockersInternalService;
