/**
 * Technical Reviews - Validation Options Constants
 * Opciones compartidas para formularios de validación
 * ESTAS SON LAS MISMAS OPCIONES QUE USA EL BACKEND
 */
import type { TSelectOption } from '@/components/form/SelectReact';

/**
 * Storage Technology Options
 * Usado en: Notebook, Desktop, AIO
 */
export const STORAGE_TECHNOLOGY_OPTIONS: TSelectOption[] = [
	{ value: 'HDD', label: 'Disco duro (HDD)' },
	{ value: 'SSD', label: 'Unidad sólida (SSD)' },
	{ value: 'M2', label: 'M.2' },
	{ value: 'NVME', label: 'NVMe' },
	{ value: 'HYBRID', label: 'Híbrido' },
];

/**
 * General Condition Options
 * Usado en: Todos los tipos (campos comunes)
 */
export const GENERAL_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'like_new', label: 'Como nuevo' },
	{ value: 'good_shape', label: 'Buen estado' },
	{ value: 'visible_wear', label: 'Desgaste visible' },
	{ value: 'needs_repair', label: 'Requiere reparación' },
	{ value: 'scrap', label: 'Solo repuestos' },
];

/**
 * Component Condition Options (Basic)
 * Usado en: Bisagras, Touchpad, Teclado básico
 */
export const COMPONENT_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'Funciona sin problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'broken', label: 'Roto' },
];

/**
 * Component Condition Options (With Scratched)
 * Usado en: Carcasa, Tapa inferior, Cover
 */
export const COMPONENT_CONDITION_SCRATCHED_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'Funciona sin problemas' },
	{ value: 'worn', label: 'Desgastado' },
	{ value: 'missing_pieces', label: 'Faltan piezas' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Roto' },
];

/**
 * Screen Condition Options
 * Usado en: Notebook, AIO, Monitor
 */
export const SCREEN_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'Sin observaciones' },
	{
		value: 'minor_wear',
		label: 'Detalles leves - pequeños signos de uso o marcas por suciedad (Permite: Grado A)',
	},
	{
		value: 'worn',
		label: 'Con Líneas / Desgaste visible / manchas blancas - máximo 1 mancha (Limita a: Máximo Grado B)',
	},
	{ value: 'dead_pixels', label: 'Píxeles muertos' },
	{ value: 'spots', label: 'Manchas' },
	{
		value: 'broken',
		label: 'Rota/Píxeles Muertos excesivos/Manchas excesivas (Limita a: Grado M - Malo)',
	},
];

/**
 * Cover Condition Options (Notebook)
 * Usado en: Tapa superior de Notebook
 */
export const COVER_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'Sin daños' },
	{
		value: 'minor_wear',
		label: 'Daños leves - rayaduras menores poco visibles y signos de uso (no afecta apariencia general)',
	},
	{ value: 'worn', label: 'Desgaste visible' },
	{ value: 'missing_pieces', label: 'Con Piezas Faltantes (Limita a: Máximo Grado C)' },
	{ value: 'scratched', label: 'Rayada' },
	{ value: 'broken', label: 'Rota' },
];

/**
 * Keyboard Condition Options
 * Usado en: Notebook
 */
export const KEYBOARD_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'Funciona sin problemas' },
	{ value: 'worn', label: 'Desgaste visible' },
	{
		value: 'missing_pieces',
		label: 'Con Piezas Faltantes (Faltan teclas o piezas del teclado) - ADVERTENCIA: Máximo Grado C (como máximo 1 tecla dañada o faltante)',
	},
	{ value: 'broken', label: 'Roto' },
];

/**
 * Keyboard Layout Options
 * Usado en: Notebook
 */
export const KEYBOARD_LAYOUT_OPTIONS: TSelectOption[] = [
	{ value: 'es', label: 'Español (ES)' },
	{ value: 'us', label: 'Inglés (US)' },
	{ value: 'latam', label: 'Latinoamericano' },
];

/**
 * Battery Status Options
 * Usado en: Notebook
 */
export const BATTERY_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'excellent', label: 'Excelente (>80%)' },
	{ value: 'good', label: 'Bueno (60-80%)' },
	{ value: 'fair', label: 'Aceptable (40-60%)' },
	{ value: 'poor', label: 'Pobre (<40%)' },
	{ value: 'no_battery', label: 'Sin batería' },
];

/**
 * Charger Status Options
 * Usado en: Notebook, AIO
 */
