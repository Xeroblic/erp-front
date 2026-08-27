import * as Yup from 'yup';

// ─────────────────────────────────────────────────
// Estados del casillero según el flujo real
// ─────────────────────────────────────────────────
// Fase 1 (Check-in)    → occupied
// Fase 2 (Withdraw)    → available
// Fase 4 (Drop-off)    → waiting_pickup / en espera de retiro
// Fase 5 (Check-out)   → quarantine / en cuarentena
// Fase 6 (Reset)       → available
// ─────────────────────────────────────────────────

export const LOCKER_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
	available: { label: 'Disponible', color: 'emerald', icon: 'HeroCheck' },
	occupied: { label: 'Ocupado', color: 'amber', icon: 'HeroLockClosed' },
	waiting_pickup: { label: 'Esperando Retiro', color: 'blue', icon: 'HeroBell' },
	quarantine: { label: 'En Cuarentena', color: 'violet', icon: 'HeroClock' },
	maintenance: { label: 'Mantenimiento', color: 'red', icon: 'HeroWrench' },
	reserved: { label: 'Reservado', color: 'sky', icon: 'HeroBookmark' },
};

/**
 * Devuelve la configuración visual para un estado.
 * Soporta variantes del backend (snake_case, texto en español, etc.)
 */
export const getStatusConfig = (status: string) => {
	// Normalizar posibles variantes
	const normalized = status?.toLowerCase().replace(/[\s-]/g, '_') ?? '';

	// Mapeo de variantes conocidas
	const aliasMap: Record<string, string> = {
		available: 'available',
		disponible: 'available',
		occupied: 'occupied',
		ocupado: 'occupied',
		waiting_pickup: 'waiting_pickup',
		waiting_for_pickup: 'waiting_pickup',
		en_espera_de_retiro: 'waiting_pickup',
		ready_for_pickup: 'waiting_pickup',
		quarantine: 'quarantine',
		en_cuarentena: 'quarantine',
		maintenance: 'maintenance',
		mantenimiento: 'maintenance',
		reserved: 'reserved',
		reservado: 'reserved',
	};

	const key = aliasMap[normalized] || normalized;
	return (
		LOCKER_STATUS_MAP[key] || { label: status, color: 'zinc', icon: 'HeroQuestionMarkCircle' }
	);
};

/**
 * Determina qué acciones están disponibles según el estado del casillero.
 * Sigue el flujo del diagrama exactamente:
 *
 * occupied        → Retirar equipo (Fase 2: tech/withdraw)
 * available       → Depositar equipo reparado (Fase 4: tech/drop-off) — solo si hay orden pendiente
 * waiting_pickup  → (Sin acción técnica — el cliente hace check-out)
 * quarantine      → Resetear casillero (Fase 6: tech/reset)
 */
export const getAvailableActions = (status: string): string[] => {
	const config = getStatusConfig(status);
	const label = config.label;

	// Usar el label normalizado para decidir
	if (label === 'Ocupado') return ['withdraw', 'reset', 'detail'];
	if (label === 'Disponible') return ['dropoff', 'detail'];
	if (label === 'Esperando Retiro') return ['reset', 'detail'];
	if (label === 'En Cuarentena') return ['reset', 'detail'];
	if (label === 'Mantenimiento') return ['reset', 'detail'];

	return ['reset', 'detail'];
};
