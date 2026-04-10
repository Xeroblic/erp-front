/**
 * notebook.options.ts
 * Opciones de selección para el formulario de revisión de Notebook.
 * Los tipos de value derivan de las constantes en notebook.rules.ts (fuente de verdad).
 */
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_SCREEN_CONDITIONS,
	ALLOWED_COVER_CONDITIONS,
	ALLOWED_KEYBOARD_CONDITIONS,
	ALLOWED_KEYBOARD_LAYOUTS,
	ALLOWED_HINGE_CONDITIONS,
	ALLOWED_BATTERY_STATUSES,
	ALLOWED_TOUCHPAD_CONDITIONS,
	ALLOWED_BOTTOM_CONDITIONS,
} from '../../validation/constants/notebook.rules';

// ─── Typed Option Helper ──────────────────────────────────────────────────────

export type TypedOption<T extends string> = { value: T; label: string };

// ─── Union Types derivados de las reglas ──────────────────────────────────────

export type GeneralConditionValue = (typeof ALLOWED_GENERAL_CONDITIONS)[number];
export type StorageTechnologyValue = (typeof ALLOWED_STORAGE_TECHNOLOGIES)[number];
export type ChargerStatusValue = (typeof ALLOWED_CHARGER_STATUSES)[number];
export type ScreenConditionValue = (typeof ALLOWED_SCREEN_CONDITIONS)[number];
export type CoverConditionValue = (typeof ALLOWED_COVER_CONDITIONS)[number];
export type KeyboardConditionValue = (typeof ALLOWED_KEYBOARD_CONDITIONS)[number];
export type KeyboardLayoutValue = (typeof ALLOWED_KEYBOARD_LAYOUTS)[number];
export type HingeConditionValue = (typeof ALLOWED_HINGE_CONDITIONS)[number];
export type BatteryStatusValue = (typeof ALLOWED_BATTERY_STATUSES)[number];
export type TouchpadConditionValue = (typeof ALLOWED_TOUCHPAD_CONDITIONS)[number];
export type BottomConditionValue = (typeof ALLOWED_BOTTOM_CONDITIONS)[number];

// ─── Condición General ────────────────────────────────────────────────────────

export const GENERAL_CONDITION_OPTIONS: TypedOption<GeneralConditionValue>[] = [
	{ value: 'like_new', label: 'Como Nuevo' },
	{ value: 'good_shape', label: 'Buen Estado' },
	{ value: 'visible_wear', label: 'Desgaste Visible' },
	{ value: 'needs_repair', label: 'Requiere Reparación' },
	{ value: 'scrap', label: 'Solo Repuestos' },
];

// ─── Tecnología de Almacenamiento ─────────────────────────────────────────────

export const STORAGE_TECHNOLOGY_OPTIONS: TypedOption<StorageTechnologyValue>[] = [
	{ value: 'HDD', label: 'Disco Duro (HDD)' },
	{ value: 'SSD', label: 'Unidad Sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

// ─── Estado del Cargador ──────────────────────────────────────────────────────

export const CHARGER_STATUS_OPTIONS: TypedOption<ChargerStatusValue>[] = [
	{ value: 'buen_estado', label: 'Buen Estado' },
	{ value: 'cable_en_mal_estado', label: 'Cable En Mal Estado' },
	{ value: 'no_corresponde_a_equipo', label: 'No Corresponde Al Equipo' },
	{ value: 'no_incluye', label: 'No Incluye' },
	{ value: 'broken_charger', label: 'Cargador Roto' },
	{ value: 'broken_port', label: 'Entrada Rota' },
];

// ─── Condición de Pantalla ────────────────────────────────────────────────────

export const SCREEN_CONDITION_OPTIONS: TypedOption<ScreenConditionValue>[] = [
	{ value: 'ok', label: 'Sin Observaciones' },
	{ value: 'minor_wear', label: 'Detalles Leves — Pequeños Signos De Uso O Marcas Por Suciedad' },
	{ value: 'worn', label: 'Con Líneas / Desgaste Visible' },
	{ value: 'spots', label: 'Manchas (Spots) — Máximo Grado C' },
	{ value: 'dead_pixels', label: 'Píxeles Muertos — Máximo Grado B' },
	{ value: 'broken', label: 'Rota / Píxeles Muertos Excesivos / Manchas Excesivas — Grado M' },
];

// ─── Condición de Tapa Superior ───────────────────────────────────────────────

export const COVER_CONDITION_OPTIONS: TypedOption<CoverConditionValue>[] = [
	{ value: 'ok', label: 'Sin Daños' },
	{ value: 'minor_wear', label: 'Daños Leves — Rayaduras Menores Poco Visibles' },
	{ value: 'worn', label: 'Desgaste Visible' },
	{ value: 'missing_pieces', label: 'Con Piezas Faltantes — Máximo Grado C' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

// ─── Condición de Teclado ─────────────────────────────────────────────────────

export const KEYBOARD_CONDITION_OPTIONS: TypedOption<KeyboardConditionValue>[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgaste Visible' },
	{ value: 'missing_pieces', label: 'Con Piezas Faltantes — Máximo Grado C (Máx. 1 Tecla)' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Distribución de Teclado ──────────────────────────────────────────────────

export const KEYBOARD_LAYOUT_OPTIONS: TypedOption<KeyboardLayoutValue>[] = [
	{ value: 'es', label: 'Español (ES)' },
	{ value: 'us', label: 'Inglés (US)' },
	{ value: 'latam', label: 'Latinoamericano' },
];

// ─── Condición de Bisagras ────────────────────────────────────────────────────

export const HINGE_CONDITION_OPTIONS: TypedOption<HingeConditionValue>[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Estado de Batería ────────────────────────────────────────────────────────

export const BATTERY_STATUS_OPTIONS: TypedOption<BatteryStatusValue>[] = [
	{ value: 'excellent', label: 'Excellent' },
	{ value: 'good', label: 'Good' },
	{ value: 'fair', label: 'Fair' },
	{ value: 'poor', label: 'Poor' },
	{ value: 'no_battery', label: 'No Battery / Unknown' },
];

// ─── Condición de Touchpad ────────────────────────────────────────────────────

export const TOUCHPAD_CONDITION_OPTIONS: TypedOption<TouchpadConditionValue>[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Condición de Tapa Inferior ───────────────────────────────────────────────

export const BOTTOM_CONDITION_OPTIONS: TypedOption<BottomConditionValue>[] = [
	{ value: 'ok', label: 'Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Sistema Operativo (sugeridos) ────────────────────────────────────────────

export const OPERATING_SYSTEM_OPTIONS: TypedOption<string>[] = [
	{ value: 'Windows 10 Home', label: 'Windows 10 Home' },
	{ value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
	{ value: 'Windows 11 Home', label: 'Windows 11 Home' },
	{ value: 'Windows 11 Pro', label: 'Windows 11 Pro' },
];

// ─── Tipo de RAM (sugeridos) ──────────────────────────────────────────────────

export const RAM_TYPE_OPTIONS: TypedOption<string>[] = [
	{ value: 'DDR4', label: 'DDR4' },
	{ value: 'DDR5', label: 'DDR5' },
	{ value: 'LPDDR4', label: 'LPDDR4' },
	{ value: 'LPDDR5', label: 'LPDDR5' },
];
