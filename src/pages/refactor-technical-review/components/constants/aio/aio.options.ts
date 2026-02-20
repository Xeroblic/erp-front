/**
 * aio.options.ts
 * Opciones de selección para el formulario de revisión de AIO.
 * Los tipos de value derivan de las constantes en aio.rules.ts (fuente de verdad).
 */
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_STAND_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
} from './aio.rules';

// ─── Typed Option Helper ──────────────────────────────────────────────────────

export type TypedOption<T extends string> = { value: T; label: string };

// ─── Union Types derivados de las reglas ──────────────────────────────────────

export type GeneralConditionValue = (typeof ALLOWED_GENERAL_CONDITIONS)[number];
export type StorageTechnologyValue = (typeof ALLOWED_STORAGE_TECHNOLOGIES)[number];
export type ChargerStatusValue = (typeof ALLOWED_CHARGER_STATUSES)[number];
export type ScreenConditionValue = (typeof ALLOWED_SCREEN_CONDITIONS)[number];
export type StandConditionValue = (typeof ALLOWED_STAND_CONDITIONS)[number];
export type CoverConditionValue = (typeof ALLOWED_COVER_CONDITIONS)[number];

// ─── Condición General ────────────────────────────────────────────────────────

export const GENERAL_CONDITION_OPTIONS: TypedOption<GeneralConditionValue>[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

// ─── Tecnología de Almacenamiento ─────────────────────────────────────────────

export const STORAGE_TECHNOLOGY_OPTIONS: TypedOption<StorageTechnologyValue>[] = [
	{ value: 'HDD', label: 'Disco duro (HDD)' },
	{ value: 'SSD', label: 'Unidad sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

// ─── Estado del Cargador ──────────────────────────────────────────────────────

export const CHARGER_STATUS_OPTIONS: TypedOption<ChargerStatusValue>[] = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable en mal estado' },
	{ value: 'not_matching_equipment', label: 'No corresponde al equipo' },
	{ value: 'not_included', label: 'No incluye' },
	{ value: 'broken_charger', label: 'Cargador roto' },
	{ value: 'broken_port', label: 'Entrada rota' },
];

// ─── Condición de Pantalla ────────────────────────────────────────────────────

export const SCREEN_CONDITION_OPTIONS: TypedOption<ScreenConditionValue>[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Leve desgaste' },
	{ value: 'worn', label: 'Desgaste notorio' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Condición de la Base ─────────────────────────────────────────────────────

export const STAND_CONDITION_OPTIONS: TypedOption<StandConditionValue>[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Leve desgaste' },
	{ value: 'missing_pieces', label: 'Desgaste notorio' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Base mala' },
	{ value: 'no_stand', label: 'N/A (no aplica)' },
];

// ─── Condición de Tapa Trasera / Carcasa ───────────────────────────────────────

export const COVER_CONDITION_OPTIONS: TypedOption<CoverConditionValue>[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Leve desgaste' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Sistema Operativo (sugeridos) ────────────────────────────────────────────

export const OPERATING_SYSTEM_OPTIONS: TypedOption<string>[] = [
	{ value: 'Windows 10 Home', label: 'Windows 10 Home' },
	{ value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
	{ value: 'Windows 11 Home', label: 'Windows 11 Home' },
	{ value: 'Windows 11 Pro', label: 'Windows 11 Pro' },
	{ value: 'macOS', label: 'macOS' }, // AIO frequently are iMacs
];

// ─── Tipo de RAM (sugeridos) ──────────────────────────────────────────────────

export const RAM_TYPE_OPTIONS: TypedOption<string>[] = [
	{ value: 'DDR4', label: 'DDR4' },
	{ value: 'DDR5', label: 'DDR5' },
	{ value: 'LPDDR4', label: 'LPDDR4' },
	{ value: 'LPDDR5', label: 'LPDDR5' },
];
