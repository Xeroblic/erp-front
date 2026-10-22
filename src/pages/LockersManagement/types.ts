import { TLockerStatus } from '@/interface/lockers.interface';

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
