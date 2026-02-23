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

export const ALLOWED_SCREEN_CONDITIONS = [
	'ok',
	'minor_wear',
	'worn',
	'missing_pieces',
	'dead_pixels',
	'broken',
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
