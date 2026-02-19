/**
 * desktop.options.ts
 * Opciones de selección para el formulario de revisión de Desktop.
 * Los tipos de value derivan de las constantes en desktop.rules.ts (fuente de verdad).
 */
import {
	ALLOWED_GENERAL_CONDITIONS,
	ALLOWED_STORAGE_TECHNOLOGIES,
	ALLOWED_CHARGER_STATUSES,
	ALLOWED_COVER_CONDITIONS,
} from '../../validation/constants/desktop.rules';

// ─── Typed Option Helper ──────────────────────────────────────────────────────

export type TypedOption<T extends string> = { value: T; label: string };

// ─── Union Types derivados de las reglas ──────────────────────────────────────

export type GeneralConditionValue = (typeof ALLOWED_GENERAL_CONDITIONS)[number];
export type StorageTechnologyValue = (typeof ALLOWED_STORAGE_TECHNOLOGIES)[number];
export type ChargerStatusValue = (typeof ALLOWED_CHARGER_STATUSES)[number];
export type CoverConditionValue = (typeof ALLOWED_COVER_CONDITIONS)[number];

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

// ─── Estado del Cargador (Fuente Externa / Cable de Poder) ────────────────────

export const CHARGER_STATUS_OPTIONS: TypedOption<ChargerStatusValue>[] = [
	{ value: 'good_condition', label: 'Buen Estado' },
	{ value: 'damaged_cable', label: 'Cable En Mal Estado' },
	{ value: 'not_matching_equipment', label: 'No Corresponde Al Equipo' },
	{ value: 'not_included', label: 'No Incluye' },
	{ value: 'broken_charger', label: 'Cargador Roto' },
	{ value: 'broken_port', label: 'Entrada Rota' },
];

// ─── Condición de Carcasa (Case) ──────────────────────────────────────────────

export const COVER_CONDITION_OPTIONS: TypedOption<CoverConditionValue>[] = [
	{ value: 'ok', label: 'Sin Daños' },
	{ value: 'good_condition', label: 'Buen Estado' },
	{ value: 'light_scratches', label: 'Rayas Leves' },
	{ value: 'noticeable_wear', label: 'Desgaste Notorio' },
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
	{ value: 'DDR3', label: 'DDR3' },
	{ value: 'DDR4', label: 'DDR4' },
	{ value: 'DDR5', label: 'DDR5' },
];
