// Contrato de `routes/apis/lockers.php` del backend (rama `integration-freescout`).
// El PIN nunca viene dentro de `locker`: sólo lo devuelven check-in, check-out, withdraw,
// drop-off y reset, en la raíz de la respuesta.

export type TLockerStatus = 'available' | 'occupied' | 'ready_for_pickup' | 'quarantine';

export type TServiceOrderLogisticsStatus =
	| 'checked_in'
	| 'in_progress'
	| 'ready_for_pickup'
	| 'checked_out';

// ============================================================================
// ENTIDADES INTERNAS / PANEL TÉCNICO
// ============================================================================

export interface ILockerLocation {
	id: number;
	subsidiary_id: number;
	name: string;
	address: string | null;
	is_active: boolean;
	lockers_count?: number;
}

/** `LockerResource`. */
export interface ILockerInternal {
	id: number;
	location_id: number;
	number: string;
	qr_token: string;
	status: TLockerStatus;
	status_label: string;
	location?: ILockerLocation;
	active_service_order?: IServiceOrder | null;
}

/** `ServiceOrderResource`. */
export interface IServiceOrder {
	id: number;
	locker_id: number;
	freescout_conversation_id: number | null;
	customer_name: string;
	customer_email: string;
	customer_phone: string | null;
	is_invoice: boolean;
	invoice_rut: string | null;
	invoice_company_name: string | null;
	invoice_company_address: string | null;
	service_type: string | null;
	upgrade_type: string | null;
	device_brand: string | null;
	device_model: string | null;
	device_description: string;
	logistics_status: TServiceOrderLogisticsStatus;
	logistics_status_label: string;
	freescout_sync_pending: boolean;
	checked_in_at: string | null;
	checked_out_at: string | null;
	locker?: ILockerInternal;
	updated_at: string | null;
}

export interface ITechWithdrawRequest {
	service_order_id: number;
}

export interface ITechDropOffRequest {
	locker_id: number;
	service_order_id: number;
}

export interface ITechResetRequest {
	locker_id: number;
}

/** Respuesta de withdraw y drop-off: la orden y el PIN nuevo que el técnico fija en el candado. */
export interface ITechOrderActionResponse {
	message: string;
	data: IServiceOrder;
	new_locker_pin: string | null;
}

/** Respuesta de reset: el casillero y su PIN nuevo. */
export interface ITechResetResponse {
	message: string;
	data: ILockerInternal;
	new_locker_pin: string | null;
}

// ============================================================================
// ENTIDADES PÚBLICAS / VISTA CLIENTE
// ============================================================================

export interface ILockerPublicInfo {
	is_available: boolean;
	message: string;
	/** Sólo cuando el casillero no está disponible: números libres de la misma ubicación. */
	available_lockers?: string[];
	available_lockers_count?: number;
}

export interface ICheckInRequest {
	qr_token: string;
	customer_name: string;
	customer_email: string;
	customer_phone?: string;
	device_description: string;
	is_invoice: boolean;
	invoice_rut?: string;
	invoice_company_name?: string;
	invoice_company_address?: string;
	serial_number?: string;
	service_type?: string;
	upgrade_type?: string | null;
	device_brand?: string;
	device_model?: string;
}

export interface ICheckOutRequest {
	qr_token: string;
	withdrawal_keyword: string;
}

export interface ICheckInResponse {
	message: string;
	data: IServiceOrder;
	locker_pin: string | null;
}

export interface ICheckOutResponse {
	message: string;
	data: IServiceOrder;
	locker_number: string;
	locker_pin: string | null;
}
