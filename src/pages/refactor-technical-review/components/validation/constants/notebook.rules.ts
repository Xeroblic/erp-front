/**
 * notebook.rules.ts
 * Constantes de reglas de negocio para la validación del formulario de Notebook.
 * Estas constantes son la fuente de verdad para las reglas que afectan la calificación.
 *
 * IMPORTANTE: Estas reglas están alineadas con la lógica de gradación del backend.
 */

// ─── Reglas de Batería ────────────────────────────────────────────────────────

/**
 * Rango válido para el porcentaje de batería.
 */
export const BATTERY_PERCENTAGE_MIN = 0;
export const BATTERY_PERCENTAGE_MAX = 100;

/**
 * Umbrales de categoría de batería por porcentaje.
 * Nota: El backend acepta tanto porcentaje como categoría textual.
 */
export const BATTERY_PERCENTAGE_THRESHOLDS = {
	excellent: { min: 80, max: 100 },
	good: { min: 60, max: 79 },
	fair: { min: 40, max: 59 },
	poor: { min: 0, max: 39 },
} as const;

/**
 * Marcas que reportan el health de batería de forma diferente.
 * - Dell: usa "Battery Health" en BIOS/SupportAssist (texto libre o %)
 * - Otras marcas: generalmente solo reportan % de ciclos o no reportan
 *
 * Para Dell: se puede ingresar texto como "Normal", "Service", "Replace Soon"
 * Para otras marcas: se recomienda ingresar el % directamente
 */
export const BATTERY_HEALTH_DELL_STATUSES = ['Normal', 'Service', 'Replace Soon', 'Unknown'] as const;
export const BATTERY_HEALTH_DELL_BRANDS = ['Dell', 'DELL', 'dell'] as const;

/**
 * Determina si una marca es Dell (para mostrar campo de health especial).
 */
export const isDellBrand = (brand: string | null | undefined): boolean => {
	if (!brand) return false;
	return BATTERY_HEALTH_DELL_BRANDS.includes(brand.trim() as any) ||
		brand.trim().toLowerCase() === 'dell';
};

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

// ─── Reglas de Teclado ────────────────────────────────────────────────────────

/**
 * Límite de teclas dañadas/faltantes antes de forzar Grado M.
 * - 1 tecla dañada o faltante: máximo Grado C
 * - 2+ teclas dañadas: Grado M automáticamente
 */
export const KEYBOARD_MAX_MISSING_KEYS_FOR_GRADE_C = 1;

// ─── Reglas de Pantalla ───────────────────────────────────────────────────────

/**
 * Condiciones de pantalla y su impacto en la calificación máxima.
 */
export const SCREEN_CONDITION_GRADE_LIMITS: Record<string, string | null> = {
	ok: null,           // Sin restricción
	minor_wear: 'A',    // Permite Grado A
	worn: 'B',          // Máximo Grado B
	spots: 'C',         // Máximo Grado C
	dead_pixels: 'B',   // Máximo Grado B
	broken: 'M',        // Fuerza Grado M
};

// ─── Reglas de Tapa Superior ──────────────────────────────────────────────────

/**
 * Condiciones de tapa y su impacto en la calificación máxima.
 */
export const COVER_CONDITION_GRADE_LIMITS: Record<string, string | null> = {
	ok: null,
	minor_wear: null,
	worn: 'B',
	missing_pieces: 'C',
	scratched: 'C',
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

/**
 * Campos obligatorios para completar la revisión de notebook.
 * El backend puede rechazar la revisión si faltan estos campos.
 */
export const NOTEBOOK_REQUIRED_FIELDS: string[] = [
	'brand',
	'model',
	'general_condition',
	'processor',
	'ram_size',
	'storage_size',
	'storage_technology',
	'screen_condition',
	'cover_condition',
	'keyboard_condition',
	'battery_status',
];

/**
 * Campos recomendados (no bloquean envío pero mejoran la calificación).
 */
export const NOTEBOOK_RECOMMENDED_FIELDS: string[] = [
	'ram_type',
	'ram_slots',
	'screen_inches',
	'keyboard_layout',
	'hinge_condition',
	'touchpad_condition',
	'battery_health',
	'battery_percentage',
	'includes_charger',
	'has_wifi',
	'has_bluetooth',
];

// ─── Valores Permitidos ───────────────────────────────────────────────────────

export const ALLOWED_GENERAL_CONDITIONS = [
	'like_new',
	'good_shape',
	'visible_wear',
	'needs_repair',
	'scrap',
] as const;

export const ALLOWED_STORAGE_TECHNOLOGIES = [
	'HDD',
	'SSD',
	'M2',
	'NVME',
	'HYBRID',
] as const;

export const ALLOWED_CHARGER_STATUSES = [
	'buen_estado',
	'cable_en_mal_estado',
	'no_corresponde_a_equipo',
	'no_incluye',
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
	'spots',
] as const;

export const ALLOWED_COVER_CONDITIONS = [
	'ok',
	'minor_wear',
	'worn',
	'missing_pieces',
	'scratched',
	'broken',
] as const;

export const ALLOWED_KEYBOARD_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'broken',
] as const;

export const ALLOWED_KEYBOARD_LAYOUTS = ['es', 'us', 'latam'] as const;

export const ALLOWED_HINGE_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'broken',
] as const;

export const ALLOWED_BATTERY_STATUSES = [
	'excellent',
	'good',
	'fair',
	'poor',
	'no_battery',
] as const;

export const ALLOWED_TOUCHPAD_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'broken',
] as const;

export const ALLOWED_BOTTOM_CONDITIONS = [
	'ok',
	'worn',
	'missing_pieces',
	'scratched',
	'broken',
] as const;
