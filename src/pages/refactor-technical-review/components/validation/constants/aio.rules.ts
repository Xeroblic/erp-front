/**
 * aio.rules.ts
 * Reglas de negocio restrictivas de la Base de Datos para equipos AIO.
 * Extraídas directamente del esquema (backend).
 */

export const ALLOWED_GENERAL_CONDITIONS = [
	'like_new',
	'good_shape',
	'visible_wear',
	'needs_repair',
	'scrap',
] as const;

export const ALLOWED_STORAGE_TECHNOLOGIES = ['HDD', 'SSD', 'M2', 'NVME', 'HYBRID'] as const;

export const ALLOWED_CHARGER_STATUSES = [
	'good_condition',
	'damaged_cable',
	'not_matching_equipment',
	'not_included',
	'broken_charger',
	'broken_port',
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
	'scratched',
	'broken',
	'no_stand',
] as const;

export const ALLOWED_COVER_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'scratched',
	'broken',
] as const;
