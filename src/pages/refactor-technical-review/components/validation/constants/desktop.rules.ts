/**
 * desktop.rules.ts
 * Constantes de reglas de negocio para la validación del formulario de Desktop.
 * Fuente de verdad para las reglas que afectan la calificación.
 */

// ─── Reglas de Puertos ────────────────────────────────────────────────────────

/**
 * Límite de puertos defectuosos antes de forzar Grado M.
 * - 0 puertos defectuosos: sin restricción
 * - 1 puerto defectuoso: máximo Grado C
 * - 2+ puertos defectuosos: Grado M automáticamente
 */
export const DEFECTIVE_PORTS_MAX_FOR_GRADE_C = 1;
export const DEFECTIVE_PORTS_FORCES_GRADE_M = 2;
export const DEFECTIVE_PORTS_MIN = 0;

// ─── Reglas de Carcasa (Cover/Case) ───────────────────────────────────────────

/**
 * Condiciones de carcasa y su impacto en la calificación máxima.
 */
export const COVER_CONDITION_GRADE_LIMITS: Record<string, string | null> = {
	ok: null,
	good_condition: null,
	light_scratches: 'B', // Rayas leves -> B? O quizás A dependiendo de severidad, pero asumiremos B por seguridad o null si es leve.
	// Revisando JSON del usuario: "light_scratches" -> Rayas leves.
	// Asumiremos lógica similar a notebook: minor_wear (A), worn (B).
	// "light_scratches" suena a "minor_wear".
	// "noticeable_wear" suena a "worn".
	noticeable_wear: 'C', // Desgaste notorio -> C
	broken: 'M',
};

// ─── Reglas de Condición General ─────────────────────────────────────────────

/**
 * Condiciones generales que fuerzan un grado máximo.
 */
export const GENERAL_CONDITION_GRADE_LIMITS: Record<string, string | null> = {
	like_new: null,
	good_shape: null,
	visible_wear: 'B',
	needs_repair: 'M',
	scrap: 'M',
};

// ─── Campos Requeridos ────────────────────────────────────────────────────────

export const DESKTOP_REQUIRED_FIELDS: string[] = [
	'brand',
	'model',
	'general_condition',
	'processor',
	'ram_size',
	'storage_size',
	'storage_technology',
	'cover_condition', // Carcasa
];

export const DESKTOP_RECOMMENDED_FIELDS: string[] = [
	'line',
	'ram_type',
	'ram_slots',
	'includes_charger', // Cable de poder / fuente externa
	'charger_status',
	'has_wifi',
	'has_bluetooth',
	'has_cd_drive',
	'operating_system',
];

// ─── Valores Permitidos ───────────────────────────────────────────────────────

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

export const ALLOWED_COVER_CONDITIONS = [
	'ok',
	'good_condition',
	'light_scratches',
	'noticeable_wear',
	'broken',
] as const;
