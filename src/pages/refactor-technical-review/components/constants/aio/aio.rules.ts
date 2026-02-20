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

// ─── Options Arrays for UI React-Select/Radios ──────────────────────────────

export const STORAGE_TECHNOLOGY_OPTIONS = [
	{ value: 'HDD', label: 'Disco duro (HDD)' },
	{ value: 'SSD', label: 'Unidad sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

export const GENERAL_CONDITION_OPTIONS = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

export const CHARGER_STATUS_OPTIONS = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable en mal estado' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo' },
	{ value: 'not_included', label: 'No incluye' },
	{ value: 'broken_charger', label: 'Cargador roto' },
	{ value: 'broken_port', label: 'Entrada rota' },
];

export const SCREEN_CONDITION_OPTIONS = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Leve desgaste' }, // Normalized label from minor_wear
	{ value: 'worn', label: 'Desgaste notorio' }, // Normalized from worn
	{ value: 'missing_pieces', label: 'Faltan piezas' }, // Adjusted to match standard missing pieces meaning although JSON had 'Desgaste notorio'
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Roto' },
];

export const STAND_CONDITION_OPTIONS = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Leve desgaste' },
	{ value: 'missing_pieces', label: 'Desgaste notorio' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Base mala' },
	{ value: 'no_stand', label: 'N/A (no aplica)' },
];

export const COVER_CONDITION_OPTIONS = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Leve desgaste' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];
