import {
	ILockerInternal,
	ILockerLocation,
	IServiceOrder,
	TLockerStatus,
} from '@/interface/lockers.interface';

// Respuestas completas de `LockerResource`, `ServiceOrderResource` y `LockerLocationResource`.

export const buildLocation = (overrides: Partial<ILockerLocation> = {}): ILockerLocation => ({
	id: 10,
	subsidiary_id: 3,
	name: 'Sede Centro',
	address: 'Av. Principal 100',
	is_active: true,
	...overrides,
});

export const buildOrder = (overrides: Partial<IServiceOrder> = {}): IServiceOrder => ({
	id: 7,
	locker_id: 1,
	freescout_conversation_id: 501,
	customer_name: 'Ana Pérez',
	customer_email: 'ana@correo.cl',
	customer_phone: '+56911112222',
	is_invoice: false,
	invoice_rut: null,
	invoice_company_name: null,
	invoice_company_address: null,
	service_type: 'reparacion',
	upgrade_type: null,
	device_brand: 'Lenovo',
	device_model: 'ThinkPad T14',
	device_description: 'No enciende',
	logistics_status: 'checked_in',
	logistics_status_label: 'Registrado',
	freescout_sync_pending: false,
	checked_in_at: '2026-10-20T13:00:00.000000Z',
	checked_out_at: null,
	updated_at: '2026-10-20T13:00:00.000000Z',
	...overrides,
});

export const buildLocker = (
	status: TLockerStatus,
	overrides: Partial<ILockerInternal> = {},
): ILockerInternal => ({
	id: 1,
	location_id: 10,
	number: '1',
	qr_token: 'qr-1',
	status,
	status_label: status,
	active_service_order: null,
	...overrides,
});