export const CHARGER_STATUS_OPTIONS: TSelectOption[] = [
	{ value: 'buen_estado', label: 'Buen estado' },
	{ value: 'cable_en_mal_estado', label: 'Cable en mal estado' },
	{ value: 'no_corresponde_a_equipo', label: 'No corresponde al equipo' },
	{ value: 'no_incluye', label: 'No incluye' },
	{ value: 'broken_charger', label: 'Cargador roto' },
	{ value: 'broken_port', label: 'Entrada rota' },
];

/**
 * Stand Condition Options
 * Usado en: AIO, Monitor
 */
export const STAND_CONDITION_OPTIONS: TSelectOption[] = [
	{ value: 'ok', label: 'OK' },
	{ value: 'worn', label: 'Leve desgaste' },
	{ value: 'missing_pieces', label: 'Desgaste notorio' },
	{ value: 'scratched', label: 'Rayado' },
	{ value: 'broken', label: 'Base mala' },
	{ value: 'no_stand', label: 'N/A (no aplica)' },
];

/**
 * RAM Type Suggestions
 */
export const RAM_TYPE_SUGGESTIONS: string[] = ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5'];

/**
 * Operating System Suggestions
 */
export const OPERATING_SYSTEM_SUGGESTIONS: string[] = [
	'Windows 10 Home',
	'Windows 10 Pro',
	'Windows 11 Home',
	'Windows 11 Pro',
	'Ubuntu',
	'No instalado',
];

/**
 * Storage Size Common Values
 */
export const STORAGE_SIZE_SUGGESTIONS: string[] = ['128GB', '256GB', '512GB', '1TB', '2TB'];

/**
 * RAM Size Common Values
 */
export const RAM_SIZE_SUGGESTIONS: string[] = ['4GB', '8GB', '16GB', '32GB', '64GB'];

/**
 * Screen Inches Common Values
 */
export const SCREEN_INCHES_SUGGESTIONS: string[] = [
	'13.3"',
	'14"',
	'15.6"',
	'17"',
	'21.5"',
	'24"',
	'27"',
];

/**
 * Charger Watts Common Values
 */
export const CHARGER_WATTS_SUGGESTIONS: string[] = ['45W', '65W', '90W', '135W', '180W'];

/**
 * Helper para obtener label de opción por value
 */
export const getOptionLabel = (
	options: TSelectOption[],
	value: string | null | undefined,
): string => {
	if (!value) return 'N/A';
	const option = options.find((opt) => opt.value === value);
	return option?.label || value;
};



export const DETAIL_FIELDS_TEMPLATE: Record<string, string[]> = {
	notebook: [
		'brand',
		'model',
		'line',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'includes_charger',
		'charger_watts',
		'charger_status',
		'other_includes',
		'battery_status',
		'battery_health',
		'battery_percentage',
		'battery_holds_charge',
		'battery_condition',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'lector_de_tarjetas_sd',
		'rj45_ports',
		'has_wifi',
		'has_bluetooth',
		'all_ports_functional',
		'defective_ports_count',
		'screen_inches',
		'screen_condition',
		'is_touchscreen',
		'keyboard_condition',
		'keyboard_layout',
		'has_numeric_keypad',
		'has_backlit_keyboard',
		'touchpad_condition',
		'general_condition',
		'cover_condition',
		'hinge_condition',
		'bottom_condition',
		'operating_system',
		'observations',
	],
	desktop: [
		'brand',
		'model',
		'line',
		'general_condition',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'operating_system',
		'has_cd_drive',
		'cover_condition',
		'has_wifi',
		'has_bluetooth',
		'observations',
	],
	aio: [
		'brand',
		'model',
		'line',
		'general_condition',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'operating_system',
		'has_cd_drive',
		'screen_inches',
		'screen_condition',
		'is_touchscreen',
		'cover_condition',
		'stand_condition',
		'includes_charger',
		'charger_status',
		'has_wifi',
		'has_bluetooth',
		'observations',
	],
	monitor: [
		'brand',
		'model',
		'line',
		'general_condition',
		'screen_inches',
		'screen_resolution',
		'screen_condition',
		'is_touchscreen',
		'frame_condition',
		'stand_condition',
		'vga_ports',
		'dvi_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'all_ports_functional',
		'critical_defective_ports_count',
		'observations',
	],
	docking: [
		'brand',
		'model',
		'line',
		'general_condition',
		'includes_power_adapter',
		'includes_charger',
		'power_cable_status',
		'charger_status',
		'cover_condition',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'sd_readers',
		'lector_de_tarjetas_sd',
		'rj45_ports',
		'has_wifi',
		'has_bluetooth',
		'all_ports_functional',
		'defective_ports_count',
		'observations',
	],
};

