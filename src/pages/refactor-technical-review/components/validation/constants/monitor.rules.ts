/**
 * monitor.rules.ts
 * Reglas de negocio restrictivas de la Base de Datos para equipos Monitor.
 * Extraídas directamente del esquema (backend).
 */

export const ALLOWED_GENERAL_CONDITIONS = [
	'like_new',
	'good_shape',
	'visible_wear',
	'needs_repair',
	'scrap',
] as const;

// `missing_pieces` no es un estado de pantalla de monitor: el backend nunca lo aceptó y el
// selector tampoco lo ofrece. Estaba de más en esta lista, que es la que usa el saneado
// para decidir qué valor descartar antes de reintentar un guardado.
export const ALLOWED_SCREEN_CONDITIONS = [
	'ok',
	'minor_wear',
	'worn',
	'dead_pixels',
	'broken',
	'spots',
	'scratched',
	'lines',
] as const;

export const ALLOWED_STAND_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'broken',
	'no_stand',
] as const;

export const ALLOWED_FRAME_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'scratched',
	'broken',
] as const;
