/**
 * docking.rules.ts
 * Reglas de negocio restrictivas de la Base de Datos para equipos Docking.
 * Extraídas directamente del esquema (backend).
 */

export const ALLOWED_GENERAL_CONDITIONS = [
	'like_new',
	'good_shape',
	'visible_wear',
	'needs_repair',
	'scrap',
] as const;

export const ALLOWED_COVER_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'scratched',
	'broken',
] as const;
