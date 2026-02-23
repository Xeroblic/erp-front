/**
 * Shared constants for technical review forms
 * These constants are used across multiple forms
 */

export interface OptionType {
    value: string;
    label: string;
    color?: 'green' | 'red' | 'yellow' | 'gray';
    icon?: string;
}

// General condition options - Used by ALL forms
export const GENERAL_CONDITION_OPTIONS: OptionType[] = [
    { value: 'like_new', label: 'Como nuevo', color: 'green' },
    { value: 'good_shape', label: 'Buen estado', color: 'green' },
    { value: 'visible_wear', label: 'Desgaste visible', color: 'yellow' },
    { value: 'needs_repair', label: 'Requiere reparación', color: 'red' },
    { value: 'scrap', label: 'Solo repuestos', color: 'red' },
];

// RAM type options - Used by Notebook, Desktop, AIO
export const RAM_TYPE_OPTIONS: OptionType[] = [
    { value: 'DDR3', label: 'DDR3', color: 'gray' },
    { value: 'DDR4', label: 'DDR4', color: 'gray' },
    { value: 'DDR5', label: 'DDR5', color: 'gray' },
];

// Storage technology options - Used by Notebook, Desktop, AIO
export const STORAGE_TECH_OPTIONS: OptionType[] = [
    { value: 'HDD', label: 'HDD', color: 'gray' },
    { value: 'SSD', label: 'SSD', color: 'gray' },
    { value: 'M2', label: 'M.2', color: 'gray' },
    { value: 'NVME', label: 'NVMe', color: 'gray' },
];

// Charger status options - Used by Notebook, Desktop, AIO
export const CHARGER_STATUS_OPTIONS: OptionType[] = [
    { value: 'buen_estado', label: 'Buen estado', color: 'green' },
    { value: 'cable_en_mal_estado', label: 'Cable dañado', color: 'yellow' },
    { value: 'no_corresponde_a_equipo', label: 'No corresponde', color: 'red' },
    { value: 'no_incluye', label: 'No incluye', color: 'red' },
    { value: 'broken_charger', label: 'Cargador roto', color: 'red' },
    { value: 'broken_port', label: 'Entrada rota', color: 'red' },
];

// Cover condition options - Notebook specific (shared legacy)
export const COVER_CONDITION_OPTIONS: OptionType[] = [
    { value: 'ok', label: 'OK', color: 'green' },
    { value: 'worn', label: 'Desgastado', color: 'yellow' },
    { value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
    { value: 'scratched', label: 'Rayado', color: 'yellow' },
    { value: 'broken', label: 'Roto', color: 'red' },
];

// Screen condition options - Used by AIO, Monitor
export const SCREEN_CONDITION_OPTIONS: OptionType[] = [
    { value: 'ok', label: 'OK', color: 'green' },
    { value: 'minor_wear', label: 'Desgaste menor', color: 'yellow' },
    { value: 'worn', label: 'Desgastado', color: 'yellow' },
    { value: 'spots', label: 'Manchas', color: 'yellow' },
    { value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
    { value: 'dead_pixels', label: 'Píxeles muertos', color: 'red' },
    { value: 'broken', label: 'Roto', color: 'red' },
];

// Stand condition options - Used by AIO, Monitor
export const STAND_CONDITION_OPTIONS: OptionType[] = [
    { value: 'ok', label: 'OK', color: 'green' },
    { value: 'worn', label: 'Desgastado', color: 'yellow' },
    { value: 'missing_pieces', label: 'Piezas faltantes', color: 'red' },
    { value: 'scratched', label: 'Rayado', color: 'yellow' },
    { value: 'broken', label: 'Roto', color: 'red' },
    { value: 'no_stand', label: 'Sin base', color: 'red' },
];
