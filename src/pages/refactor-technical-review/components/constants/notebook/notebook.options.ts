/**
 * notebook.options.ts
 * Opciones de selección para el formulario de revisión de Notebook.
 * Derivadas directamente del esquema de campos del backend.
 */

export type SelectOption = { value: string; label: string };

// ─── Condición General ────────────────────────────────────────────────────────

export const GENERAL_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'like_new', label: 'Como Nuevo' },
	{ value: 'good_shape', label: 'Buen Estado' },
	{ value: 'visible_wear', label: 'Desgaste Visible' },
	{ value: 'needs_repair', label: 'Requiere Reparación' },
	{ value: 'scrap', label: 'Solo Repuestos' },
];

// ─── Tecnología de Almacenamiento ─────────────────────────────────────────────

export const STORAGE_TECHNOLOGY_OPTIONS: SelectOption[] = [
	{ value: 'HDD', label: 'Disco Duro (HDD)' },
	{ value: 'SSD', label: 'Unidad Sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

// ─── Estado del Cargador ──────────────────────────────────────────────────────

export const CHARGER_STATUS_OPTIONS: SelectOption[] = [
	{ value: 'buen_estado', label: 'Buen Estado' },
	{ value: 'cable_en_mal_estado', label: 'Cable En Mal Estado' },
	{ value: 'no_corresponde_a_equipo', label: 'No Corresponde Al Equipo' },
	{ value: 'no_incluye', label: 'No Incluye' },
	{ value: 'broken_charger', label: 'Cargador Roto' },
	{ value: 'broken_port', label: 'Entrada Rota' },
];

// ─── Condición de Pantalla ────────────────────────────────────────────────────

export const SCREEN_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Sin Observaciones' },
	{ value: 'minor_wear', label: 'Detalles Leves — Pequeños Signos De Uso O Marcas Por Suciedad' },
	{ value: 'worn', label: 'Con Líneas / Desgaste Visible' },
	{ value: 'spots', label: 'Manchas (Spots) — Máximo Grado C' },
	{ value: 'dead_pixels', label: 'Píxeles Muertos — Máximo Grado B' },
	{ value: 'broken', label: 'Rota / Píxeles Muertos Excesivos / Manchas Excesivas — Grado M' },
];

// ─── Condición de Tapa Superior ───────────────────────────────────────────────

export const COVER_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Sin Daños' },
	{ value: 'minor_wear', label: 'Daños Leves — Rayaduras Menores Poco Visibles' },
	{ value: 'worn', label: 'Desgaste Visible' },
	{ value: 'missing_pieces', label: 'Con Piezas Faltantes — Máximo Grado C' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

// ─── Condición de Teclado ─────────────────────────────────────────────────────

export const KEYBOARD_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgaste Visible' },
	{ value: 'missing_pieces', label: 'Con Piezas Faltantes — Máximo Grado C (Máx. 1 Tecla)' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Distribución de Teclado ──────────────────────────────────────────────────

export const KEYBOARD_LAYOUT_OPTIONS: SelectOption[] = [
	{ value: 'es', label: 'Español (ES)' },
	{ value: 'us', label: 'Inglés (US)' },
	{ value: 'latam', label: 'Latinoamericano' },
];

// ─── Condición de Bisagras ────────────────────────────────────────────────────

export const HINGE_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Estado de Batería ────────────────────────────────────────────────────────

export const BATTERY_STATUS_OPTIONS: SelectOption[] = [
	{ value: 'excellent', label: 'Excelente' },
	{ value: 'good', label: 'Bueno' },
	{ value: 'fair', label: 'Aceptable' },
	{ value: 'poor', label: 'Pobre' },
	{ value: 'no_battery', label: 'Sin Batería' },
];

// ─── Condición de Touchpad ────────────────────────────────────────────────────

export const TOUCHPAD_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Funciona Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Condición de Tapa Inferior ───────────────────────────────────────────────

export const BOTTOM_CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'ok', label: 'Sin Problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan Piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

// ─── Sistema Operativo (sugeridos) ────────────────────────────────────────────

export const OPERATING_SYSTEM_OPTIONS: SelectOption[] = [
	{ value: 'Windows 10 Home', label: 'Windows 10 Home' },
	{ value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
	{ value: 'Windows 11 Home', label: 'Windows 11 Home' },
	{ value: 'Windows 11 Pro', label: 'Windows 11 Pro' },
];

// ─── Tipo de RAM (sugeridos) ──────────────────────────────────────────────────

export const RAM_TYPE_OPTIONS: SelectOption[] = [
	{ value: 'DDR4', label: 'DDR4' },
	{ value: 'DDR5', label: 'DDR5' },
	{ value: 'LPDDR4', label: 'LPDDR4' },
	{ value: 'LPDDR5', label: 'LPDDR5' },
];
