interface SelectOption {
	value: string;
	label: string;
}

// ─── Condición general ───
export const GENERAL_CONDITIONS: SelectOption[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Necesita reparación' },
	{ value: 'scrap', label: 'Scrap / Desecho' },
];

// ─── Pantalla ───
export const SCREEN_CONDITIONS_NOTEBOOK: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste menor' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Rota' },
	{ value: 'spots', label: 'Manchas' },
];

export const SCREEN_CONDITIONS_AIO: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste menor' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Rota' },
];

export const SCREEN_CONDITIONS_MONITOR: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste menor' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'broken', label: 'Rota' },
	{ value: 'spots', label: 'Manchas' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'lines', label: 'Líneas' },
];

// ─── Carcasa / Estética ───
export const COVER_CONDITIONS_NOTEBOOK: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'minor_wear', label: 'Desgaste menor' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

export const COVER_CONDITIONS_DESKTOP: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'light_scratches', label: 'Rayaduras leves' },
	{ value: 'noticeable_wear', label: 'Desgaste notorio' },
	{ value: 'broken', label: 'Rota' },
];

export const COVER_CONDITIONS_GENERIC: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

export const STAND_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
	{ value: 'no_stand', label: 'Sin base' },
];

export const STAND_CONDITIONS_MONITOR: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'broken', label: 'Rota' },
	{ value: 'no_stand', label: 'Sin base' },
];

export const FRAME_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

export const HINGE_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'broken', label: 'Rota' },
];

export const TOUCHPAD_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'broken', label: 'Roto' },
];

export const BOTTOM_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastada' },
	{ value: 'missing_pieces', label: 'Piezas faltantes' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

// ─── Teclado ───
export const KEYBOARD_CONDITIONS: SelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Teclas faltantes' },
	{ value: 'broken', label: 'Roto' },
];

export const KEYBOARD_LAYOUTS: SelectOption[] = [
	{ value: 'es', label: 'Español' },
	{ value: 'us', label: 'Inglés (US)' },
	{ value: 'latam', label: 'Latinoamericano' },
];

// ─── Batería ───
export const BATTERY_STATUSES: SelectOption[] = [
	{ value: 'excellent', label: 'Excelente' },
	{ value: 'good', label: 'Buena' },
	{ value: 'fair', label: 'Aceptable' },
	{ value: 'poor', label: 'Mala' },
	{ value: 'no_battery', label: 'Sin batería' },
];

// ─── Almacenamiento ───
export const STORAGE_TECHNOLOGIES: SelectOption[] = [
	{ value: 'HDD', label: 'HDD' },
	{ value: 'SSD', label: 'SSD' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

// ─── Cargador ───
export const CHARGER_STATUSES_NOTEBOOK: SelectOption[] = [
	{ value: 'buen_estado', label: 'Buen estado' },
	{ value: 'cable_en_mal_estado', label: 'Cable en mal estado' },
	{ value: 'no_corresponde_a_equipo', label: 'No corresponde al equipo' },
	{ value: 'no_incluye', label: 'No incluye' },
	{ value: 'broken_charger', label: 'Cargador roto' },
	{ value: 'broken_port', label: 'Puerto roto' },
];

export const CHARGER_STATUSES_DESKTOP: SelectOption[] = [
	{ value: 'good_condition', label: 'Buen estado' },
	{ value: 'damaged_cable', label: 'Cable dañado' },
	{ value: 'not_matching_equipment', label: 'No corresponde' },
	{ value: 'not_included', label: 'No incluido' },
	{ value: 'broken_charger', label: 'Cargador roto' },
	{ value: 'broken_port', label: 'Puerto roto' },
];
