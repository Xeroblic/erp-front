import { ILockerInternal, IServiceOrder, TLockerStatus } from '@/interface/lockers.interface';

// ─────────────────────────────────────────────────
// Estados del casillero según el flujo real (`LockerStatus` del backend)
// ─────────────────────────────────────────────────
// Check-in del cliente → occupied
// Withdraw del técnico → available (PIN nuevo)
// Drop-off del técnico → ready_for_pickup (palabra clave al cliente)
// Check-out del cliente → quarantine
// Reset del técnico    → available (PIN nuevo)
// ─────────────────────────────────────────────────

export type TLockerAction = 'withdraw' | 'dropoff' | 'reset';

/** Acciones del técnico en la tabla; `detail` sólo abre el detalle. */
export type TLockerRowAction = TLockerAction | 'detail';

export const LOCKER_PERMISSIONS = {
	view: 'view-locker',
	operate: 'operate-locker',
} as const;

interface ILockerStatusConfig {
	label: string;
	color: string;
	icon: string;
}

export const LOCKER_STATUS_MAP: Record<TLockerStatus, ILockerStatusConfig> = {
	available: { label: 'Disponible', color: 'emerald', icon: 'HeroCheck' },
	occupied: { label: 'Ocupado', color: 'amber', icon: 'HeroLockClosed' },
	ready_for_pickup: { label: 'Listo para retiro', color: 'blue', icon: 'HeroBell' },
	quarantine: { label: 'En cuarentena', color: 'violet', icon: 'HeroClock' },
};

/** Orden de las tarjetas de resumen. */
export const LOCKER_STATUS_ORDER: TLockerStatus[] = [
	'available',
	'occupied',
	'ready_for_pickup',
	'quarantine',
];

export const getStatusConfig = (status: string): ILockerStatusConfig =>
	status in LOCKER_STATUS_MAP
		? LOCKER_STATUS_MAP[status as TLockerStatus]
		: { label: status, color: 'zinc', icon: 'HeroQuestionMarkCircle' };

/**
 * Acciones que el backend acepta según el estado del casillero:
 *
 * occupied         → withdraw (sólo órdenes en `checked_in`)
 * available        → drop-off (órdenes en `checked_in` o `in_progress`)
 * ready_for_pickup → ninguna: el cliente hace check-out
 * quarantine       → reset (sólo casilleros en cuarentena)
 */
export const getAvailableActions = (status: TLockerStatus): TLockerRowAction[] => {
	if (status === 'occupied') return ['withdraw', 'detail'];
	if (status === 'available') return ['dropoff', 'detail'];
	if (status === 'quarantine') return ['reset', 'detail'];
	return ['detail'];
};

export type TLockerActionCommand =
	| { kind: 'withdraw'; orderId: number }
	| { kind: 'dropoff'; lockerId: number; orderId: number }
	| { kind: 'reset'; lockerId: number };

export interface ILockerActionSubmit {
	orderId: number | null;
	actionLocker: ILockerInternal | null;
}

/**
 * Traduce el envío del modal a la llamada que corresponde. El casillero elegido en el modal
 * manda sobre el que abrió la acción: en drop-off el técnico puede cambiarlo.
 */
export const resolveActionCommand = (
	actionType: TLockerAction | null,
	data: ILockerActionSubmit,
	openedLocker: ILockerInternal | null,
): TLockerActionCommand | null => {
	const lockerId = data.actionLocker?.id ?? openedLocker?.id ?? null;

	if (actionType === 'withdraw' && data.orderId) {
		return { kind: 'withdraw', orderId: data.orderId };
	}
	if (actionType === 'dropoff' && data.orderId && lockerId) {
		return { kind: 'dropoff', lockerId, orderId: data.orderId };
	}
	if (actionType === 'reset' && lockerId) {
		return { kind: 'reset', lockerId };
	}
	return null;
};

/**
 * Órdenes que el backend acepta para cada acción:
 * withdraw → la orden `checked_in` del casillero; drop-off → las que el técnico ya retiró.
 */
export const getEligibleOrders = (
	actionType: TLockerAction | null,
	locker: ILockerInternal | null,
	orders: IServiceOrder[],
): IServiceOrder[] => {
	if (actionType === 'withdraw' && locker) {
		const activeOrder = locker.active_service_order;
		return activeOrder
			? [activeOrder]
			: orders.filter(
					(o) => o.locker_id === locker.id && o.logistics_status === 'checked_in',
				);
	}
	if (actionType === 'dropoff') {
		return orders.filter((o) => o.logistics_status === 'in_progress');
	}
	return [];
};

/** Casilleros donde se puede depositar: los disponibles, más el que abrió la acción. */
export const getDropoffLockers = (
	lockers: ILockerInternal[],
	openedLockerId: number | null,
): ILockerInternal[] => lockers.filter((l) => l.status === 'available' || l.id === openedLockerId);
